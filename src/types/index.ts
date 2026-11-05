export interface Category {
  id: string;
  name: string;
  code: string;
  ddcPrefix: string;
  description?: string;
  iconName?: string;
  accentColor?: string;
  booksCount?: number;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  subtitle?: string;
  edition?: string;
  publicationYear: number;
  language: string;
  ddcCode: string;
  bookNumber: string;
  description: string;
  coverImageUrl?: string;
  publisher: string;
  category: Category;
  authors: string;
  totalCopies: number;
  availableCopies: number;
  issuedCopies: number;
  referenceOnlyCopies: number;
  primaryLocation: string;
  availabilityStatus: "Available" | "Low Stock" | "Checked Out" | "Reference Only";
  shelfLocations: string[];
  isFeatured?: boolean;
  isEditorChoice?: boolean;
  isPopular?: boolean;
}

export interface BookCopy {
  id: string;
  bookId: string;
  accessionNo: string;
  copyNumber: number;
  qrCodeToken: string;
  shelfLocation: string;
  acquisitionDate: string;
  acquisitionCost: number;
  condition: string;
  status: "AVAILABLE" | "ISSUED" | "REFERENCE" | "MAINTENANCE";
  createdAt?: string;
  updatedAt?: string;
  book: {
    id: string;
    isbn: string;
    title: string;
    subtitle?: string;
    edition?: string;
    publicationYear: number;
    language: string;
    ddcCode: string;
    bookNumber: string;
    description: string;
    coverImageUrl?: string;
    isFeatured?: boolean;
    isEditorChoice?: boolean;
    isPopular?: boolean;
    publisherId?: string;
    categoryId?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface Loan {
  id: string;
  copyId: string;
  memberId: string;
  issuedAt: string;
  dueDate: string;
  returnedAt: string | null;
  renewalCount: number;
  status: "ACTIVE" | "RETURNED" | "OVERDUE";
  issuedBy: string;
  returnedBy: string | null;
  createdAt: string;
  updatedAt: string;
  copy: BookCopy;
}

export interface Reservation {
  id: string;
  bookId: string;
  memberId: string;
  queuePosition: number;
  status: "PENDING" | "FULFILLED" | "CANCELLED";
  reservedAt: string;
  expiresAt?: string;
}

export interface Receipt {
  id: string;
  receiptNo: string;
  issueDate: string;
  totalAmount: number;
  status: string;
}

export interface Member {
  id: string;
  memberNo: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  passwordHash?: string;
  category: "STUDENT" | "CITIZEN" | "SENIOR" | "SCHOLAR";
  status: "ACTIVE" | "SUSPENDED" | "EXPIRED";
  registrationDate: string;
  expiryDate: string;
  maxBooks: number;
  createdAt: string;
  updatedAt: string;
  loans: Loan[];
  reservations: Reservation[];
  feeCharges: any[];
  payments: any[];
  receipts: Receipt[];
  activeLoansCount: number;
  overdueLoansCount: number;
  totalOutstandingDues: number;
}

export type Role = "MEMBER" | "LIBRARIAN" | "ACCOUNTS_OPERATOR" | "SUPER_ADMIN" | "LIBRARY_ADMIN" | "APPROVING_OFFICER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  memberId?: string;
  memberNo?: string;
  category?: string;
}
