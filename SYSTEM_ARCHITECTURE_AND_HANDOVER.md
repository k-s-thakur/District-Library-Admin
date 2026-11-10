# Smart Public Library Management System (GPLMS)
## System Architecture, Governance & Technical Handover Document

**Date:** November 10, 2026  
**Repositories:**
- **Librarian & Admin Portal:** `https://github.com/k-s-thakur/District-Library-Admin.git` (Branch: `main`)
- **Public OPAC & Discovery Portal:** `https://github.com/k-s-thakur/District-Library-OPAC.git` (Branch: `main`)

---

## 1. Architectural Overview

The system is built on a **Dual-Portal, Single-Authoritative-Backend** architecture designed for state/district-level government public libraries:

```
                          ┌────────────────────────────────┐
                          │   Public Citizens & Readers    │
                          │   District-Library-OPAC (:3000)│
                          └───────────────┬────────────────┘
                                          │ Public Read / Reserve
                                          ▼
┌────────────────────────────────┐       ┌────────────────────────────────┐
│  Librarians, Supervisors &     │       │ Central API & Business Engine  │
│  Accounts Officers             │──────▶│ District-Library-Admin (:3001) │
│  District-Library-Admin UI     │       └───────────────┬────────────────┘
└────────────────────────────────┘                       │ Prisma ORM (v6.4.1)
                                                         ▼
                                         ┌────────────────────────────────┐
                                         │ PostgreSQL (Australian Supabase│
                                         │ Primary Managed Cluster)       │
                                         └────────────────────────────────┘
```

1. **Internal Staff Portal (`District-Library-Admin`)**:
   - Port: `3001`
   - Framework: **Next.js 16.4.6 (Turbopack)** + React 19 + Tailwind CSS v4.
   - Database: PostgreSQL on Supabase via **Prisma ORM (v6.4.1)**.
   - Modules: Circulation, Catalog & Accessioning, Patron Directory, Accounts & Supervisor Desk, Governance & Audit Trail, Live Reports.

2. **Public Citizen Portal (`District-Library-OPAC`)**:
   - Port: `3000`
   - Framework: **Next.js 16.4.6 (Turbopack)** + React 19 + Tailwind CSS v4.
   - Dynamic synchronization with Central Admin API (`/api/public/catalog/search`, `/categories`, `/books/[id]`) with a 3-second resilient offline fallback.
   - Citizen Account Desk with Digital Member ID Card (Pure SVG QR Code & Barcode).

---

## 2. Role-Based Access Control (RBAC) & Governance Matrix

| Role | Catalog & Copies | Circulation (Issue/Return) | Cashier Payments | Fine Waiver | Payment Reversal | Policies & Audit |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **SUPER_ADMIN** | Full | Full | Full | ✅ Full Sanction | ✅ Authorized | Full |
| **APPROVING_OFFICER** | Read | Read | Read | ✅ Full Sanction | ✅ Authorized | Audit Only |
| **LIBRARY_ADMIN** | Full | Full | View | ❌ Blocked | ❌ Blocked | Full |
| **LIBRARIAN** | Full | Full | ❌ Blocked | ❌ Blocked | ❌ Blocked | Read Only |
| **ACCOUNTS_OPERATOR** | Read | Read | ✅ Post / Reprint | ❌ Blocked | ❌ Blocked | Read Only |
| **MEMBER** | Read Public | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked |

---

## 3. Core Business Invariants Enforced

1. **Circulation & Lending Invariants**:
   - A physical copy can have **at most one active loan** at any point in time. Concurrent issue attempts are atomically serialized; exactly one succeeds and the second is safely rejected.
   - Borrowing duration and quotas are determined strictly by policy category:
     - `GENERAL_CITIZEN`: 3 titles, 14 days loan period.
     - `STUDENT`: 4 titles, 21 days loan period.
     - `RESEARCHER`: 8 titles, 30 days loan period.
   - Overdue fine calculation enforces grace period rules:
     $$\text{Fine} = \max(0, (\text{Days Overdue} - \text{Grace Days}) \times \text{Daily Fine Rate})$$
   - Maximum renewals limit: Up to 2 renewals allowed. Third renewal is blocked.

2. **Membership Clearance Invariant**:
   - Renewal is strictly blocked if a member has unpaid outstanding dues $> ₹200.00$.
   - Membership renewal extends validity by exactly $+1$ academic year upon fine settlement.

3. **Financial & Supervisory Invariants**:
   - **Cashier Desk**: Payments are posted atomically across allocations, sequential receipt generation, and charge balance reductions in a single Prisma transaction (`maxWait: 20000ms`, `timeout: 60000ms`).
   - **Idempotency Protection**: Replaying a payment with an existing `idempotencyKey` returns the original receipt without double-charging.
   - **Fine Waiver**: Only users with designated roles (`APPROVING_OFFICER` or `SUPER_ADMIN`) can waive overdue fines. Requires a mandatory audit reason and zero-out balance update.
   - **Payment Reversal**: Reversals do not delete the original posted payment; they mark the payment `REVERSED`, receipt `CANCELLED`, restore charge balances, and log cryptographic audit records in `PaymentReversal` and `AuditLog`.

4. **Catalog & Accessioning Invariants**:
   - Bibliographic record (Title) and Physical Holding (Copy) are decoupled.
   - Accession numbers follow strict annual sequence: `ACC-YYYY-XXXX` (e.g. `ACC-2026-0024`).
   - Copies currently on active loan cannot be deleted from the catalog.

---

## 4. Acceptance Test Suite Verification

All **19 Acceptance Tests** (covering PRD 1 & PRD 2) have passed with 100% success:

```bash
npm run test:acceptance
```

| Test ID | Test Scenario Verified | Result |
|---|---|:---:|
| **AT-01** | Public Search without Login | ✅ PASS |
| **AT-02** | Public Data Privacy & Security (Zero raw tokens/costs exposed) | ✅ PASS |
| **AT-03** | Concurrent Issue Protection (Atomic mutex locking) | ✅ PASS |
| **AT-04** | Expired Membership Rejection | ✅ PASS |
| **AT-05** | Return Overdue Book & Fine Assessment | ✅ PASS |
| **AT-06** | Post Partial Cash Payment & Receipt Allocation | ✅ PASS |
| **AT-07** | Idempotent Payment Replay Guard | ✅ PASS |
| **AT-08** | Atomic Transaction Rollback on Failure | ✅ PASS |
| **AT-09** | Authorized Supervisor Payment Reversal & Balance Restoration | ✅ PASS |
| **AT-10** | Sequential Member Number Generation (`GPL-YYYY-XXXXX`) | ✅ PASS |
| **AT-11** | Loan Renewal & Policy Limit Enforcement | ✅ PASS |
| **AT-12** | Circulation Follow-ups & Due Tracking | ✅ PASS |
| **AT-13** | Catalog Book Creation & Duplicate ISBN Guard | ✅ PASS |
| **AT-14** | Accession Sequential Register & QR Token Generation | ✅ PASS |
| **AT-15** | Catalog Safe Deletion Invariant (Blocked on active loan) | ✅ PASS |
| **AT-16** | Member Profile Update & Auto-Quota Recalculation | ✅ PASS |
| **AT-17** | Membership Renewal & Fine Clearance Invariant ($> ₹200$) | ✅ PASS |
| **AT-18** | Supervisor Fine Waiver & Audit Trail | ✅ PASS |
| **AT-19** | Daily Treasury Collection & Audit Reconciliation | ✅ PASS |

---

## 5. Deployment & Execution Commands

### Running Locally
```powershell
# 1. Start District-Library-Admin (Port 3001)
cd "e:\KHAGENDRA SINGH THAKUR\DEVOPS BUILD\District-Library-Admin"
npm run dev

# 2. Start District-Library-OPAC (Port 3000)
cd "e:\KHAGENDRA SINGH THAKUR\DEVOPS BUILD\District-Library-OPAC"
npm run dev
```

### Production Build & Acceptance Tests
```powershell
# Admin Portal
cd "e:\KHAGENDRA SINGH THAKUR\DEVOPS BUILD\District-Library-Admin"
npm run test:acceptance
npm run build

# OPAC Portal
cd "e:\KHAGENDRA SINGH THAKUR\DEVOPS BUILD\District-Library-OPAC"
npm run build
```

---
*Generated and verified for the District Public Library Project.*
