"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Repeat,
  IndianRupee,
  FileText,
  Sliders,
  HelpCircle,
  Bell,
  ChevronDown,
  X,
  LogOut,
  ExternalLink,
  Plus,
  ArrowLeftRight,
  Menu,
  Check,
} from "lucide-react";
import { StaffProvider, useStaff } from "@/context/StaffContext";

function StaffLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  const {
    previewData,
    setPreviewData,
    branch,
    setBranch,
    transactionModalOpen,
    setTransactionModalOpen,
    staffGuideOpen,
    setStaffGuideOpen,
    notificationsOpen,
    setNotificationsOpen,
    notifications,
    markNotificationsAsRead,
  } = useStaff();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [quickActionMenuOpen, setQuickActionMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // New Transaction Modal State
  const [txType, setTxType] = useState<"issue" | "return" | "payment">("issue");
  const [txMemberNo, setTxMemberNo] = useState("");
  const [txAccessionNo, setTxAccessionNo] = useState("");
  const [txAmount, setTxAmount] = useState("50");
  const [txReason, setTxReason] = useState("Overdue fine");
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const quickActionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (quickActionRef.current && !quickActionRef.current.contains(event.target as Node)) {
        setQuickActionMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setNotificationsOpen]);

  const getPageTitle = () => {
    if (pathname.includes("/staff/overview") || pathname === "/staff") return "Dashboard";
    if (pathname.includes("/staff/circulation")) return "Circulation Desk";
    if (pathname.includes("/staff/finance")) return "Finance & Receipts";
    if (pathname.includes("/staff/catalogue") || pathname.includes("/staff/inventory")) return "Catalogue & Stacks";
    if (pathname.includes("/staff/members")) return "Members Directory";
    if (pathname.includes("/staff/reports")) return "Reports & Audit";
    if (pathname.includes("/staff/administration")) return "Administration";
    return "Circulation Desk";
  };

  const navSections = [
    {
      title: "OPERATIONS",
      items: [
        {
          href: "/staff/overview",
          label: "Dashboard",
          icon: LayoutDashboard,
          active: pathname === "/staff" || pathname.startsWith("/staff/overview"),
        },
        {
          href: "/staff/circulation",
          label: "Circulation Desk",
          icon: ArrowLeftRight,
          badge: "12",
          active: pathname.startsWith("/staff/circulation"),
        },
        {
          href: "/staff/finance",
          label: "Finance & Receipts",
          icon: IndianRupee,
          active: pathname.startsWith("/staff/finance"),
        },
      ],
    },
    {
      title: "MANAGEMENT",
      items: [
        {
          href: "/staff/catalogue",
          label: "Catalogue & Stacks",
          icon: BookOpen,
          active: pathname.startsWith("/staff/catalogue") || pathname.startsWith("/staff/inventory"),
        },
        {
          href: "/staff/members",
          label: "Members Directory",
          icon: Users,
          active: pathname.startsWith("/staff/members"),
        },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        {
          href: "/staff/reports",
          label: "Reports & Audit",
          icon: FileText,
          active: pathname.startsWith("/staff/reports"),
        },
        {
          href: "/staff/administration",
          label: "Administration",
          icon: Sliders,
          active: pathname.startsWith("/staff/administration"),
        },
      ],
    },
  ];

  const handleExecuteTx = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxStatus("Processing transaction...");
    setTimeout(() => {
      setTxStatus(`Success! ${txType.toUpperCase()} recorded successfully.`);
      setTimeout(() => {
        setTxStatus(null);
        setTransactionModalOpen(false);
        setTxMemberNo("");
        setTxAccessionNo("");
      }, 1000);
    }, 500);
  };

  const demoRoles = [
    { role: "MEMBER", label: "Citizen", path: "/" },
    { role: "LIBRARIAN", label: "Librarian", path: "/staff/circulation" },
    { role: "ACCOUNTS_OPERATOR", label: "Accounts", path: "/staff/finance" },
    { role: "SUPER_ADMIN", label: "Admin", path: "/staff/administration" },
  ];

  const handleRoleSwitch = async (role: string, path: string) => {
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setProfileMenuOpen(false);
    if (path === "/") {
      router.push("/");
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8faf9] text-slate-800 antialiased font-sans">
      {/* 1. SLIM / THIN DARK FOREST GREEN NAVIGATION PANEL (Image 1 Style) */}
      <aside
        className={`w-full md:w-[70px] bg-[#012f24] text-white shrink-0 flex flex-col items-center justify-between border-r border-[#033c2e] z-40 relative transition-all ${
          mobileSidebarOpen ? "fixed inset-y-0 left-0 w-64 shadow-2xl z-50 md:static md:w-[70px]" : "hidden md:flex"
        }`}
      >
        {/* Subtle Organic Leaf Watermark at bottom */}
        <div className="absolute bottom-0 left-0 w-full pointer-events-none opacity-25 overflow-hidden select-none">
          <svg
            className="w-full h-48 text-emerald-400 fill-none stroke-current stroke-[1.2]"
            viewBox="0 0 70 160"
            preserveAspectRatio="none"
          >
            <path d="M-10,160 C15,120 30,70 55,95 C65,120 70,50 80,20" />
            <path d="M-5,180 C20,140 35,90 60,115 C70,140 75,70 85,40" />
            <path d="M0,150 C20,100 45,80 70,130" />
          </svg>
        </div>

        {/* Top: Brand Logo */}
        <div className="w-full flex flex-col items-center pt-4 pb-2 px-2 space-y-4 relative z-10">
          {/* Logo with Tooltip */}
          <div className="relative group">
            <Link
              href="/staff/overview"
              className="w-11 h-11 rounded-2xl bg-[#0e8f62] text-white flex items-center justify-center shadow-md hover:bg-[#0c7a54] transition cursor-pointer"
            >
              <BookOpen className="w-6 h-6 text-white" />
            </Link>

            {/* Tooltip on Hover */}
            <div className="hidden md:flex absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 items-center gap-1.5 border border-slate-800">
              <span className="font-bold text-white">District Library</span>
              <span className="text-[10px] text-[#7cdcb5] uppercase tracking-wider">Admin Portal</span>
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
            </div>
          </div>

          {/* Section Divider */}
          <div className="w-8 h-[1px] bg-white/10 my-1" />

          {/* Nav Icons */}
          <nav className="w-full flex flex-col items-center space-y-2">
            {navSections.map((section, sIdx) => (
              <div key={section.title} className="w-full flex flex-col items-center space-y-2">
                {sIdx > 0 && <div className="w-8 h-[1px] bg-white/10 my-1.5" />}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.href} className="relative group">
                      <Link
                        href={item.href}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative ${
                          item.active
                            ? "bg-[#0e7552] text-white font-semibold shadow-md ring-1 ring-white/10"
                            : "text-white/80 hover:text-white hover:bg-white/10"
                        }`}
                        aria-label={item.label}
                      >
                        <Icon className="w-5 h-5 text-white" />

                        {/* Badge notification dot */}
                        {item.badge && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#10b981] ring-2 ring-[#012f24]" />
                        )}
                      </Link>

                      {/* Tooltip on Hover */}
                      <div className="hidden md:flex absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 items-center gap-2 border border-slate-800">
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 bg-[#0e8f62] text-white text-[10px] rounded-full font-bold">
                            {item.badge}
                          </span>
                        )}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom: Profile Avatar Logo (Image 1 Style: Dark Circle with "N") */}
        <div className="w-full flex flex-col items-center pb-4 pt-2 px-2 relative z-10" ref={profileRef}>
          <div className="w-8 h-[1px] bg-white/10 mb-3" />

          <div className="relative group">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="w-10 h-10 rounded-full bg-[#182126] text-white font-bold text-sm flex items-center justify-center shadow-md hover:ring-2 hover:ring-emerald-400/60 transition cursor-pointer border border-white/20"
              title="Console Options & Profile"
            >
              N
            </button>

            {/* Profile Tooltip on Hover */}
            <div className="hidden md:flex absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 items-center gap-1.5 border border-slate-800">
              <span className="font-bold text-white">{currentUser?.name || "Manoj Agarwal"}</span>
              <span className="text-[10px] text-[#7cdcb5]">· Console & Roles</span>
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
            </div>
          </div>

          {/* Profile & Console Dropdown Popover */}
          {profileMenuOpen && (
            <div className="absolute left-full bottom-2 ml-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl py-3 z-50 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-150">
              {/* 1. Official Console Status Banner */}
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 rounded-t-2xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="font-bold text-slate-800 text-xs">
                    District Public Library
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium pl-4">
                  Staff Administration Console
                </p>
                <p className="text-[10px] text-slate-400 font-mono pl-4">
                  National Digital Library Node
                </p>
              </div>

              {/* 2. User Info */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#182126] text-white font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700/60 shadow-xs">
                  N
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-xs truncate">
                    {currentUser?.name || "Manoj Agarwal"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {currentUser?.email || "manoj.agarwal@library.gov.in"}
                  </p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e2f6ee] text-[#0d7a55]">
                    {currentUser?.role === "SUPER_ADMIN"
                      ? "Super Admin"
                      : currentUser?.role === "ACCOUNTS_OPERATOR"
                      ? "Accounts Operator"
                      : currentUser?.role === "MEMBER"
                      ? "Citizen Member"
                      : "Library Administrator"}
                  </span>
                </div>
              </div>

              {/* 3. Demo Role Switcher */}
              <div className="px-4 py-3 border-b border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Demo Role Switcher
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Quick switch</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {demoRoles.map((item) => {
                    const active = currentUser?.role === item.role || (item.role === "LIBRARIAN" && !currentUser?.role);
                    return (
                      <button
                        key={item.role}
                        onClick={() => handleRoleSwitch(item.role, item.path)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                          active
                            ? "bg-[#0d7a55] text-white shadow-xs font-semibold"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span>{item.label}</span>
                        {active && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Quick Actions & Portal Links */}
              <div className="py-1 border-b border-slate-100">
                <Link
                  href="/"
                  onClick={() => setProfileMenuOpen(false)}
                  className="w-full flex items-center justify-between px-4 py-2 text-slate-700 hover:bg-slate-50 transition font-medium"
                >
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-[#0d7a55]" />
                    <span>Public OPAC Portal</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Citizen View ↗</span>
                </Link>

                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setStaffGuideOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer font-medium"
                >
                  <HelpCircle className="w-4 h-4 text-[#0d7a55]" />
                  <span>Staff SOPs & Operation Guide</span>
                </button>

                <button
                  onClick={() => setPreviewData(!previewData)}
                  className="w-full flex items-center justify-between px-4 py-2 text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer font-medium"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${previewData ? "bg-amber-500" : "bg-slate-300"}`} />
                    <span>Demo Mode Data</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${previewData ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"}`}>
                    {previewData ? "Active" : "Off"}
                  </span>
                </button>
              </div>

              {/* 5. Sign Out */}
              <div className="pt-1.5 px-2">
                <button
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    router.push("/login");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition text-left cursor-pointer font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out of Console</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        {/* Clean Breadcrumbs & Utility Actions Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Breadcrumb Left */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
              title="Toggle Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-slate-400 font-normal">Portal</span>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-900 font-semibold">{getPageTitle()}</span>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
            {/* Quick Action Pill Button with Dropdown */}
            <div className="relative" ref={quickActionRef}>
              <button
                onClick={() => setQuickActionMenuOpen(!quickActionMenuOpen)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0d7a55] hover:bg-[#0a6344] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Quick Action</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {quickActionMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs">
                  <button
                    onClick={() => {
                      setTxType("issue");
                      setQuickActionMenuOpen(false);
                      setTransactionModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#0d7a55]" />
                    <span>Issue Book</span>
                  </button>
                  <button
                    onClick={() => {
                      setTxType("return");
                      setQuickActionMenuOpen(false);
                      setTransactionModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
                  >
                    <Repeat className="w-3.5 h-3.5 text-blue-600" />
                    <span>Process Return</span>
                  </button>
                  <button
                    onClick={() => {
                      setTxType("payment");
                      setQuickActionMenuOpen(false);
                      setTransactionModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
                  >
                    <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
                    <span>Collect Fine / Fee</span>
                  </button>
                </div>
              )}
            </div>



            <Link
              href="/"
              className="text-xs text-slate-600 hover:text-[#0d7a55] font-medium hidden sm:flex items-center gap-1 transition"
              title="Return to Public OPAC"
            >
              <span>Public OPAC</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 p-5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* 3. QUICK TRANSACTION MODAL */}
      {transactionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0d7a55] flex items-center justify-center">
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Fast Circulation Desk</h3>
                  <p className="text-[11px] text-slate-500">Quick issue, return or fee collection</p>
                </div>
              </div>
              <button
                onClick={() => setTransactionModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Transaction Type Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-0.5 text-xs font-medium">
              <button
                onClick={() => setTxType("issue")}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  txType === "issue" ? "bg-white text-[#0d7a55] shadow-xs font-semibold" : "text-slate-500"
                }`}
              >
                Issue Book
              </button>
              <button
                onClick={() => setTxType("return")}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  txType === "return" ? "bg-white text-[#0d7a55] shadow-xs font-semibold" : "text-slate-500"
                }`}
              >
                Return Book
              </button>
              <button
                onClick={() => setTxType("payment")}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  txType === "payment" ? "bg-white text-[#0d7a55] shadow-xs font-semibold" : "text-slate-500"
                }`}
              >
                Record Fee
              </button>
            </div>

            <form onSubmit={handleExecuteTx} className="space-y-3 text-xs">
              {txType !== "return" && (
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Member Number (MBR-XXXX-XXXX)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MBR-2024-0185"
                    value={txMemberNo}
                    onChange={(e) => setTxMemberNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                  />
                </div>
              )}

              {txType !== "payment" && (
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Accession No. or Barcode
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ACC-2024-0043"
                    value={txAccessionNo}
                    onChange={(e) => setTxAccessionNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                  />
                </div>
              )}

              {txType === "payment" && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Receipt Type</label>
                    <select
                      value={txReason}
                      onChange={(e) => setTxReason(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55] bg-white"
                    >
                      <option>Overdue fine</option>
                      <option>Membership renewal</option>
                      <option>Lost book recovery</option>
                    </select>
                  </div>
                </div>
              )}

              {txStatus && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#0d7a55] text-xs font-medium">
                  {txStatus}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransactionModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#0d7a55] hover:bg-[#0a6344] text-white font-medium shadow-xs cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. STAFF GUIDE MODAL */}
      {staffGuideOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-5 space-y-3.5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0d7a55] flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Staff Operations Guide & SOPs
                  </h3>
                  <p className="text-[11px] text-slate-500">Circulation rules and reference codes</p>
                </div>
              </div>
              <button
                onClick={() => setStaffGuideOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <h4 className="font-semibold text-slate-900 text-xs">1. Loan & Circulation Limits</h4>
                <p>• General Citizen quota: 3 titles for 14 days.</p>
                <p>• Students: 5 titles for 21 days; Researchers: 7 titles for 30 days.</p>
                <p>• Overdue fine: ₹2 per calendar day after grace period.</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <h4 className="font-semibold text-slate-900 text-xs">2. Cash Receipts & Auditing</h4>
                <p>• Every fine or fee payment generates a unique receipt (RCP-YYYYMM-XXXX).</p>
                <p>• Reversals require approving officer authorization.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setStaffGuideOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#0d7a55] text-white font-medium hover:bg-[#0a6344] text-xs cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffProvider>
      <StaffLayoutInner>{children}</StaffLayoutInner>
    </StaffProvider>
  );
}
