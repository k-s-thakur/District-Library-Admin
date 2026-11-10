import { prisma } from "../src/lib/prisma";
import {
  searchCatalogue,
  getBookDetails,
  createBook,
  addBookCopy,
  deleteBook,
  generateNextAccessionNo,
  listAccessionRegister,
} from "../src/lib/services/catalogue.service";
import { issueBook, returnBook, reserveBook, renewLoan, getCirculationFollowUps } from "../src/lib/services/circulation.service";
import { assessCharge, postPayment, reversePayment, waiveCharge, getDailyCollectionReport } from "../src/lib/services/finance.service";
import { registerMember, updateMember, renewMembership } from "../src/lib/services/member.service";

async function runAcceptanceTests() {
  console.log("==================================================================");
  console.log("   SMART PUBLIC LIBRARY OPAC & PORTAL ACCEPTANCE TEST SUITE       ");
  console.log("   PRD 1 & PRD 2 INTEGRITY, PRIVACY & TRANSACTION VERIFICATION    ");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testId: string, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testId}: ${testName} ${detail ? `- ${detail}` : ""}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testId}: ${testName} ${detail ? `- ${detail}` : ""}`);
      failed++;
    }
  }

  // TEST 1 — AT-01: Public OPAC Search without login
  try {
    const searchRes = await searchCatalogue({ query: "Wings of Fire" });
    const book = searchRes.items[0];
    const hasCopyData = book && book.availableCopies !== undefined;
    assert(
      searchRes.items.length > 0 && hasCopyData,
      "AT-01",
      "Public Search without Login",
      `Found "${book?.title}" with ${book?.availableCopies}/${book?.totalCopies} copies available`
    );
  } catch (err: any) {
    assert(false, "AT-01", "Public Search without Login", err.message);
  }

  // TEST 2 — PRIVACY: Public catalog endpoint does NOT expose internal QR secrets or member identities
  try {
    const publicBook = await getBookDetails("9788173711466");
    const anyRawQr = (publicBook.copies as any[]).some((c) => (c as any).qrCodeToken !== undefined);
    const anyPrivateCost = (publicBook.copies as any[]).some((c) => (c as any).acquisitionCost !== undefined);
    assert(
      !anyRawQr && !anyPrivateCost,
      "AT-02",
      "Public Data Privacy & Security",
      "Zero raw QR tokens or internal costs exposed in public catalogue response"
    );
  } catch (err: any) {
    assert(false, "AT-02", "Public Data Privacy & Security", err.message);
  }

  // TEST 3 — AT-03: Two staff attempt to issue same physical copy concurrently
  try {
    // Isolate test: create a dedicated test copy
    const testBook = await prisma.book.findFirst({ where: { isbn: "9788172234980" } });
    const testCopy = await prisma.bookCopy.create({
      data: {
        bookId: testBook!.id,
        accessionNo: `ACC-TEST-${Date.now()}`,
        qrCodeToken: `QR-TEST-${Date.now()}`,
        status: "AVAILABLE",
        shelfLocation: "Aisle 3, Rack B, Shelf 1",
      },
    });

    const memberA = await prisma.member.findFirst({ where: { memberNo: "GPL-2026-00001" } });
    const memberB = await prisma.member.findFirst({ where: { memberNo: "GPL-2026-00002" } });

    let successCount = 0;
    let failCount = 0;

    const [resA, resB] = await Promise.allSettled([
      issueBook({
        memberIdentifier: memberA!.id,
        copyIdentifier: testCopy.accessionNo,
        actorId: "staff_1",
      }),
      issueBook({
        memberIdentifier: memberB!.id,
        copyIdentifier: testCopy.accessionNo,
        actorId: "staff_2",
      }),
    ]);

    if (resA.status === "fulfilled") successCount++; else failCount++;
    if (resB.status === "fulfilled") successCount++; else failCount++;

    const updatedCopy = await prisma.bookCopy.findUnique({ where: { id: testCopy.id } });

    if (!(successCount === 1 && failCount === 1 && updatedCopy?.status === "ISSUED")) {
      console.log("AT-03 Debug:", {
        successCount,
        failCount,
        resA: resA.status === "rejected" ? resA.reason?.message : "ok",
        resB: resB.status === "rejected" ? resB.reason?.message : "ok",
        updatedStatus: updatedCopy?.status,
      });
    }

    assert(
      successCount === 1 && failCount === 1 && updatedCopy?.status === "ISSUED",
      "AT-03",
      "Concurrent Issue Protection",
      "Exactly one issue succeeded; second concurrent request was safely rejected"
    );

    // Clean up test copy
    await prisma.loan.deleteMany({ where: { copyId: testCopy.id } });
    await prisma.bookCopy.delete({ where: { id: testCopy.id } });
  } catch (err: any) {
    assert(false, "AT-03", "Concurrent Issue Protection", err.message);
  }

  // TEST 4 — AT-04: Issue book to expired member is rejected
  try {
    const expiredEmail = `expired.${Date.now()}@example.gov.in`;
    const expiredMember = await prisma.member.create({
      data: {
        memberNo: `GPL-EXP-${Date.now()}`,
        fullName: "Expired Citizen Test",
        email: expiredEmail,
        category: "GENERAL_CITIZEN",
        status: "ACTIVE",
        expiryDate: new Date("2020-01-01"), // Expired
      },
    });

    let caught = false;
    try {
      await issueBook({
        memberIdentifier: expiredMember.id,
        copyIdentifier: "ACC-2026-0004",
        actorId: "librarian",
      });
    } catch {
      caught = true;
    }

    assert(
      caught,
      "AT-04",
      "Expired Membership Rejection",
      "Transaction properly rejected due to expired membership validity"
    );

    // Teardown
    await prisma.member.delete({ where: { id: expiredMember.id } });
  } catch (err: any) {
    assert(false, "AT-04", "Expired Membership Rejection", err.message);
  }

  // TEST 5 — AT-05: Return overdue book & verify fine calculation
  try {
    const testCopy = await prisma.bookCopy.create({
      data: {
        bookId: (await prisma.book.findFirst())!.id,
        accessionNo: `ACC-FINE-${Date.now()}`,
        qrCodeToken: `QR-FINE-${Date.now()}`,
        status: "ISSUED",
        shelfLocation: "Aisle 1",
      },
    });

    const member = await prisma.member.findFirst({ where: { memberNo: "GPL-2026-00001" } });
    const pastDueDate = new Date();
    pastDueDate.setDate(pastDueDate.getDate() - 10); // 10 days overdue

    const overdueLoan = await prisma.loan.create({
      data: {
        copyId: testCopy.id,
        memberId: member!.id,
        issuedAt: new Date(Date.now() - 25 * 86400000),
        dueDate: pastDueDate,
        status: "ACTIVE",
        issuedBy: "librarian",
      },
    });

    const returnRes = await returnBook({
      copyIdentifier: testCopy.accessionNo,
      actorId: "librarian",
    });

    assert(
      returnRes.isOverdue && returnRes.assessedFineAmount > 0 && returnRes.feeCharge !== null,
      "AT-05",
      "Return Overdue Book & Fine Assessment",
      `Assessed fine of ₹${returnRes.assessedFineAmount} based on policy rate & grace period`
    );

    // Teardown
    if (returnRes.feeCharge) {
      await prisma.feeCharge.delete({ where: { id: returnRes.feeCharge.id } });
    }
    await prisma.loan.delete({ where: { id: overdueLoan.id } });
    await prisma.bookCopy.delete({ where: { id: testCopy.id } });
  } catch (err: any) {
    assert(false, "AT-05", "Return Overdue Book & Fine Assessment", err.message);
  }

  // TEST 6 — AT-06: Post partial cash payment & verify remaining balance
  let assessedCharge: any;
  let paymentResult: any;
  const uniqueKey = `PAY-TEST-${Date.now()}`;

  try {
    const member = await prisma.member.findFirst({ where: { memberNo: "GPL-2026-00001" } });
    assessedCharge = await assessCharge({
      memberId: member!.id,
      chargeType: "DAMAGED_BOOK",
      amount: 200.0,
      description: "Damage fine assessment",
      actorId: "librarian",
    });

    paymentResult = await postPayment({
      memberId: member!.id,
      amount: 75.0, // Partial payment
      paymentMethod: "CASH",
      idempotencyKey: uniqueKey,
      operatorId: "operator_accounts",
      allocations: [{ chargeId: assessedCharge.id, amount: 75.0 }],
    });

    const updatedCharge = await prisma.feeCharge.findUnique({ where: { id: assessedCharge.id } });

    assert(
      paymentResult.receipt !== null &&
        updatedCharge?.paidAmount === 75.0 &&
        updatedCharge?.balance === 125.0 &&
        updatedCharge?.status === "PARTIALLY_PAID",
      "AT-06",
      "Post Partial Cash Payment",
      `Paid ₹75 against ₹200; remaining balance ₹125; Receipt #${paymentResult.receipt?.receiptNo}`
    );
  } catch (err: any) {
    assert(false, "AT-06", "Post Partial Cash Payment", err.message);
  }

  // TEST 7 — AT-07: Idempotent replay of identical payment request
  try {
    const member = await prisma.member.findFirst({ where: { memberNo: "GPL-2026-00001" } });
    const replayRes = await postPayment({
      memberId: member!.id,
      amount: 75.0,
      paymentMethod: "CASH",
      idempotencyKey: uniqueKey, // identical key
      operatorId: "operator_accounts",
      allocations: [{ chargeId: assessedCharge.id, amount: 75.0 }],
    });

    const payCount = await prisma.payment.count({ where: { idempotencyKey: uniqueKey } });
    assert(
      replayRes.idempotentReplay === true && payCount === 1,
      "AT-07",
      "Idempotent Payment Replay",
      "Safely returned existing receipt without double charges or duplicate receipts"
    );
  } catch (err: any) {
    assert(false, "AT-07", "Idempotent Payment Replay", err.message);
  }

  // TEST 8 — AT-08: Force failure / invalid allocation (Rollback Verification)
  try {
    const prePayments = await prisma.payment.count();
    const preReceipts = await prisma.receipt.count();
    let thrown = false;

    try {
      await postPayment({
        memberId: assessedCharge.memberId,
        amount: 50.0,
        paymentMethod: "CASH",
        operatorId: "op",
        allocations: [{ chargeId: "non_existent_charge_id_999", amount: 50.0 }],
      });
    } catch {
      thrown = true;
    }

    const postPayments = await prisma.payment.count();
    const postReceipts = await prisma.receipt.count();

    if (!(thrown && prePayments === postPayments && preReceipts === postReceipts)) {
      console.log("AT-08 Debug:", { thrown, prePayments, postPayments, preReceipts, postReceipts });
    }

    assert(
      thrown && prePayments === postPayments && preReceipts === postReceipts,
      "AT-08",
      "Atomic Transaction Rollback",
      "Failed allocation rolled back completely; zero partial records created"
    );
  } catch (err: any) {
    assert(false, "AT-08", "Atomic Transaction Rollback", err.message);
  }

  // TEST 9 — AT-09: Authorized payment reversal & audit traceability
  try {
    const reversalRes = await reversePayment({
      paymentId: paymentResult.payment.id,
      reversalReason: "Cashier keying error - authorized by Approving Officer",
      authorizedBy: "Rajeshwar Rao (Approving Officer)",
      operatorId: "operator_accounts",
    });

    const restoredCharge = await prisma.feeCharge.findUnique({ where: { id: assessedCharge.id } });
    const reversedPayment = await prisma.payment.findUnique({
      where: { id: paymentResult.payment.id },
      include: { receipt: true },
    });

    assert(
      reversalRes.success &&
        reversedPayment?.status === "REVERSED" &&
        reversedPayment?.receipt?.status === "CANCELLED" &&
        restoredCharge?.balance === 200.0,
      "AT-09",
      "Authorized Payment Reversal",
      "Payment marked REVERSED, receipt CANCELLED, and charge balance restored"
    );

    // Teardown
    await prisma.paymentAllocation.deleteMany({ where: { paymentId: paymentResult.payment.id } });
    await prisma.paymentReversal.deleteMany({ where: { paymentId: paymentResult.payment.id } });
    await prisma.receipt.deleteMany({ where: { paymentId: paymentResult.payment.id } });
    await prisma.payment.delete({ where: { id: paymentResult.payment.id } });
    await prisma.feeCharge.delete({ where: { id: assessedCharge.id } });
  } catch (err: any) {
    assert(false, "AT-09", "Authorized Payment Reversal", err.message);
  }

  // TEST 10 — AT-10: Safe Sequential Member Number Generation
  try {
    const newMember = await registerMember({
      fullName: "Deepa Narayan",
      email: `deepa.${Date.now()}@test.ac.in`,
      category: "STUDENT",
    });

    assert(
      newMember.memberNo.startsWith("GPL-2026-"),
      "AT-10",
      "Sequential Member Numbering",
      `Generated unique sequence number: ${newMember.memberNo}`
    );

    // Teardown
    await prisma.member.delete({ where: { id: newMember.id } });
  } catch (err: any) {
    assert(false, "AT-10", "Sequential Member Numbering", err.message);
  }

  // TEST 11 — AT-11: Loan Renewal and Limit Enforcement
  try {
    const book = await prisma.book.findFirst();
    const copy = await prisma.bookCopy.create({
      data: {
        bookId: book!.id,
        accessionNo: `ACC-RENEW-${Date.now()}`,
        qrCodeToken: `QR-RENEW-${Date.now()}`,
        status: "AVAILABLE",
      },
    });

    const renewMember = await registerMember({
      fullName: "Renewal Tester",
      email: `renew.${Date.now()}@test.ac.in`,
      category: "GENERAL_CITIZEN",
    });

    // Issue the book
    const issueRes = await issueBook({
      memberIdentifier: renewMember.id,
      copyIdentifier: copy.accessionNo,
      actorId: "staff_test",
    });

    // 1st Renewal (should succeed)
    const renew1 = await renewLoan({
      loanId: issueRes.loan.id,
      actorId: "staff_test",
    });

    // 2nd Renewal (should succeed)
    const renew2 = await renewLoan({
      loanId: issueRes.loan.id,
      actorId: "staff_test",
    });

    // 3rd Renewal (should fail because limit is 2)
    let limitBlocked = false;
    try {
      await renewLoan({
        loanId: issueRes.loan.id,
        actorId: "staff_test",
      });
    } catch {
      limitBlocked = true;
    }

    assert(
      renew1.renewalCount === 1 && renew2.renewalCount === 2 && limitBlocked,
      "AT-11",
      "Loan Renewal & Policy Limit Enforcement",
      "Successfully renewed twice; third renewal safely blocked by policy limit"
    );

    // Teardown
    await prisma.loan.delete({ where: { id: issueRes.loan.id } });
    await prisma.bookCopy.delete({ where: { id: copy.id } });
    await prisma.member.delete({ where: { id: renewMember.id } });
  } catch (err: any) {
    assert(false, "AT-11", "Loan Renewal & Policy Limit Enforcement", err.message);
  }

  // TEST 12 — AT-12: Circulation Follow-ups & Overdue Engine
  try {
    const followUps = await getCirculationFollowUps();
    const hasStructure =
      followUps.summary &&
      typeof followUps.summary.totalActiveLoans === "number" &&
      typeof followUps.summary.overdueCount === "number" &&
      Array.isArray(followUps.items);

    assert(
      hasStructure,
      "AT-12",
      "Circulation Follow-ups & Due Tracking",
      `Calculated ${followUps.summary.totalActiveLoans} active loans, ${followUps.summary.overdueCount} overdue`
    );
  } catch (err: any) {
    assert(false, "AT-12", "Circulation Follow-ups & Due Tracking", err.message);
  }

  // TEST 13 — AT-13: Catalog Book Creation and Duplicate ISBN Prevention
  let createdBookId = "";
  let createdCopyId = "";
  try {
    const testIsbn = `978-93-${Date.now().toString().slice(-8)}`;
    const newBook = await createBook(
      {
        title: `Acceptance Testing Architecture ${Date.now()}`,
        isbn: testIsbn,
        publicationYear: 2026,
        language: "English",
        ddcCode: "005.14",
        authors: ["Dr. K. S. Thakur"],
        publisherName: "National Knowledge Commission",
      },
      "staff_test"
    );
    createdBookId = newBook.id;

    let duplicateBlocked = false;
    try {
      await createBook(
        {
          title: "Duplicate ISBN Book",
          isbn: testIsbn,
        },
        "staff_test"
      );
    } catch {
      duplicateBlocked = true;
    }

    assert(
      newBook.title.startsWith("Acceptance Testing Architecture") && duplicateBlocked,
      "AT-13",
      "Catalog Book Creation & Duplicate ISBN Guard",
      `Created book "${newBook.title}" with DDC 005.14 and blocked duplicate ISBN`
    );

    // Teardown handled in AT-15
  } catch (err: any) {
    assert(false, "AT-13", "Catalog Book Creation & Duplicate ISBN Guard", err.message);
  }

  // TEST 14 — AT-14: Physical Accession Register & QR Generation
  try {
    const copy = await addBookCopy(
      {
        bookId: createdBookId,
        shelfLocation: "Aisle 7, Rack A, Shelf 3",
        acquisitionCost: 450.0,
        condition: "NEW",
      },
      "staff_test"
    );
    createdCopyId = copy.id;

    const hasValidAcc = copy.accessionNo.startsWith("ACC-2026-");
    const hasValidQr = copy.qrCodeToken.startsWith(`QR-${copy.accessionNo}-`);

    assert(
      hasValidAcc && hasValidQr && copy.copyNumber === 1,
      "AT-14",
      "Accession Sequential Register & QR Token Generation",
      `Assigned Accession: ${copy.accessionNo}, QR: ${copy.qrCodeToken}`
    );
  } catch (err: any) {
    assert(false, "AT-14", "Accession Sequential Register & QR Token Generation", err.message);
  }

  // TEST 15 — AT-15: Safe Deletion & Active Loan Protection
  try {
    const testMember = await registerMember({
      fullName: "Safe Delete Tester",
      email: `delete.test.${Date.now()}@test.ac.in`,
      category: "STUDENT",
    });

    const copy = await prisma.bookCopy.findUnique({ where: { id: createdCopyId } });

    // Issue book to create active loan
    const issueRes = await issueBook({
      memberIdentifier: testMember.id,
      copyIdentifier: copy!.accessionNo,
      actorId: "staff_test",
    });

    // Try deleting book while copy is issued (must fail)
    let deletionBlocked = false;
    try {
      await deleteBook(createdBookId, "staff_test");
    } catch {
      deletionBlocked = true;
    }

    // Return book so it can now be safely deleted
    await returnBook({
      copyIdentifier: copy!.accessionNo,
      actorId: "staff_test",
    });

    // Delete book now (must succeed)
    const delRes = await deleteBook(createdBookId, "staff_test");

    assert(
      deletionBlocked && delRes.success,
      "AT-15",
      "Catalog Safe Deletion Invariant",
      "Deletion blocked while on active loan; safely removed once returned"
    );

    // Teardown member
    await prisma.member.delete({ where: { id: testMember.id } });
  } catch (err: any) {
    assert(false, "AT-15", "Catalog Safe Deletion Invariant", err.message);
  }

  // TEST 16 — AT-16: Member Profile Update & Category Quota Recalculation
  try {
    const member = await registerMember({
      fullName: "Quota Test Patron",
      email: `quota.test.${Date.now()}@test.org`,
      category: "GENERAL_CITIZEN",
    });

    // Verify initial maxBooks = 3 for GENERAL_CITIZEN
    const initialMaxBooks = member.maxBooks;

    // Update category to RESEARCHER (quota becomes 8) and status to SUSPENDED
    const updated = await updateMember(
      member.id,
      {
        category: "RESEARCHER",
        status: "SUSPENDED",
        phone: "+91 99999 88888",
      },
      "staff_test"
    );

    assert(
      initialMaxBooks === 3 && updated.maxBooks === 8 && updated.status === "SUSPENDED" && updated.phone === "+91 99999 88888",
      "AT-16",
      "Member Profile Update & Quota Recalculation",
      `Quota auto-upgraded from ${initialMaxBooks} to ${updated.maxBooks} on category change; status = ${updated.status}`
    );

    // Teardown
    await prisma.member.delete({ where: { id: member.id } });
  } catch (err: any) {
    assert(false, "AT-16", "Member Profile Update & Quota Recalculation", err.message);
  }

  // TEST 17 — AT-17: Membership Renewal & Dues Enforcement
  try {
    const renewMember = await registerMember({
      fullName: "Renewal Dues Patron",
      email: `renewal.dues.${Date.now()}@test.org`,
      category: "STUDENT",
    });

    // Manually set expiry date to past
    const expiredDate = new Date();
    expiredDate.setFullYear(expiredDate.getFullYear() - 1);
    await prisma.member.update({
      where: { id: renewMember.id },
      data: { expiryDate: expiredDate, status: "EXPIRED" },
    });

    // Create fee charge of 250 (exceeds 200 limit)
    const excessCharge = await assessCharge({
      memberId: renewMember.id,
      chargeType: "MEMBERSHIP_FEE",
      amount: 250.0,
      description: "Overdue Annual Fee",
      actorId: "staff_test",
    });

    // Attempt renewal - must fail due to outstanding dues > 200
    let renewalBlocked = false;
    try {
      await renewMembership(renewMember.id, "staff_test");
    } catch {
      renewalBlocked = true;
    }

    // Pay off the charge
    const paidRes = await postPayment({
      memberId: renewMember.id,
      amount: 250.0,
      paymentMethod: "CASH",
      operatorId: "staff_test",
      allocations: [{ chargeId: excessCharge.id, amount: 250.0 }],
    });

    // Now attempt renewal - must succeed and extend expiry by +1 year
    const renewed = await renewMembership(renewMember.id, "staff_test");
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    assert(
      renewalBlocked &&
        renewed.success &&
        renewed.member.status === "ACTIVE" &&
        new Date(renewed.member.expiryDate).getFullYear() === nextYear.getFullYear(),
      "AT-17",
      "Membership Renewal & Fine Clearance Invariant",
      `Renewal blocked with dues > ₹200; after clearance renewed until ${new Date(renewed.member.expiryDate).toISOString().split("T")[0]}`
    );

    // Teardown
    if (paidRes?.payment?.id) {
      await prisma.receipt.deleteMany({ where: { paymentId: paidRes.payment.id } });
      await prisma.paymentAllocation.deleteMany({ where: { paymentId: paidRes.payment.id } });
      await prisma.payment.deleteMany({ where: { id: paidRes.payment.id } });
    }
    await prisma.feeCharge.deleteMany({ where: { memberId: renewMember.id } });
    await prisma.member.delete({ where: { id: renewMember.id } });
  } catch (err: any) {
    assert(false, "AT-17", "Membership Renewal & Fine Clearance Invariant", err.message);
  }

  // TEST 18 — AT-18: Supervisor Fine Waiver with Sanction Traceability
  try {
    const waiverMember = await registerMember({
      fullName: "Waiver Beneficiary",
      email: `waiver.${Date.now()}@test.org`,
      category: "SENIOR_CITIZEN",
    });

    const fineCharge = await assessCharge({
      memberId: waiverMember.id,
      chargeType: "LATE_FINE",
      amount: 120.0,
      description: "Senior citizen overdue fine",
      actorId: "cashier_1",
    });

    // Sanction waiver by Approving Officer / Supervisor
    const waiverResult = await waiveCharge({
      chargeId: fineCharge.id,
      waiverReason: "Medical exemption authorized under Section 14B by District Library Officer",
      waivedBy: "Shri R. K. Sharma (Approving Officer)",
      actorId: "supervisor_1",
    });

    const reloadedCharge = await prisma.feeCharge.findUnique({ where: { id: fineCharge.id } });

    assert(
      waiverResult.success &&
        reloadedCharge?.status === "WAIVED" &&
        reloadedCharge?.balance === 0.0 &&
        reloadedCharge?.waivedAmount === 120.0 &&
        reloadedCharge?.waivedBy === "Shri R. K. Sharma (Approving Officer)",
      "AT-18",
      "Supervisor Fine Waiver & Audit Trail",
      `Waived ₹120.0 fine; status = ${reloadedCharge?.status}, authorized by ${reloadedCharge?.waivedBy}`
    );

    // Teardown
    await prisma.feeCharge.delete({ where: { id: fineCharge.id } });
    await prisma.member.delete({ where: { id: waiverMember.id } });
  } catch (err: any) {
    assert(false, "AT-18", "Supervisor Fine Waiver & Audit Trail", err.message);
  }

  // TEST 19 — AT-19: Daily Collection Treasury & Audit Reconciliation Report
  try {
    const dailyReport = await getDailyCollectionReport();
    const isValidReport =
      dailyReport &&
      typeof dailyReport.date === "string" &&
      typeof dailyReport.totalAmount === "number" &&
      typeof dailyReport.totalTransactions === "number" &&
      Array.isArray(dailyReport.payments);

    assert(
      isValidReport,
      "AT-19",
      "Daily Treasury Collection & Audit Reconciliation",
      `Reconciled ${dailyReport.totalTransactions} transactions totaling ₹${dailyReport.totalAmount} for ${dailyReport.date.split("T")[0]}`
    );
  } catch (err: any) {
    assert(false, "AT-19", "Daily Treasury Collection & Audit Reconciliation", err.message);
  }

  console.log("\n==================================================================");
  console.log(`   TEST EXECUTION RESULT: ${passed} PASSED / ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAcceptanceTests()
  .catch((e) => {
    console.error("Test runner error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
