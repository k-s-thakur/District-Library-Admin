"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  Users,
  UserPlus,
  Download,
  SlidersHorizontal,
  Search,
  MoreHorizontal,
  CheckCircle2,
  X,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Printer,
  ShieldAlert,
  User,
  HelpCircle,
} from "lucide-react";
import { useStaff } from "@/context/StaffContext";

interface MemberRecord {
  id: string;
  name: string;
  subtitle: string;
  memberNo: string;
  category: "Adult" | "Student" | "Senior" | "Researcher" | "Govt Staff";
  nextDueDate: string;
  status: "Active" | "Expired" | "Suspended";
  email?: string;
  phone?: string;
  address?: string;
}

const sampleMembers: MemberRecord[] = [
  {
    id: "m-1",
    name: "Aranya Sharma",
    subtitle: "Member record - sample",
    memberNo: "MBR-2024-0185",
    category: "Adult",
    nextDueDate: "24 Oct 2026",
    status: "Active",
    email: "aranya.sharma@example.com",
    phone: "+91 98110 23451",
    address: "Block C, Vasant Kunj, New Delhi",
  },
  {
    id: "m-2",
    name: "Rahul Verma",
    subtitle: "Member record - sample",
    memberNo: "MBR-2023-0984",
    category: "Student",
    nextDueDate: "21 Oct 2026",
    status: "Active",
    email: "rahul.verma@example.com",
    phone: "+91 98711 54321",
    address: "D-42, Hauz Khas, New Delhi",
  },
  {
    id: "m-3",
    name: "Meera Nair",
    subtitle: "Member record - sample",
    memberNo: "MBR-2025-0271",
    category: "Adult",
    nextDueDate: "—",
    status: "Active",
    email: "meera.nair@example.com",
    phone: "+91 99100 88214",
    address: "Mayur Vihar Phase 1, Delhi",
  },
  {
    id: "m-4",
    name: "Kabir Singh",
    subtitle: "Member record - sample",
    memberNo: "MBR-2022-0455",
    category: "Senior",
    nextDueDate: "18 Oct 2026",
    status: "Expired",
    email: "kabir.singh@example.com",
    phone: "+91 98101 77332",
    address: "Greater Kailash II, New Delhi",
  },
  {
    id: "m-5",
    name: "Ananya Iyer",
    subtitle: "Member record - sample",
    memberNo: "MBR-2024-0312",
    category: "Student",
    nextDueDate: "28 Oct 2026",
    status: "Active",
    email: "ananya.iyer@example.com",
    phone: "+91 98188 99112",
    address: "Chanakyapuri, New Delhi",
  },
];

export default function StaffMembersPage() {
  const { previewData } = useStaff();
  const [membersList, setMembersList] = useState<MemberRecord[]>(sampleMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Modals state
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [selectedCardMember, setSelectedCardMember] = useState<MemberRecord | null>(null);
  const [activeActionDropdown, setActiveActionDropdown] = useState<string | null>(null);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Registration Form State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCategory, setNewCategory] = useState<"Adult" | "Student" | "Senior" | "Researcher" | "Govt Staff">("Adult");
  const [newAddress, setNewAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setActiveActionDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!previewData) {
      fetch("/api/members")
        .then((res) => res.json())
        .then((data) => {
          if (data.members && data.members.length > 0) {
            const mapped: MemberRecord[] = data.members.map((m: any) => ({
              id: m.id,
              name: m.fullName,
              subtitle: "Member record - sample",
              memberNo: m.memberNo,
              category:
                m.category === "STUDENT"
                  ? "Student"
                  : m.category === "SENIOR_CITIZEN"
                  ? "Senior"
                  : m.category === "RESEARCHER"
                  ? "Researcher"
                  : "Adult",
              nextDueDate:
                m.loans && m.loans[0]
                  ? new Date(m.loans[0].dueDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—",
              status: m.status === "ACTIVE" ? "Active" : "Expired",
              email: m.email,
              phone: m.phone,
              address: m.address,
            }));
            setMembersList(mapped);
          }
        })
        .catch(() => {});
    } else {
      setMembersList(sampleMembers);
    }
  }, [previewData]);

  const filteredMembers = useMemo(() => {
    return membersList.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.memberNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.email && m.email.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory = categoryFilter === "All" || m.category === categoryFilter;
      const matchStatus = statusFilter === "All" || m.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [membersList, searchQuery, categoryFilter, statusFilter]);

  const handleExportCSV = () => {
    const headers = ["Member No", "Name", "Category", "Next Due Date", "Status", "Email", "Phone", "Address"];
    const rows = filteredMembers.map((m) => [
      m.memberNo,
      `"${m.name}"`,
      m.category,
      m.nextDueDate,
      m.status,
      m.email || "",
      m.phone || "",
      `"${m.address || ""}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Janata_Library_Members_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Member register exported as CSV successfully.");
  };

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 3000);
  };

  const handleRegisterMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const generatedNo = `MBR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRecord: MemberRecord = {
      id: `m-${Date.now()}`,
      name: newName.trim(),
      subtitle: "Member record - sample",
      memberNo: generatedNo,
      category: newCategory,
      nextDueDate: "—",
      status: "Active",
      email: newEmail.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim(),
    };

    try {
      await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newName.trim(),
          email: newEmail.trim() || `${generatedNo.toLowerCase()}@janatalibrary.local`,
          phone: newPhone.trim() || undefined,
          address: newAddress.trim() || undefined,
          category: newCategory.toUpperCase().replace(" ", "_"),
        }),
      });
    } catch {}

    setMembersList((prev) => [newRecord, ...prev]);
    setSubmitting(false);
    setRegisterModalOpen(false);
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewAddress("");
    showToast(`Registered member ${newRecord.name} (${newRecord.memberNo}) successfully.`);
  };

  const handleRenewMember = (id: string) => {
    setMembersList((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "Active", nextDueDate: "21 Nov 2026" } : m))
    );
    setActiveActionDropdown(null);
    showToast("Membership renewed for 1 academic year.");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notificationToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0d7a55] text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs flex items-center gap-2 border border-emerald-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#e2f6ee] text-[#0d7a55] flex items-center justify-center shrink-0 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Members Directory
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review membership status, enrolment records, and digital credentials.
            </p>
          </div>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Register</span>
          </button>

          <button
            onClick={() => setRegisterModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0d7a55] hover:bg-[#0a6344] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Member</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Members */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#e6f7f0] text-[#0d7a55] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">3,218</div>
            <div className="text-xs text-slate-500 mt-0.5">Active Members</div>
          </div>
        </div>

        {/* Due This Month */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#e8f2fe] text-[#2563eb] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">146</div>
            <div className="text-xs text-slate-500 mt-0.5">Renewals Due This Month</div>
          </div>
        </div>

        {/* Expired Memberships */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#fdeeed] text-[#dc2626] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#dc2626] tabular-nums leading-tight">32</div>
            <div className="text-xs text-slate-500 mt-0.5">Expired Memberships</div>
          </div>
        </div>

        {/* New This Week */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#f0edfb] text-[#7c3aed] flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">18</div>
            <div className="text-xs text-slate-500 mt-0.5">New This Week</div>
          </div>
        </div>
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member name, ID, or email..."
            className="w-full pl-10 pr-3.5 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-[#0d7a55] focus:bg-white transition"
          />
        </div>

        {/* Filters Popover */}
        <div className="relative w-full sm:w-auto" ref={filterRef}>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters</span>
            {(categoryFilter !== "All" || statusFilter !== "All") && (
              <span className="w-2 h-2 rounded-full bg-[#0d7a55]" />
            )}
          </button>

          {/* Filters Dropdown Popover */}
          {filtersOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-40 text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">Filter Members</span>
                <button
                  onClick={() => {
                    setCategoryFilter("All");
                    setStatusFilter("All");
                  }}
                  className="text-slate-400 hover:text-slate-700 text-[11px] cursor-pointer"
                >
                  Reset
                </button>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-[#0d7a55]"
                >
                  <option value="All">All Categories</option>
                  <option value="Adult">Adult Citizen</option>
                  <option value="Student">Student</option>
                  <option value="Senior">Senior Citizen</option>
                  <option value="Researcher">Researcher</option>
                  <option value="Govt Staff">Govt Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-[#0d7a55]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              <button
                onClick={() => setFiltersOpen(false)}
                className="w-full py-2 rounded-xl bg-[#0d7a55] text-white font-medium hover:bg-[#0a6344] cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Members Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] tracking-widest uppercase font-bold text-[#0d7a55]">
              PATRON REGISTRY
            </p>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Enrolled Library Members
            </h3>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-3 py-1 rounded-full self-start sm:self-auto">
            {filteredMembers.length} records matching
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f2f7f4] border-b border-slate-200/80 text-[11px] font-bold text-[#536b60] uppercase tracking-wider">
                <th className="py-3 px-5">MEMBER</th>
                <th className="py-3 px-5">MEMBER NO.</th>
                <th className="py-3 px-5">CATEGORY</th>
                <th className="py-3 px-5">NEXT DUE DATE</th>
                <th className="py-3 px-5">STATUS</th>
                <th className="py-3 px-5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No members match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition group">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#e2f6ee] text-[#0d7a55] flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 leading-tight">
                            {member.name}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {member.subtitle}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 font-mono text-slate-600 text-xs">
                      {member.memberNo}
                    </td>

                    <td className="py-3.5 px-5 text-slate-700">
                      {member.category}
                    </td>

                    <td className="py-3.5 px-5 text-slate-600 text-xs">
                      {member.nextDueDate}
                    </td>

                    <td className="py-3.5 px-5">
                      {member.status === "Active" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-[#e2f6ee] text-[#0d7a55] border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0d7a55]" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-[#fee2e2] text-[#b91c1c] border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#b91c1c]" />
                          <span>Expired</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-right relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveActionDropdown(
                            activeActionDropdown === member.id ? null : member.id
                          );
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                        title="Actions"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {activeActionDropdown === member.id && (
                        <div
                          ref={actionMenuRef}
                          className="absolute right-5 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 text-left text-xs"
                        >
                          <button
                            onClick={() => {
                              setSelectedCardMember(member);
                              setActiveActionDropdown(null);
                            }}
                            className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-[#0d7a55]" />
                            <span>View Digital Card</span>
                          </button>
                          <button
                            onClick={() => handleRenewMember(member.id)}
                            className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                          >
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span>Renew Membership</span>
                          </button>
                          <button
                            onClick={() => {
                              showToast(`Due reminder notice dispatched to ${member.name}.`);
                              setActiveActionDropdown(null);
                            }}
                            className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                          >
                            <Mail className="w-3.5 h-3.5 text-amber-600" />
                            <span>Send Notice</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="py-3 px-5 bg-slate-50/70 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Sample member records - personal records are protected under DPDP standards.</span>
          </div>
          <button
            onClick={() => setPrivacyModalOpen(true)}
            className="hover:text-[#0d7a55] underline underline-offset-2 transition cursor-pointer font-medium"
          >
            Privacy details
          </button>
        </div>
      </div>

      {/* REGISTER MEMBER MODAL */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#e2f6ee] text-[#0d7a55] flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Register New Citizen Member
                  </h3>
                  <p className="text-xs text-slate-500">Enrolment & borrow quota issuance</p>
                </div>
              </div>
              <button
                onClick={() => setRegisterModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterMember} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smt. Gayatri Devi"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@domain.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Phone / Mobile
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98110..."
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Membership Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55] bg-white"
                >
                  <option value="Adult">Adult Citizen (3 titles · 14 days quota)</option>
                  <option value="Student">Student (5 titles · 21 days quota)</option>
                  <option value="Senior">Senior Citizen (5 titles · 30 days · zero fine)</option>
                  <option value="Researcher">Researcher (7 titles · 30 days quota)</option>
                  <option value="Govt Staff">Government Staff (5 titles · 21 days quota)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Residential Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Street, City, Postal Code"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-[#0d7a55] hover:bg-[#0a6344] text-white font-medium shadow-xs cursor-pointer"
                >
                  {submitting ? "Registering..." : "Confirm & Issue Member No."}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIGITAL MEMBER CARD MODAL */}
      {selectedCardMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Digital Citizen Credential
              </span>
              <button
                onClick={() => setSelectedCardMember(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Smart Library Card Visual in Forest Theme */}
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#012f24] via-[#053d2f] to-[#01231a] text-white shadow-xl space-y-4 relative overflow-hidden border border-emerald-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm tracking-wide">Janata Library</h4>
                  <p className="text-[9px] uppercase tracking-widest text-[#7cdcb5]">
                    GPLMS Member Card
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#0d7a55] text-white flex items-center justify-center font-bold text-xs shadow-md">
                  JL
                </div>
              </div>

              <div className="pt-2 space-y-1">
                <div className="text-base font-bold tracking-tight text-white">
                  {selectedCardMember.name}
                </div>
                <div className="text-xs font-mono text-[#7cdcb5]">
                  {selectedCardMember.memberNo}
                </div>
              </div>

              <div className="flex items-end justify-between pt-2 border-t border-emerald-900/80 text-[10px]">
                <div>
                  <span className="text-emerald-300/70 block">Category</span>
                  <span className="font-semibold text-white">{selectedCardMember.category}</span>
                </div>
                <div>
                  <span className="text-emerald-300/70 block">Status</span>
                  <span className="font-semibold text-[#7cdcb5]">{selectedCardMember.status}</span>
                </div>
                <div className="w-9 h-9 bg-white p-1 rounded-lg">
                  <div className="w-full h-full bg-slate-900 rounded-xs flex items-center justify-center text-[7px] text-white font-mono">
                    QR
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Member Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRIVACY DETAILS MODAL */}
      {privacyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <ShieldAlert className="w-4 h-4 text-[#0d7a55]" />
                <span>Privacy & Data Protection Notice</span>
              </div>
              <button
                onClick={() => setPrivacyModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Personal member data in Janata Library Public Library System is managed in
              accordance with the Digital Personal Data Protection (DPDP) Act and Public Records
              standards.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Borrowing history is strictly confidential and is never shared with third parties or
              used for commercial profiling.
            </p>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPrivacyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#0d7a55] text-white font-medium hover:bg-[#0a6344] cursor-pointer"
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
