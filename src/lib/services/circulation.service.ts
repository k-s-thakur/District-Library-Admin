import { prisma } from "../prisma";

const TX_OPTIONS = { maxWait: 20000, timeout: 60000 };

export interface IssueBookParams {
  memberIdentifier: string; // memberNo or memberId
  copyIdentifier: string;   // qrCodeToken or accessionNo or copyId
  actorId: string;
}

export interface ReturnBookParams {
  copyIdentifier: string;
  actorId: string;
}

export interface RenewLoanParams {
  loanId: string;
  actorId: string;
}

export interface ReserveBookParams {
  memberId: string;
  bookId: string;
}

export async function issueBook(params: IssueBookParams) {
  return await prisma.$transaction(async (tx) => {
    // 1. Identify member
    const member = await tx.member.findFirst({
      where: {
        OR: [{ id: params.memberIdentifier }, { memberNo: params.memberIdentifier }],
      },
      include: {
        loans: { where: { status: "ACTIVE" } },
        feeCharges: { where: { status: { in: ["OUTSTANDING", "PARTIALLY_PAID"] } } },
      },
    });

    if (!member) {
      throw new Error(`Member "${params.memberIdentifier}" was not found.`);
    }

    if (member.status !== "ACTIVE") {
      throw new Error(`Circulation denied: Member status is "${member.status}".`);
    }

    if (new Date(member.expiryDate) < new Date()) {
      throw new Error(`Membership expired on ${new Date(member.expiryDate).toLocaleDateString()}. Renewal required.`);
    }

    // 2. Policy limit check
    const policy = (await tx.libraryPolicy.findUnique({
      where: { category: member.category },
    })) || {
      loanDurationDays: 14,
      maxBooks: member.maxBooks || 3,
      gracePeriodDays: 2,
      fineRatePerDay: 2.0,
      maxFine: 150.0,
      allowRenewal: true,
      renewalLimit: 2,
    };

    if (member.loans.length >= policy.maxBooks) {
      throw new Error(`Borrowing limit reached: Member has ${member.loans.length} active loan(s), quota is ${policy.maxBooks}.`);
    }

    const totalOutstandingDues = member.feeCharges.reduce((acc, c) => acc + c.balance, 0);
    if (totalOutstandingDues > 200.0) {
      throw new Error(`Circulation blocked: Outstanding dues of ₹${totalOutstandingDues.toFixed(2)} must be cleared.`);
    }

    // 3. Find physical copy
    const copy = await tx.bookCopy.findFirst({
      where: {
        OR: [
          { id: params.copyIdentifier },
          { accessionNo: params.copyIdentifier },
          { qrCodeToken: params.copyIdentifier },
        ],
      },
      include: {
        book: {
          include: {
            reservations: {
              where: { status: { in: ["PENDING", "READY_FOR_PICKUP"] } },
              orderBy: { queuePosition: "asc" },
            },
          },
        },
      },
    });

    if (!copy) {
      throw new Error(`Book copy "${params.copyIdentifier}" not found.`);
    }

    if (copy.status !== "AVAILABLE") {
      if (copy.status === "RESERVED") {
        const topRes = copy.book.reservations[0];
        if (topRes && topRes.memberId !== member.id) {
          throw new Error("This physical copy is held under reservation for another member.");
        }
      } else {
        throw new Error(`Book copy is not lendable (Current status: ${copy.status}).`);
      }
    }

    // 4. Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + policy.loanDurationDays);

    // 5. Atomic check-and-set copy status to prevent concurrent double-issue
    const updateResult = await tx.bookCopy.updateMany({
      where: {
        id: copy.id,
        status: { in: ["AVAILABLE", "RESERVED"] },
      },
      data: { status: "ISSUED" },
    });

    if (updateResult.count === 0) {
      throw new Error(`Physical copy "${copy.accessionNo}" is no longer available (already issued by another process).`);
    }

    // 6. Create loan record
    const loan = await tx.loan.create({
      data: {
        copyId: copy.id,
        memberId: member.id,
        dueDate,
        status: "ACTIVE",
        issuedBy: params.actorId,
      },
    });

    // 7. Fulfill reservation if applicable
    const existingRes = copy.book.reservations.find((r) => r.memberId === member.id);
    if (existingRes) {
      await tx.reservation.update({
        where: { id: existingRes.id },
        data: { status: "FULFILLED" },
      });
    }

    // 8. Audit Log
    await tx.auditLog.create({
      data: {
        actorId: params.actorId,
        action: "LOAN_ISSUED",
        entityType: "Loan",
        entityId: loan.id,
        metadataJson: JSON.stringify({
          memberNo: member.memberNo,
          accessionNo: copy.accessionNo,
          title: copy.book.title,
          dueDate: dueDate.toISOString(),
        }),
      },
    });

    return {
      loan,
      member: {
        id: member.id,
        memberNo: member.memberNo,
        name: member.fullName,
      },
      book: {
        title: copy.book.title,
        accessionNo: copy.accessionNo,
        shelfLocation: copy.shelfLocation,
      },
    };
  }, TX_OPTIONS);
}

export async function returnBook(params: ReturnBookParams) {
  return await prisma.$transaction(async (tx) => {
    // 1. Find copy
    const copy = await tx.bookCopy.findFirst({
      where: {
        OR: [
          { id: params.copyIdentifier },
          { accessionNo: params.copyIdentifier },
          { qrCodeToken: params.copyIdentifier },
        ],
      },
      include: {
        book: {
          include: {
            reservations: {
              where: { status: "PENDING" },
              orderBy: { queuePosition: "asc" },
            },
          },
        },
      },
    });

    if (!copy) {
      throw new Error(`Book copy "${params.copyIdentifier}" not found.`);
    }

    // 2. Find active loan
    const loan = await tx.loan.findFirst({
      where: { copyId: copy.id, status: "ACTIVE" },
      include: {
        member: true,
      },
    });

    if (!loan) {
      throw new Error(`No active loan found for copy "${copy.accessionNo}". It may already have been returned.`);
    }

    // 3. Check overdue and assess fine
    const now = new Date();
    const dueDate = new Date(loan.dueDate);
    let isOverdue = false;
    let assessedFineAmount = 0.0;
    let feeCharge: any = null;

    if (now > dueDate) {
      const diffMs = now.getTime() - dueDate.getTime();
      const overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      const policy = (await tx.libraryPolicy.findUnique({
        where: { category: loan.member.category },
      })) || {
        gracePeriodDays: 2,
        fineRatePerDay: 2.0,
        maxFine: 150.0,
      };

      if (overdueDays > policy.gracePeriodDays) {
        const chargeableDays = overdueDays - policy.gracePeriodDays;
        assessedFineAmount = Math.min(chargeableDays * policy.fineRatePerDay, policy.maxFine);
        isOverdue = true;

        if (assessedFineAmount > 0) {
          feeCharge = await tx.feeCharge.create({
            data: {
              memberId: loan.memberId,
              loanId: loan.id,
              chargeType: "LATE_FINE",
              description: `Overdue late fine for "${copy.book.title}" (${overdueDays} days overdue, grace: ${policy.gracePeriodDays} days)`,
              amount: assessedFineAmount,
              balance: assessedFineAmount,
              paidAmount: 0.0,
              status: "OUTSTANDING",
            },
          });
        }
      }
    }

    // 4. Close loan
    await tx.loan.update({
      where: { id: loan.id },
      data: {
        returnedAt: now,
        status: "RETURNED",
        returnedBy: params.actorId,
      },
    });

    // 5. Update copy status: check if next reservation exists
    let nextStatus = "AVAILABLE";
    if (copy.book.reservations.length > 0) {
      nextStatus = "RESERVED";
      await tx.reservation.update({
        where: { id: copy.book.reservations[0].id },
        data: { status: "READY_FOR_PICKUP" },
      });
    }

    await tx.bookCopy.update({
      where: { id: copy.id },
      data: { status: nextStatus },
    });

    // 6. Audit Log
    await tx.auditLog.create({
      data: {
        actorId: params.actorId,
        action: "LOAN_RETURNED",
        entityType: "Loan",
        entityId: loan.id,
        metadataJson: JSON.stringify({
          memberNo: loan.member.memberNo,
          accessionNo: copy.accessionNo,
          isOverdue,
          fineAmount: assessedFineAmount,
        }),
      },
    });

    return {
      success: true,
      loanId: loan.id,
      member: {
        id: loan.member.id,
        memberNo: loan.member.memberNo,
        fullName: loan.member.fullName,
      },
      book: {
        title: copy.book.title,
        accessionNo: copy.accessionNo,
        shelfLocation: copy.shelfLocation,
      },
      isOverdue,
      assessedFineAmount,
      feeCharge,
    };
  }, TX_OPTIONS);
}

export async function renewLoan(params: RenewLoanParams) {
  return await prisma.$transaction(async (tx) => {
    // 1. Find loan with member, copy, book, and reservations
    const loan = await tx.loan.findUnique({
      where: { id: params.loanId },
      include: {
        member: {
          include: {
            feeCharges: { where: { status: { in: ["OUTSTANDING", "PARTIALLY_PAID"] } } },
          },
        },
        copy: {
          include: {
            book: {
              include: {
                reservations: {
                  where: { status: { in: ["PENDING", "READY_FOR_PICKUP"] } },
                  orderBy: { queuePosition: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!loan) {
      throw new Error(`Loan with ID "${params.loanId}" was not found.`);
    }

    if (loan.status !== "ACTIVE") {
      throw new Error(`Renewal rejected: Loan is "${loan.status}" and cannot be renewed.`);
    }

    // 2. Validate member eligibility
    const member = loan.member;
    if (member.status !== "ACTIVE") {
      throw new Error(`Renewal denied: Member status is "${member.status}".`);
    }

    if (new Date(member.expiryDate) < new Date()) {
      throw new Error(`Renewal denied: Membership expired on ${new Date(member.expiryDate).toLocaleDateString()}.`);
    }

    const totalOutstandingDues = member.feeCharges.reduce((acc, c) => acc + c.balance, 0);
    if (totalOutstandingDues > 200.0) {
      throw new Error(`Renewal blocked: Member has outstanding dues of ₹${totalOutstandingDues.toFixed(2)}.`);
    }

    // 3. Check library policy
    const policy = (await tx.libraryPolicy.findUnique({
      where: { category: member.category },
    })) || {
      loanDurationDays: 14,
      allowRenewal: true,
      renewalLimit: 2,
    };

    if (!policy.allowRenewal) {
      throw new Error(`Renewal not permitted for member category "${member.category}".`);
    }

    if (loan.renewalCount >= policy.renewalLimit) {
      throw new Error(`Maximum renewal limit reached (${loan.renewalCount}/${policy.renewalLimit}). Book must be returned.`);
    }

    // 4. Check reservation conflict
    // If another reader has an active hold/reservation on this book, renewal must be rejected
    const conflictingHold = loan.copy.book.reservations.find((r) => r.memberId !== member.id);
    if (conflictingHold) {
      throw new Error(`Renewal denied: Another patron is currently waiting in the reservation queue for this title.`);
    }

    // 5. Calculate new due date
    const now = new Date();
    const currentDueDate = new Date(loan.dueDate);
    const baseDate = now > currentDueDate ? now : currentDueDate;
    const newDueDate = new Date(baseDate);
    newDueDate.setDate(newDueDate.getDate() + policy.loanDurationDays);

    // 6. Update loan
    const updatedLoan = await tx.loan.update({
      where: { id: loan.id },
      data: {
        dueDate: newDueDate,
        renewalCount: { increment: 1 },
      },
    });

    // 7. Audit log
    await tx.auditLog.create({
      data: {
        actorId: params.actorId,
        action: "LOAN_RENEWED",
        entityType: "Loan",
        entityId: loan.id,
        metadataJson: JSON.stringify({
          memberNo: member.memberNo,
          accessionNo: loan.copy.accessionNo,
          title: loan.copy.book.title,
          previousDueDate: currentDueDate.toISOString(),
          newDueDate: newDueDate.toISOString(),
          renewalCount: updatedLoan.renewalCount,
        }),
      },
    });

    return {
      success: true,
      loan: updatedLoan,
      newDueDate,
      renewalCount: updatedLoan.renewalCount,
      member: {
        id: member.id,
        memberNo: member.memberNo,
        fullName: member.fullName,
      },
      book: {
        title: loan.copy.book.title,
        accessionNo: loan.copy.accessionNo,
      },
    };
  }, TX_OPTIONS);
}

export async function getCirculationFollowUps() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);

  // Fetch active policies for fine calculation
  const policies = await prisma.libraryPolicy.findMany();
  const policyMap = new Map<string, (typeof policies)[0]>();
  for (const p of policies) {
    policyMap.set(p.category, p);
  }

  const activeLoans = await prisma.loan.findMany({
    where: { status: "ACTIVE" },
    include: {
      member: {
        select: {
          id: true,
          memberNo: true,
          fullName: true,
          phone: true,
          email: true,
          category: true,
        },
      },
      copy: {
        include: {
          book: {
            select: {
              id: true,
              title: true,
              isbn: true,
            },
          },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const followUps: any[] = [];
  let overdueCount = 0;
  let dueTodayCount = 0;
  let dueTomorrowCount = 0;

  for (const loan of activeLoans) {
    const due = new Date(loan.dueDate);
    let followUpType: "Overdue" | "Due today" | "Due tomorrow" | null = null;
    let daysOverdue = 0;
    let estimatedFine = 0.0;

    if (due < startOfToday) {
      followUpType = "Overdue";
      overdueCount++;
      const diffMs = startOfToday.getTime() - due.getTime();
      daysOverdue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      const policy = policyMap.get(loan.member.category) || {
        gracePeriodDays: 2,
        fineRatePerDay: 2.0,
        maxFine: 150.0,
      };

      if (daysOverdue > policy.gracePeriodDays) {
        const chargeable = daysOverdue - policy.gracePeriodDays;
        estimatedFine = Math.min(chargeable * policy.fineRatePerDay, policy.maxFine);
      }
    } else if (due >= startOfToday && due <= endOfToday) {
      followUpType = "Due today";
      dueTodayCount++;
    } else if (due > endOfToday && due <= endOfTomorrow) {
      followUpType = "Due tomorrow";
      dueTomorrowCount++;
    }

    if (followUpType) {
      followUps.push({
        id: loan.id,
        memberId: loan.member.id,
        memberNo: loan.member.memberNo,
        memberName: loan.member.fullName,
        memberSubtitle: `${loan.member.category} • ${loan.member.memberNo}`,
        phone: loan.member.phone,
        email: loan.member.email,
        bookTitle: loan.copy.book.title,
        accessionNo: loan.copy.accessionNo,
        copyId: loan.copy.id,
        issuedAt: loan.issuedAt,
        dueDate: loan.dueDate,
        renewals: loan.renewalCount,
        followUp: followUpType === "Overdue" ? `Overdue ${daysOverdue} days` : followUpType,
        followUpType,
        daysOverdue,
        estimatedFine,
      });
    }
  }

  return {
    summary: {
      totalActiveLoans: activeLoans.length,
      overdueCount,
      dueTodayCount,
      dueTomorrowCount,
      actionRequiredCount: followUps.length,
    },
    items: followUps,
  };
}

export async function reserveBook(params: ReserveBookParams) {
  return await prisma.$transaction(async (tx) => {
    const member = await tx.member.findUnique({ where: { id: params.memberId } });
    if (!member) throw new Error("Member not found");
    if (member.status !== "ACTIVE") throw new Error("Only active members can place reservations");

    const book = await tx.book.findUnique({
      where: { id: params.bookId },
      include: {
        copies: true,
        reservations: {
          where: { status: { in: ["PENDING", "READY_FOR_PICKUP"] } },
        },
      },
    });

    if (!book) throw new Error("Book not found in catalogue");

    const existingReservation = book.reservations.find((r) => r.memberId === member.id);
    if (existingReservation) {
      throw new Error("You already have an active reservation for this book title");
    }

    const availableCopies = book.copies.filter((c) => c.status === "AVAILABLE").length;
    if (availableCopies > 0) {
      throw new Error("Copies are currently available on the shelf. You may visit the library to borrow directly.");
    }

    const nextPosition = book.reservations.length + 1;
    const reservation = await tx.reservation.create({
      data: {
        bookId: book.id,
        memberId: member.id,
        queuePosition: nextPosition,
        status: "PENDING",
      },
    });

    return {
      reservation,
      queuePosition: nextPosition,
      bookTitle: book.title,
    };
  }, TX_OPTIONS);
}
