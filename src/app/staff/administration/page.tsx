"use client";

import { useState, useEffect } from "react";
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

export default function StaffAdministrationPage() {
  const [activeTab, setActiveTab] = useState<"policies" | "staff" | "audit">("policies");

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

  // Audit trail state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [auditSearch, setAuditSearch] = useState("");

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

  const loadStaff = () => {
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
  };

  const loadAuditLogs = () => {
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
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  useEffect(() => {
    if (activeTab === "staff") {
      loadStaff();
    } else if (activeTab === "audit") {
      loadAuditLogs();
    }
  }, [activeTab, actionFilter]);

  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        policies: [
          {
            category: "GENERAL_CITIZEN",
            loanPeriodDays: Number(loanDaysAdult),
            maxRenewals: Number(maxRenewals),
            finePerDay: Number(finePerDay),
            gracePeriodDays: Number(gracePeriodDays),
            maxBooksAllowed: 3,
          },
          {
            category: "STUDENT",
            loanPeriodDays: Number(loanDaysStudent),
            maxRenewals: Number(maxRenewals) + 1,
            finePerDay: Math.max(1, Math.floor(Number(finePerDay) / 2)),
            gracePeriodDays: Number(gracePeriodDays) + 1,
            maxBooksAllowed: 4,
          },
        ],
      };

      const res = await fetch("/api/administration/policies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update policies");
      }

      setMessage("Library policy configuration updated in database successfully.");
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err: any) {
      setMessage(`Error saving policies: ${err.message}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (!auditSearch) return true;
    const q = auditSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.actorName.toLowerCase().includes(q) ||
      log.entityType.toLowerCase().includes(q) ||
      (log.metadataJson && log.metadataJson.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {saved && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-800 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs flex items-center gap-2 border border-teal-500 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-teal-300" />
          <span>{message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            System Administration & Governance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Circulation rules, staff roles, and immutable administrative audit logs
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab("policies")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === "policies"
                ? "bg-white text-teal-800 font-semibold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Circulation Policies</span>
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === "staff"
                ? "bg-white text-teal-800 font-semibold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff Directory</span>
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition cursor-pointer ${
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

      {/* TAB 1: POLICIES */}
      {activeTab === "policies" && (
        <form onSubmit={handleSavePolicies} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Lending Policy */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Clock className="w-4 h-4 text-teal-700" />
              <h3 className="font-semibold text-slate-900 text-xs">
                Lending & Loan Periods
              </h3>
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
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-teal-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Student & Scholar Loan Duration (days)
                </label>
                <input
                  type="number"
                  value={loanDaysStudent}
                  onChange={(e) => setLoanDaysStudent(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-teal-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Max Allowed Online Renewals
                </label>
                <input
                  type="number"
                  value={maxRenewals}
                  onChange={(e) => setMaxRenewals(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Fines & Tariffs */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <IndianRupee className="w-4 h-4 text-teal-700" />
              <h3 className="font-semibold text-slate-900 text-xs">
                Overdue Fine Tariff & Grace Rules
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Fine Rate per Day Overdue (₹)
                </label>
                <input
                  type="number"
                  value={finePerDay}
                  onChange={(e) => setFinePerDay(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-teal-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Overdue Grace Period (days before fine applies)
                </label>
                <input
                  type="number"
                  value={gracePeriodDays}
                  onChange={(e) => setGracePeriodDays(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-teal-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 disabled:opacity-50 shadow-xs transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving Changes..." : "Save Policy Settings"}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: STAFF DIRECTORY */}
      {activeTab === "staff" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 text-xs">Authorized Staff Accounts</h3>
              <p className="text-[11px] text-slate-500">Government library personnel and role delegations</p>
            </div>
            <button
              onClick={loadStaff}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-50 transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStaff ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Staff Name & Email</th>
                  <th className="py-3 px-4">Designated Role</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      {loadingStaff ? "Loading staff directory..." : "No staff accounts found."}
                    </td>
                  </tr>
                ) : (
                  staffList.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{staff.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{staff.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          staff.role === "SUPER_ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : staff.role === "APPROVING_OFFICER"
                            ? "bg-amber-100 text-amber-800"
                            : staff.role === "LIBRARY_ADMIN"
                            ? "bg-blue-100 text-blue-800"
                            : staff.role === "ACCOUNTS_OPERATOR"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-teal-100 text-teal-800"
                        }`}>
                          {staff.role.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {staff.phone || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{staff.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px]">
                        {new Date(staff.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === "audit" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-slate-900 text-xs">Immutable System Audit Trail</h3>
              <p className="text-[11px] text-slate-500">Traceable ledger of all sensitive governance and supervisory events</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter audit records..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-teal-600 w-44"
                />
              </div>

              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 focus:outline-teal-600"
              >
                <option value="ALL">All Actions</option>
                <option value="POLICIES_UPDATED">Policies Updated</option>
                <option value="CHARGE_WAIVED">Charge Waived</option>
                <option value="PAYMENT_REVERSED">Payment Reversed</option>
                <option value="BOOK_CREATED">Book Created</option>
                <option value="COPY_ADDED">Copy Added</option>
                <option value="MEMBER_REGISTERED">Member Registered</option>
              </select>

              <button
                onClick={loadAuditLogs}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                title="Refresh audit log"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Authorized Actor</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      {loadingAudit ? "Loading audit logs..." : "No audit records matching query."}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{log.actorName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{log.actorRole}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.action.includes("WAIVED") || log.action.includes("REVERSED")
                            ? "bg-amber-100 text-amber-800"
                            : log.action.includes("UPDATED")
                            ? "bg-blue-100 text-blue-800"
                            : "bg-teal-100 text-teal-800"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {log.entityType}
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500 max-w-xs truncate" title={log.metadataJson || ""}>
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
    </div>
  );
}
