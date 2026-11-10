import { prisma } from "../prisma";

const TX_OPTIONS = { maxWait: 20000, timeout: 60000 };

export interface AssessChargeInput {
  memberId: string;
  chargeType: "MEMBERSHIP_FEE" | "RENEWAL_FEE" | "LATE_FINE" | "LOST_BOOK" | "DAMAGED_BOOK" | "OTHER_FEE";
  amount: number;
  description?: string;
  loanId?: string;
  actorId: string;
}

export interface AllocationItem {
  chargeId: string;
  amount: number;
}

export interface PostPaymentInput {
  memberId: string;
  amount: number;
  paymentMethod: "CASH" | "MANUAL_CHALLAN" | "DEMAND_DRAFT" | "OTHER_APPROVED";
  referenceNumber?: string;
  idempotencyKey?: string;
  operatorId: string;
  allocations: AllocationItem[];
}

export interface ReversePaymentInput {
  paymentId: string;
  reversalReason: string;
  authorizedBy: string; // Approving Officer
  operatorId: string;
}

export async function assessCharge(input: AssessChargeInput) {
  if (input.amount <= 0) {
    throw new Error("Charge amount must be positive");
  }

  const member = await prisma.member.findUnique({
    where: { id: input.memberId },
  });
  if (!member) {
    throw new Error(`Member with ID "${input.memberId}" not found`);
  }

  const charge = await prisma.feeCharge.create({
    data: {
      memberId: input.memberId,
      loanId: input.loanId || null,
      chargeType: input.chargeType,
      description: input.description || null,
      amount: input.amount,
      balance: input.amount,
      paidAmount: 0.0,
      status: "OUTSTANDING",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: "CHARGE_ASSESSED",
      entityType: "FeeCharge",
      entityId: charge.id,
      metadataJson: JSON.stringify({
        chargeType: input.chargeType,
        amount: input.amount,
        memberId: input.memberId,
        memberNo: member.memberNo,
      }),
    },
  });

  return charge;
}

async function generateNextReceiptNumber(tx: any, date: Date = new Date()): Promise<string> {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const prefix = `RCP-${year}${month}`;

  let sequence = await tx.receiptSequence.findUnique({
    where: { prefix },
  });

  if (!sequence) {
    sequence = await tx.receiptSequence.create({
      data: {
        prefix,
        lastNumber: 1,
      },
    });
    return `${prefix}-${String(1).padStart(5, "0")}`;
  }

  const updated = await tx.receiptSequence.update({
    where: { prefix },
    data: {
      lastNumber: { increment: 1 },
    },
  });

  return `${prefix}-${String(updated.lastNumber).padStart(5, "0")}`;
}

export async function postPayment(input: PostPaymentInput) {
  if (input.amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  if (!input.allocations || input.allocations.length === 0) {
    throw new Error("Payment must be allocated to at least one eligible charge");
  }

  const totalAllocated = input.allocations.reduce((sum, item) => sum + item.amount, 0);
  if (Math.abs(totalAllocated - input.amount) > 0.001) {
    throw new Error(
      `Allocations sum (₹${totalAllocated.toFixed(2)}) must exactly equal payment amount (₹${input.amount.toFixed(2)})`
    );
  }

  // Pre-transaction Idempotency check
  if (input.idempotencyKey) {
    const existing = await prisma.payment.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: {
        receipt: true,
        allocations: { include: { charge: true } },
        member: true,
      },
    });
    if (existing) {
      return {
        payment: existing,
        receipt: existing.receipt,
        idempotentReplay: true,
      };
    }
  }

  // Atomic execution
  return await prisma.$transaction(async (tx) => {
    // Check idempotency again within transaction
    if (input.idempotencyKey) {
      const existingTx = await tx.payment.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: {
          receipt: true,
          allocations: { include: { charge: true } },
          member: true,
        },
      });
      if (existingTx) {
        return {
          payment: existingTx,
          receipt: existingTx.receipt,
          idempotentReplay: true,
        };
      }
    }

    const member = await tx.member.findUnique({
      where: { id: input.memberId },
    });
    if (!member) {
      throw new Error(`Member with ID "${input.memberId}" not found`);
    }

    // Validate allocations against current balances
    const chargeUpdates: { chargeId: string; newPaidAmount: number; newBalance: number; newStatus: string }[] = [];

    for (const alloc of input.allocations) {
      if (alloc.amount <= 0) {
        throw new Error("Allocated amount for each charge must be greater than zero");
      }

      const charge = await tx.feeCharge.findUnique({
        where: { id: alloc.chargeId },
      });

      if (!charge) {
        throw new Error(`Charge with ID "${alloc.chargeId}" does not exist`);
      }
      if (charge.memberId !== input.memberId) {
        throw new Error(`Charge "${alloc.chargeId}" does not belong to member "${input.memberId}"`);
      }
      if (charge.status === "PAID" || charge.status === "WAIVED") {
        throw new Error(`Charge "${alloc.chargeId}" is already ${charge.status}`);
      }
      if (alloc.amount > charge.balance + 0.001) {
        throw new Error(
          `Allocated amount (₹${alloc.amount}) exceeds outstanding charge balance (₹${charge.balance})`
        );
      }

      const newPaid = Number((charge.paidAmount + alloc.amount).toFixed(2));
      const newBal = Number(Math.max(0, charge.balance - alloc.amount).toFixed(2));
      const newStatus = newBal <= 0.001 ? "PAID" : "PARTIALLY_PAID";

      chargeUpdates.push({
        chargeId: charge.id,
        newPaidAmount: newPaid,
        newBalance: newBal,
        newStatus,
      });
    }

    // 1. Create Payment record
    const payment = await tx.payment.create({
      data: {
        memberId: input.memberId,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        referenceNumber: input.referenceNumber || null,
        idempotencyKey: input.idempotencyKey || null,
        operatorId: input.operatorId,
        status: "POSTED",
      },
    });

    // 2. Create Payment Allocations
    for (const alloc of input.allocations) {
      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          chargeId: alloc.chargeId,
          amount: alloc.amount,
        },
      });
    }

    // 3. Update Fee Charges
    for (const cu of chargeUpdates) {
      await tx.feeCharge.update({
        where: { id: cu.chargeId },
        data: {
          paidAmount: cu.newPaidAmount,
          balance: cu.newBalance,
          status: cu.newStatus,
        },
      });
    }

    // 4. Generate Unique Sequential Receipt Number
    const receiptNo = await generateNextReceiptNumber(tx);

    // 5. Create Receipt record
    const receipt = await tx.receipt.create({
      data: {
        receiptNo,
        paymentId: payment.id,
        memberId: input.memberId,
        operatorId: input.operatorId,
        totalAmount: input.amount,
        status: "ISSUED",
      },
    });

    // 6. Record Audit Log
    await tx.auditLog.create({
      data: {
        actorId: input.operatorId,
        action: "PAYMENT_POSTED",
        entityType: "Payment",
        entityId: payment.id,
        metadataJson: JSON.stringify({
          receiptNo,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          memberId: input.memberId,
          memberNo: member.memberNo,
          allocationsCount: input.allocations.length,
          idempotencyKey: input.idempotencyKey,
        }),
      },
    });

    return {
      payment: {
        ...payment,
        allocations: input.allocations,
      },
      receipt,
      idempotentReplay: false,
    };
  }, TX_OPTIONS);
}

export async function reversePayment(input: ReversePaymentInput) {
  if (!input.reversalReason || input.reversalReason.trim().length === 0) {
    throw new Error("A valid reversal reason is required by audit policy");
  }
  if (!input.authorizedBy || input.authorizedBy.trim().length === 0) {
    throw new Error("Approving Officer authorization is required to reverse a payment");
  }

  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: input.paymentId },
      include: {
        allocations: true,
        receipt: true,
        reversal: true,
      },
    });

    if (!payment) {
      throw new Error(`Payment with ID "${input.paymentId}" not found`);
    }

    if (payment.status === "REVERSED" || payment.reversal) {
      throw new Error(`Payment "${input.paymentId}" has already been reversed`);
    }

    // 1. Revert each allocated amount on the corresponding charges
    for (const alloc of payment.allocations) {
      const charge = await tx.feeCharge.findUnique({
        where: { id: alloc.chargeId },
      });

      if (charge) {
        const restoredPaid = Number(Math.max(0, charge.paidAmount - alloc.amount).toFixed(2));
        const restoredBalance = Number((charge.balance + alloc.amount).toFixed(2));
        const restoredStatus = restoredPaid === 0 ? "OUTSTANDING" : "PARTIALLY_PAID";

        await tx.feeCharge.update({
          where: { id: charge.id },
          data: {
            paidAmount: restoredPaid,
            balance: restoredBalance,
            status: restoredStatus,
          },
        });
      }
    }

    // 2. Mark Payment as REVERSED
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: { status: "REVERSED" },
    });

    // 3. Mark Receipt as CANCELLED
    if (payment.receipt) {
      await tx.receipt.update({
        where: { id: payment.receipt.id },
        data: { status: "CANCELLED" },
      });
    }

    // 4. Create Reversal Audit Record
    const reversal = await tx.paymentReversal.create({
      data: {
        paymentId: payment.id,
        reversalReason: input.reversalReason,
        authorizedBy: input.authorizedBy,
        operatorId: input.operatorId,
      },
    });

    // 5. Audit Log
    await tx.auditLog.create({
      data: {
        actorId: input.operatorId,
        action: "PAYMENT_REVERSED",
        entityType: "Payment",
        entityId: payment.id,
        metadataJson: JSON.stringify({
          authorizedBy: input.authorizedBy,
          reversalReason: input.reversalReason,
          amount: payment.amount,
        }),
      },
    });

      return {
        success: true,
        payment: updatedPayment,
        reversal,
      };
    },
    TX_OPTIONS
  );
}

export interface WaiveChargeInput {
  chargeId: string;
  waiverReason: string;
  waivedBy: string; // Approving Officer / Supervisor
  actorId: string;
}

export async function waiveCharge(input: WaiveChargeInput) {
  if (!input.waiverReason || input.waiverReason.trim().length === 0) {
    throw new Error("A valid waiver reason is strictly required by audit policy");
  }
  if (!input.waivedBy || input.waivedBy.trim().length === 0) {
    throw new Error("Supervisor / Approving Officer authorization is required to waive a charge");
  }

  return await prisma.$transaction(async (tx) => {
    const charge = await tx.feeCharge.findUnique({
      where: { id: input.chargeId },
      include: { member: true },
    });

    if (!charge) {
      throw new Error(`Charge with ID "${input.chargeId}" not found`);
    }

    if (charge.status === "PAID" || charge.status === "WAIVED") {
      throw new Error(`Charge is already ${charge.status}`);
    }

    const waivedAmount = charge.balance;

    const updated = await tx.feeCharge.update({
      where: { id: charge.id },
      data: {
        status: "WAIVED",
        balance: 0.0,
        waivedAmount,
        waiverReason: input.waiverReason,
        waivedBy: input.waivedBy,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.actorId,
        action: "CHARGE_WAIVED",
        entityType: "FeeCharge",
        entityId: charge.id,
        metadataJson: JSON.stringify({
          memberId: charge.memberId,
          memberNo: charge.member?.memberNo,
          waivedAmount,
          waiverReason: input.waiverReason,
          authorizedBy: input.waivedBy,
        }),
      },
    });

    return {
      success: true,
      charge: updated,
      waivedAmount,
    };
  }, TX_OPTIONS);
}

export async function getDailyCollectionReport() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: startOfDay },
      status: "POSTED",
    },
    include: {
      receipt: true,
      member: {
        select: { memberNo: true, fullName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    date: startOfDay.toISOString(),
    totalAmount: totalCollected,
    totalTransactions: payments.length,
    payments,
  };
}
