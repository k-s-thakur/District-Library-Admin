"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sliders,
  Shield,
  Building2,
  Clock,
  IndianRupee,
  Users,
  Save,
  CheckCircle2,
  History,
  UserCheck,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Download,
  Lock,
  Key,
  Copy,
  Eye,
  EyeOff,
  UserPlus,
  Printer,
  Pencil,
  Trash2,
  Check,
  X,
  AlertCircle,
  LayoutGrid,
  List,
  User,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  BookOpen,
} from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  phone?: string;
  createdAt: string;
}

interface AuditLogItem {
  id: string;
  actorId?: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadataJson?: string;
  ipAddress?: string;
  timestamp: string;
}

interface RoleDefinition {
  code: string;
  name: string;
  department: string;
  accessLevel: "Full Control" | "Circulation Desk" | "Finance & Accounts" | "Supervisory Approvals" | "Catalogue Control";
  description: string;
  updatedDate: string;
  status: "Active" | "Inactive";
}

const LIBRARY_ROLES: RoleDefinition[] = [
  {
    code: "SUPER_ADMIN",
    name: "Super Administrator",
    department: "Administrative Directorate",
    accessLevel: "Full Control",
    description: "Complete unconstrained authority over all modules, staff provisioning, backups, policy governance and system audits.",
    updatedDate: "10/11/2026",
    status: "Active",
  },
  {
    code: "LIBRARY_ADMIN",
    name: "Library Administrator",
    department: "Executive Management",
    accessLevel: "Full Control",
    description: "Oversees daily library workflows, catalogue acquisition, staff delegations, membership quotas and analytics.",
    updatedDate: "10/11/2026",
    status: "Active",
  },
  {
    code: "LIBRARIAN",
    name: "Circulation Librarian",
    department: "Circulation & Public Stacks",
    accessLevel: "Circulation Desk",
    description: "Operates front circulation counter: book issuing, returns, barcode scanning, member enrolment, renewals and catalog lookups.",
    updatedDate: "10/11/2026",
    status: "Active",
  },
  {
    code: "ACCOUNTS_OPERATOR",
    name: "Accounts Operator",
    department: "Finance & Treasury Desk",
    accessLevel: "Finance & Accounts",
    description: "Collects patron fines, lost book recoveries, assesses membership renewal fees and issues official treasury receipts.",
    updatedDate: "10/11/2026",
    status: "Active",
  },
  {
    code: "APPROVING_OFFICER",
    name: "Approving Officer",
    department: "Supervisory & Audit Wing",
    accessLevel: "Supervisory Approvals",
    description: "Empowered to sanction fine waivers, authorize payment reversals, reconcile discrepancies and sign audit statements.",
    updatedDate: "10/11/2026",
    status: "Active",
  },
];

export default function StaffAdministrationPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") as "policies" | "staff" | "roles" | "audit" | null;
  const [activeTab, setActiveTab] = useState<"staff" | "roles" | "policies" | "audit">(initialTab || "staff");

  // Notifications
  const [toastMessage, setToastMessage] = useState<{ msg: string; isError?: boolean } | null>(null);

  const showToast = useCallback((msg: string, isError = false) => {
    setToastMessage({ msg, isError });
    setTimeout(() => setToastMessage(null), 3800);
  }, []);

  // Policies state
  const [loanDaysAdult, setLoanDaysAdult] = useState("14");
  const [loanDaysStudent, setLoanDaysStudent] = useState("21");
  const [finePerDay, setFinePerDay] = useState("2");
  const [gracePeriodDays, setGracePeriodDays] = useState("2");
  const [maxRenewals, setMaxRenewals] = useState("2");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("Library policy configuration saved successfully.");

  // Staff directory state
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffSearch, setStaffSearch] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState("ALL");
  const [staffStatusFilter, setStaffStatusFilter] = useState<"ALL" | "ACTIVE">("ALL");
  const [staffViewMode, setStaffViewMode] = useState<"table" | "cards">("table");

  // Onboard Staff Modal State
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("LIBRARIAN");
  const [newStaffPassword, setNewStaffPassword] = useState("Admin@123");
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [submittingOnboard, setSubmittingOnboard] = useState(false);

  // Edit Staff Modal State
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editStaffName, setEditStaffName] = useState("");
  const [editStaffPhone, setEditStaffPhone] = useState("");
  const [editStaffRole, setEditStaffRole] = useState("");
  const [editStaffStatus, setEditStaffStatus] = useState("ACTIVE");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Reset Password Modal State
  const [resetPassStaff, setResetPassStaff] = useState<StaffMember | null>(null);
  const [resetNewPass, setResetNewPass] = useState("Admin@123");
  const [showResetPass, setShowResetPass] = useState(false);
  const [submittingResetPass, setSubmittingResetPass] = useState(false);

  // View Details Modal State
  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null);

  // Roles tab state
  const [roleSearch, setRoleSearch] = useState("");
  const [roleStatusFilter, setRoleStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [selectedRoleDetails, setSelectedRoleDetails] = useState<RoleDefinition | null>(null);

  // Audit trail state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [auditSearch, setAuditSearch] = useState("");

  // Backup state
  const [downloadingBackup, setDownloadingBackup] = useState(false);

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    try {
      const res = await fetch("/api/administration/backup");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to download database backup");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GPLMS_Database_Backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast("Database JSON snapshot successfully downloaded.");
    } catch (e: any) {
      showToast(`Backup error: ${e.message}`, true);
    } finally {
      setDownloadingBackup(false);
    }
  };

  const loadPolicies = () => {
    fetch("/api/administration/policies")
      .then((res) => res.json())
      .then((data) => {
        if (data.policies && data.policies.length > 0) {
          const generalPolicy = data.policies.find((p: any) => p.category === "GENERAL_CITIZEN");
          const studentPolicy = data.policies.find((p: any) => p.category === "STUDENT");

          if (generalPolicy) {
            setLoanDaysAdult(String(generalPolicy.loanPeriodDays));
            setFinePerDay(String(generalPolicy.finePerDay));
            setGracePeriodDays(String(generalPolicy.gracePeriodDays));
            setMaxRenewals(String(generalPolicy.maxRenewals));
          }
          if (studentPolicy) {
            setLoanDaysStudent(String(studentPolicy.loanPeriodDays));
          }
        }
      })
      .catch((err) => console.error("Error loading policies", err));
  };

  const loadStaff = useCallback(() => {
    setLoadingStaff(true);
    fetch("/api/administration/staff")
      .then((res) => res.json())
      .then((data) => {
        if (data.staffMembers) {
          setStaffList(data.staffMembers);
        }
      })
      .catch((err) => console.error("Error loading staff", err))
      .finally(() => setLoadingStaff(false));
  }, []);

  const loadAuditLogs = useCallback(() => {
    setLoadingAudit(true);
    const query = actionFilter !== "ALL" ? `?action=${actionFilter}` : "";
    fetch(`/api/administration/audit${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.auditLogs) {
          setAuditLogs(data.auditLogs);
        }
      })
      .catch((err) => console.error("Error loading audit logs", err))
      .finally(() => setLoadingAudit(false));
  }, [actionFilter]);

  useEffect(() => {
    loadPolicies();
    loadStaff();
    loadAuditLogs();
  }, [loadStaff, loadAuditLogs]);

  // Sync tab with URL search parameter if changed
  useEffect(() => {
    const tab = searchParams.get("tab") as any;
    if (tab && ["staff", "roles", "policies", "audit"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/administration/policies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanDaysAdult: parseInt(loanDaysAdult, 10),
          loanDaysStudent: parseInt(loanDaysStudent, 10),
          finePerDay: parseFloat(finePerDay),
          gracePeriodDays: parseInt(gracePeriodDays, 10),
          maxRenewals: parseInt(maxRenewals, 10),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update policy settings");
      }

      showToast("Library circulation policies updated successfully.");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      loadPolicies();
    } catch (err: any) {
      showToast(err.message || "Failed to save policies", true);
    } finally {
      setSaving(false);
    }
  };

  // Staff CRUD Handlers
  const handleOnboardStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStaffPhone.trim() && newStaffPhone.trim().length !== 10) {
      showToast("कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें", true);
      return;
    }

    setSubmittingOnboard(true);
    try {
      const res = await fetch("/api/administration/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStaffName.trim(),
          email: newStaffEmail.trim().toLowerCase(),
          phone: newStaffPhone.trim() || undefined,
          role: newStaffRole,
          password: newStaffPassword.trim() || "Admin@123",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to onboard staff");
      }

      showToast(`Staff member "${data.staff.name}" successfully onboarded!`);
      setOnboardModalOpen(false);
      setNewStaffName("");
      setNewStaffEmail("");
      setNewStaffPhone("");
      setNewStaffRole("LIBRARIAN");
      setNewStaffPassword("Admin@123");
      loadStaff();
    } catch (err: any) {
      showToast(err.message || "Onboarding failed", true);
    } finally {
      setSubmittingOnboard(false);
    }
  };

  const handleOpenEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setEditStaffName(staff.name);
    setEditStaffPhone(staff.phone || "");
    setEditStaffRole(staff.role);
    setEditStaffStatus(staff.status);
  };

  const handleSaveEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    if (editStaffPhone.trim() && editStaffPhone.trim().length !== 10) {
      showToast("कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें", true);
      return;
    }

    setSubmittingEdit(true);
    try {
      const res = await fetch("/api/administration/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingStaff.id,
          name: editStaffName.trim(),
          phone: editStaffPhone.trim() || undefined,
          role: editStaffRole,
          status: editStaffStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update staff");
      }

      showToast(`Staff account for "${data.staff.name}" updated successfully.`);
      setEditingStaff(null);
      loadStaff();
    } catch (err: any) {
      showToast(err.message || "Update failed", true);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassStaff) return;

    setSubmittingResetPass(true);
    try {
      const res = await fetch("/api/administration/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resetPassStaff.id,
          password: resetNewPass.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      showToast(`Password for ${resetPassStaff.name} reset to "${resetNewPass}"!`);
      setResetPassStaff(null);
    } catch (err: any) {
      showToast(err.message || "Reset failed", true);
    } finally {
      setSubmittingResetPass(false);
    }
  };

  const handleDeleteStaff = async (staff: StaffMember) => {
    if (!confirm(`Are you sure you want to delete staff account "${staff.name}" (${staff.email})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/administration/staff?id=${staff.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete staff");
      }

      showToast(`Staff account "${staff.name}" deleted.`);
      loadStaff();
    } catch (err: any) {
      showToast(err.message || "Delete failed", true);
    }
  };

  const copyCredentials = (email: string, pass: string = "Admin@123", name: string) => {
    const text =
      `🏛️ District Public Library - Official Staff Login Credentials\n` +
      `Officer Name: ${name}\n` +
      `Official Email / User ID: ${email}\n` +
      `Default Password: ${pass}\n` +
      `Staff Portal URL: ${typeof window !== "undefined" ? window.location.origin : ""}/login`;
    navigator.clipboard.writeText(text);
    showToast(`Credentials for ${name} copied to clipboard!`);
  };

  // Helper mappings for Department & Wing
  const getDepartmentForRole = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return { wing: "Administrative Directorate", jurisdiction: "District Central Library", badgeColor: "bg-purple-100 text-purple-800 border-purple-200" };
      case "LIBRARY_ADMIN":
        return { wing: "Executive Management", jurisdiction: "District Central Library", badgeColor: "bg-blue-100 text-blue-800 border-blue-200" };
      case "LIBRARIAN":
        return { wing: "Circulation & Stacks", jurisdiction: "Circulation Desk Counter", badgeColor: "bg-teal-100 text-teal-800 border-teal-200" };
      case "ACCOUNTS_OPERATOR":
        return { wing: "Finance & Treasury", jurisdiction: "Fee & Revenue Counter", badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "APPROVING_OFFICER":
        return { wing: "Supervisory & Audit", jurisdiction: "Executive Oversight Office", badgeColor: "bg-amber-100 text-amber-800 border-amber-200" };
      default:
        return { wing: "General Operations", jurisdiction: "District Central Library", badgeColor: "bg-slate-100 text-slate-800 border-slate-200" };
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "APPROVING_OFFICER":
        return "bg-amber-50 text-amber-800 border border-amber-200";
      case "LIBRARY_ADMIN":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "ACCOUNTS_OPERATOR":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      default:
        return "bg-teal-50 text-teal-700 border border-teal-200";
    }
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchSearch =
        !staffSearch.trim() ||
        s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(staffSearch.toLowerCase()) ||
        (s.phone && s.phone.includes(staffSearch));
      const matchRole = staffRoleFilter === "ALL" || s.role === staffRoleFilter;
      const matchStatus = staffStatusFilter === "ALL" || s.status === staffStatusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [staffList, staffSearch, staffRoleFilter, staffStatusFilter]);

  // Filtered roles list
  const filteredRoles = useMemo(() => {
    return LIBRARY_ROLES.filter((r) => {
      const matchSearch =
        !roleSearch.trim() ||
        r.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
        r.code.toLowerCase().includes(roleSearch.toLowerCase()) ||
        r.description.toLowerCase().includes(roleSearch.toLowerCase());
      const matchStatus = roleStatusFilter === "ALL" || r.status === roleStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [roleSearch, roleStatusFilter]);

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch =
        !auditSearch.trim() ||
        log.actorName.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
        (log.metadataJson && log.metadataJson.toLowerCase().includes(auditSearch.toLowerCase()));
      return matchSearch;
    });
  }, [auditLogs, auditSearch]);

  const activeStaffCount = staffList.filter((s) => s.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
              toastMessage.isError
                ? "bg-rose-50 text-rose-800 border-rose-300"
                : "bg-emerald-50 text-emerald-900 border-emerald-300"
            }`}
          >
            {toastMessage.isError ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            <span>{toastMessage.msg}</span>
          </div>
        </div>
      )}

      {/* TOP HEADER & NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase tracking-wider mb-0.5">
            <span className="font-bold">
              {activeTab === "staff"
                ? "District Library Staff"
                : activeTab === "roles"
                ? "Roles & Access Control"
                : activeTab === "policies"
                ? "Circulation Policies"
                : "System Audit Trail"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {activeTab === "staff"
              ? "Onboard Library Staff"
              : activeTab === "roles"
              ? "Roles & Access Control Matrix"
              : activeTab === "policies"
              ? "Circulation Policies & Fine Schedules"
              : "System Audit Trail"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeTab === "staff"
              ? "Staff Onboarding & Role Assignment for District Public Library System"
              : activeTab === "roles"
              ? "Create roles and decide who can use each part of the Library Management System."
              : "Circulation rules, fine calculations, and immutable administrative audit logs"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadBackup}
            disabled={downloadingBackup}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
            title="Download full JSON database snapshot for audit and disaster recovery"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{downloadingBackup ? "Exporting..." : "Export Backup"}</span>
          </button>

          {/* TAB SWITCHER */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setActiveTab("staff")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === "staff"
                  ? "bg-white text-teal-800 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Library Staff</span>
            </button>
            <button
              onClick={() => setActiveTab("roles")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === "roles"
                  ? "bg-white text-teal-800 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Roles & Access</span>
            </button>
            <button
              onClick={() => setActiveTab("policies")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === "policies"
                  ? "bg-white text-teal-800 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Policies</span>
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === "audit"
                  ? "bg-white text-teal-800 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIBRARY STAFF DIRECTORY (Inspired directly by Image 3)             */}
      {/* ========================================================================= */}
      {activeTab === "staff" && (
        <div className="space-y-5">
          {/* TOP 3 METRIC KPI CARDS (Matching Image 3 Style) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Active Officers */}
            <div className="bg-white border-2 border-blue-500 rounded-2xl p-4 shadow-xs flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Officers
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 tabular-nums">
                    {staffList.length}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium truncate">
                    In District Central Library
                  </span>
                </div>
              </div>
              <span className="absolute top-3 right-3 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                ● Active
              </span>
            </div>

            {/* Card 2: Can Sign In */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-[#0d7a55] text-white flex items-center justify-center shrink-0 shadow-sm">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Can Sign In
                </div>
                <div className="text-2xl font-black text-slate-900 tabular-nums">
                  {activeStaffCount}
                </div>
              </div>
              <span className="absolute top-3 right-3 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                100% Ready
              </span>
            </div>

            {/* Card 3: Library Wings */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Departments / Wings
                </div>
                <div className="text-2xl font-black text-slate-900 tabular-nums">
                  5
                </div>
              </div>
              <span className="text-[11px] text-slate-500 font-medium truncate">
                Central Library Hub
              </span>
            </div>
          </div>

          {/* ACTION BUTTONS & SEARCH FILTER BAR (Matching Image 3) */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Left Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder="Search officer name, designation, user ID, email, or mobile..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-[#0d7a55] focus:bg-white transition"
                />
              </div>

              {/* Action Buttons Top Right (Matching Image 3) */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={loadStaff}
                  className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                  title="Refresh staff list"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingStaff ? "animate-spin text-teal-700" : "text-slate-500"}`} />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={() => {
                    const csvContent =
                      "data:text/csv;charset=utf-8," +
                      ["Name,Email,Phone,Role,Status,Created"].join(",") +
                      "\n" +
                      staffList.map((s) => `"${s.name}","${s.email}","${s.phone || ""}","${s.role}","${s.status}","${s.createdAt}"`).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `District_Library_Staff_${new Date().toISOString().slice(0, 10)}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast("Staff register exported as CSV!");
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                  title="Export Staff CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                  title="Print Report"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print Report</span>
                </button>

                <button
                  onClick={() => setOnboardModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Onboard New Officer</span>
                </button>
              </div>
            </div>

            {/* Filter Pills & View Toggles (Image 3 Style) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider mr-1">
                  STATUS:
                </span>
                <button
                  onClick={() => setStaffStatusFilter("ALL")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                    staffStatusFilter === "ALL"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Officers ({staffList.length})
                </button>
                <button
                  onClick={() => setStaffStatusFilter("ACTIVE")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                    staffStatusFilter === "ACTIVE"
                      ? "bg-emerald-700 text-white"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  ● Active ({activeStaffCount})
                </button>
              </div>

              {/* Department Filter & Layout Toggle */}
              <div className="flex items-center gap-2">
                <select
                  value={staffRoleFilter}
                  onChange={(e) => setStaffRoleFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-[#0d7a55]"
                >
                  <option value="ALL">All Departments (5)</option>
                  <option value="SUPER_ADMIN">Administrative Directorate</option>
                  <option value="LIBRARY_ADMIN">Executive Management</option>
                  <option value="LIBRARIAN">Circulation & Stacks</option>
                  <option value="ACCOUNTS_OPERATOR">Finance & Treasury</option>
                  <option value="APPROVING_OFFICER">Supervisory & Audit</option>
                </select>

                <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setStaffViewMode("table")}
                    className={`p-1 rounded-md transition cursor-pointer ${
                      staffViewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-400 hover:text-slate-700"
                    }`}
                    title="Table View"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setStaffViewMode("cards")}
                    className={`p-1 rounded-md transition cursor-pointer ${
                      staffViewMode === "cards" ? "bg-white text-slate-900 shadow-xs" : "text-slate-400 hover:text-slate-700"
                    }`}
                    title="Card View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* STAFF TABLE VIEW (Inspired directly by Image 3) */}
          {staffViewMode === "table" ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8faf9] border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">OFFICER & DESIGNATION</th>
                      <th className="py-3 px-4">DEPARTMENT & JURISDICTION</th>
                      <th className="py-3 px-4">OFFICIAL CREDENTIALS</th>
                      <th className="py-3 px-4">STATUS</th>
                      <th className="py-3 px-4">INSPECTIONS / DUTY</th>
                      <th className="py-3 px-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          {loadingStaff ? "Loading staff directory..." : "No staff accounts found matching filters."}
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map((staff) => {
                        const dept = getDepartmentForRole(staff.role);
                        const roleObj = LIBRARY_ROLES.find((r) => r.code === staff.role);

                        return (
                          <tr key={staff.id} className="hover:bg-slate-50/80 transition group">
                            {/* Officer & Designation */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                                  {staff.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 text-xs">{staff.name}</span>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                  </div>
                                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                    <span>{roleObj?.name || staff.role}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    📞 {staff.phone || "No phone"} • ✉️ {staff.email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Department & Jurisdiction */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                                  <Building2 className="w-3 h-3 text-slate-500" />
                                  <span>{dept.wing}</span>
                                </span>
                                <div className="text-[11px] text-slate-500">
                                  📍 {dept.jurisdiction}
                                </div>
                              </div>
                            </td>

                            {/* Official Credentials Box (Exact style of Image 3) */}
                            <td className="py-3.5 px-4">
                              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 w-60">
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="text-slate-500">ID:</span>
                                  <span className="font-bold text-slate-800 truncate max-w-[170px]" title={staff.email}>
                                    {staff.email}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="text-slate-500">Password:</span>
                                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Default set</span>
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => copyCredentials(staff.email, "Admin@123", staff.name)}
                                  className="w-full mt-1 py-1 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs"
                                >
                                  <Copy className="w-3 h-3 text-slate-500" />
                                  <span>Copy Credentials</span>
                                </button>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                <span>Active</span>
                              </span>
                            </td>

                            {/* Duty / Scope */}
                            <td className="py-3.5 px-4">
                              <span className="text-[11px] font-medium text-slate-600">
                                {roleObj?.accessLevel || "Standard Access"}
                              </span>
                            </td>

                            {/* Staff Actions */}
                            <td className="py-3.5 px-4 text-right space-x-1">
                              <button
                                onClick={() => setViewingStaff(staff)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                title="View details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setResetPassStaff(staff);
                                  setResetNewPass("Admin@123");
                                }}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                title="Reset login password"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenEditStaff(staff)}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                title="Edit profile"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteStaff(staff)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="py-3 px-4 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                <span>Showing {filteredStaff.length} of {staffList.length} officers</span>
                <span className="text-[11px] text-slate-400">© 2026 District Public Library · State Informatics Framework</span>
              </div>
            </div>
          ) : (
            /* CARDS VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((staff) => {
                const dept = getDepartmentForRole(staff.role);
                const roleObj = LIBRARY_ROLES.find((r) => r.code === staff.role);

                return (
                  <div key={staff.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                          {staff.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1">
                            <span>{staff.name}</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {roleObj?.name || staff.role}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          staff.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        ● {staff.status}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>Wing:</span>
                        <span className="font-semibold text-slate-800">{dept.wing}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>Email:</span>
                        <span className="font-mono text-slate-800 truncate max-w-[170px]">{staff.email}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>Phone:</span>
                        <span className="font-mono text-slate-800">{staff.phone || "—"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => copyCredentials(staff.email, "Admin@123", staff.name)}
                        className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy ID & Pass</span>
                      </button>
                      <button
                        onClick={() => handleOpenEditStaff(staff)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                        title="Edit profile"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ROLES & ACCESS CONTROL MATRIX (Inspired directly by Image 2)        */}
      {/* ========================================================================= */}
      {activeTab === "roles" && (
        <div className="space-y-5">
          {/* TOP 3 METRIC KPI CARDS (Matching Image 2 Style) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Configured Roles */}
            <div className="bg-white border-2 border-blue-500 rounded-2xl p-4 shadow-xs flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Configured Roles
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 tabular-nums">
                    {LIBRARY_ROLES.length}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">Templates</span>
                </div>
              </div>
              <span className="absolute top-3 right-3 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                ● Active
              </span>
            </div>

            {/* Card 2: Operational Roles */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-[#0d7a55] text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Operational Roles
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 tabular-nums">
                    {LIBRARY_ROLES.length}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-bold">100%</span>
                </div>
              </div>
            </div>

            {/* Card 3: Assigned Officers */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Assigned Officers
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 tabular-nums">
                    {staffList.length}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium truncate">
                    In District Central Library
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTERS FOR ROLES (Matching Image 2) */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  placeholder="Search role name, code, inspection scope..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-[#0d7a55] focus:bg-white transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => showToast("Roles matrix synchronized!")}
                  className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => {
                    const csvContent =
                      "data:text/csv;charset=utf-8," +
                      ["Role,Code,Department,AccessLevel,Status"].join(",") +
                      "\n" +
                      LIBRARY_ROLES.map((r) => `"${r.name}","${r.code}","${r.department}","${r.accessLevel}","${r.status}"`).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `District_Library_Roles_${new Date().toISOString().slice(0, 10)}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast("Role templates exported as CSV!");
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider mr-1">STATUS:</span>
              <button
                onClick={() => setRoleStatusFilter("ALL")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                  roleStatusFilter === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Roles ({LIBRARY_ROLES.length})
              </button>
              <button
                onClick={() => setRoleStatusFilter("Active")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                  roleStatusFilter === "Active" ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                ● Active ({LIBRARY_ROLES.length})
              </button>
              <button
                onClick={() => setRoleStatusFilter("Inactive")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                  roleStatusFilter === "Inactive" ? "bg-rose-700 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                }`}
              >
                ● Inactive (0)
              </button>
            </div>
          </div>

          {/* ROLES MATRIX TABLE (Exact match to Image 2) */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8faf9] border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Role & Inspection Code ↑</th>
                    <th className="py-3 px-4">Department & Wing ↑↓</th>
                    <th className="py-3 px-4">Access Level ↑↓</th>
                    <th className="py-3 px-4">Assigned Officers ↑↓</th>
                    <th className="py-3 px-4">Status ↑↓</th>
                    <th className="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRoles.map((role) => {
                    const assignedOfficers = staffList.filter((s) => s.role === role.code);

                    return (
                      <tr key={role.code} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 text-xs">{role.name}</div>
                            <span className="inline-block font-mono text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200">
                              {role.code}
                            </span>
                            <p className="text-[11px] text-slate-500 max-w-sm mt-0.5 leading-tight">
                              {role.description}
                            </p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-slate-800 font-medium">{role.department}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            Updated: {role.updatedDate}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              role.accessLevel === "Full Control"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : role.accessLevel === "Circulation Desk"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {role.accessLevel}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold font-mono">
                            <Users className="w-3 h-3 text-slate-500" />
                            <span>{assignedOfficers.length} Officers</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={role.status === "Active"} readOnly className="sr-only peer" />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                            <span className="text-xs font-semibold text-emerald-800">Active</span>
                          </label>
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`Role: ${role.name}\nCode: ${role.code}\nScope: ${role.description}`);
                              showToast(`Role template ${role.code} copied!`);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Copy role template"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedRoleDetails(role)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="View permissions"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="py-3 px-4 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>Showing {filteredRoles.length} of {LIBRARY_ROLES.length} roles</span>
              <span className="text-[11px] text-slate-400">Governance & Role Delegation Framework © 2026</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CIRCULATION POLICIES (Existing policy form preserved)              */}
      {/* ========================================================================= */}
      {activeTab === "policies" && (
        <form onSubmit={handleSavePolicies} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Clock className="w-4 h-4 text-teal-700" />
              <h3 className="font-semibold text-slate-900 text-xs">Lending & Loan Periods</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  General Citizen Loan Duration (days)
                </label>
                <input
                  type="number"
                  value={loanDaysAdult}
                  onChange={(e) => setLoanDaysAdult(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Student Member Loan Duration (days)
                </label>
                <input
                  type="number"
                  value={loanDaysStudent}
                  onChange={(e) => setLoanDaysStudent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Maximum Permitted Renewals per Book
                </label>
                <input
                  type="number"
                  value={maxRenewals}
                  onChange={(e) => setMaxRenewals(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <IndianRupee className="w-4 h-4 text-teal-700" />
              <h3 className="font-semibold text-slate-900 text-xs">Fine & Grace Period Schedules</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Daily Overdue Fine Rate (₹ per day)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={finePerDay}
                  onChange={(e) => setFinePerDay(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Grace Period Days (No fine assessed)
                </label>
                <input
                  type="number"
                  value={gracePeriodDays}
                  onChange={(e) => setGracePeriodDays(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#0d7a55] hover:bg-[#0a6344] text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Saving Policy..." : "Update Circulation Policy"}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: IMMUTABLE AUDIT TRAIL                                              */}
      {/* ========================================================================= */}
      {activeTab === "audit" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Immutable System Audit Trail</h3>
              <p className="text-xs text-slate-500">Traceable ledger of all sensitive governance and supervisory events</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter audit actions..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-[#0d7a55]"
                />
              </div>
              <button
                onClick={loadAuditLogs}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                title="Refresh logs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#f8faf9] border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor & Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity Type</th>
                  <th className="py-2.5 px-3">Metadata / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                      {loadingAudit ? "Retrieving immutable audit records..." : "No matching audit log records found."}
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Date(log.timestamp).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-800 font-sans">{log.actorName}</span>
                        <span className="ml-1 text-[10px] text-slate-400">({log.actorRole})</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-sans">{log.entityType}</td>
                      <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs" title={log.metadataJson || "—"}>
                        {log.metadataJson || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ONBOARD NEW STAFF (Inspired by Image 3)                          */}
      {/* ========================================================================= */}
      {onboardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Onboard District Library Officer
                  </h3>
                  <p className="text-xs text-slate-500">
                    Provision new government library personnel credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOnboardModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOnboardStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Full Officer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shri Rajesh Kumar Sharma"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Official Email ID *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="officer@library.gov.in"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600 text-xs font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-medium">
                      Mobile Number
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {newStaffPhone ? `${newStaffPhone.length}/10` : "10 Digits"}
                    </span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210 (10 अंक)"
                    value={newStaffPhone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setNewStaffPhone(digits);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Designated System Role *
                </label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600 bg-white text-xs font-medium"
                >
                  <option value="LIBRARIAN">Librarian (Circulation Desk & Inventory Operations)</option>
                  <option value="ACCOUNTS_OPERATOR">Accounts Operator (Fee Collection & Receipting)</option>
                  <option value="APPROVING_OFFICER">Approving Officer (Fine Waivers & Payment Reversals)</option>
                  <option value="LIBRARY_ADMIN">Library Admin (Management & Cataloging Oversight)</option>
                  <option value="SUPER_ADMIN">Super Admin (Complete System Governance)</option>
                </select>
              </div>

              {/* Password Section */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-950 flex items-center gap-1.5 text-[11px]">
                    <Key className="w-3.5 h-3.5 text-blue-600" />
                    <span>Login Password</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const randomPass = `Admin@${new Date().getFullYear()}#${Math.floor(100 + Math.random() * 900)}`;
                      setNewStaffPassword(randomPass);
                    }}
                    className="text-[10px] text-blue-700 hover:text-blue-900 font-semibold bg-white px-2 py-0.5 rounded border border-blue-200 cursor-pointer"
                  >
                    Regenerate
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showStaffPassword ? "text" : "password"}
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    className="w-full px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900 bg-white border border-blue-300 rounded-lg focus:outline-blue-600 pr-14"
                  />
                  <div className="absolute right-1 flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showStaffPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`ID: ${newStaffEmail}\nPassword: ${newStaffPassword}`);
                        showToast("क्रेडेंशियल्स कॉपी हो गए!");
                      }}
                      className="p-1 text-slate-400 hover:text-blue-700 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOnboardModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOnboard}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingOnboard ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Onboarding...</span>
                    </>
                  ) : (
                    <span>Confirm & Onboard Officer</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT STAFF DETAILS */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <Pencil className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Officer Record
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">{editingStaff.email}</p>
                </div>
              </div>
              <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Full Officer Name</label>
                <input
                  type="text"
                  required
                  value={editStaffName}
                  onChange={(e) => setEditStaffName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Phone Number (10 Digits)</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={editStaffPhone}
                  onChange={(e) => setEditStaffPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Designated Role</label>
                  <select
                    value={editStaffRole}
                    onChange={(e) => setEditStaffRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55] bg-white font-medium"
                  >
                    <option value="LIBRARIAN">Librarian</option>
                    <option value="ACCOUNTS_OPERATOR">Accounts Operator</option>
                    <option value="APPROVING_OFFICER">Approving Officer</option>
                    <option value="LIBRARY_ADMIN">Library Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {submittingEdit ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESET PASSWORD */}
      {resetPassStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Key className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reset Password</h3>
                  <p className="text-xs text-slate-500 font-sans">{resetPassStaff.name}</p>
                </div>
              </div>
              <button onClick={() => setResetPassStaff(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">New Password</label>
                <div className="relative flex items-center">
                  <input
                    type={showResetPass ? "text" : "password"}
                    required
                    value={resetNewPass}
                    onChange={(e) => setResetNewPass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-amber-600 font-mono font-bold pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPass(!showResetPass)}
                    className="absolute right-2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    {showResetPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPassStaff(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResetPass}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {submittingResetPass ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: VIEW OFFICER DETAILS */}
      {viewingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Government Officer Record
              </span>
              <button onClick={() => setViewingStaff(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
                {viewingStaff.name.slice(0, 2).toUpperCase()}
              </div>
              <h3 className="text-base font-bold text-slate-900">{viewingStaff.name}</h3>
              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                {viewingStaff.role}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Official Email:</span>
                <span className="font-mono font-bold text-slate-800">{viewingStaff.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mobile Phone:</span>
                <span className="font-mono text-slate-800">{viewingStaff.phone || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Status:</span>
                <span className="font-bold text-emerald-700">{viewingStaff.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Enrolled On:</span>
                <span className="font-mono text-slate-700">
                  {new Date(viewingStaff.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                copyCredentials(viewingStaff.email, "Admin@123", viewingStaff.name);
              }}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Official Credentials</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: ROLE PERMISSIONS DETAILS */}
      {selectedRoleDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">{selectedRoleDetails.name}</h3>
              </div>
              <button onClick={() => setSelectedRoleDetails(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">System Code:</span>
                <span className="font-mono font-bold text-blue-700">{selectedRoleDetails.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Wing / Directorate:</span>
                <span className="font-semibold text-slate-800">{selectedRoleDetails.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Access Scope:</span>
                <span className="font-bold text-purple-700">{selectedRoleDetails.accessLevel}</span>
              </div>
            </div>

            <div className="text-xs space-y-1.5 text-slate-600">
              <p className="font-bold text-slate-800">Operational Mandate & Permissions:</p>
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed">
                {selectedRoleDetails.description}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRoleDetails(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
