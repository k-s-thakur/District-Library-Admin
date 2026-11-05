"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  BookOpen,
  Plus,
  ArrowUpDown,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  Download,
  Upload,
  CheckCircle2,
  X,
  Printer,
  QrCode,
  Tag,
  Layers,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { useStaff } from "@/context/StaffContext";

interface CatalogueItem {
  id: string;
  title: string;
  author: string;
  accessionNo: string;
  category: string;
  shelfDdc: string;
  status: "Available" | "Issued" | "On hold" | "Under repair";
  isbn?: string;
  copiesCount?: number;
  year?: number;
}

const sampleCatalogue: CatalogueItem[] = [
  {
    id: "cat-1",
    title: "The Discovery of India",
    author: "Jawaharlal Nehru",
    accessionNo: "ACC-2024-0043",
    category: "History",
    shelfDdc: "HIS - 954 NEH",
    status: "Issued",
    isbn: "978-0195623598",
    copiesCount: 4,
    year: 1946,
  },
  {
    id: "cat-2",
    title: "Wings of Fire",
    author: "A. P. J. Abdul Kalam",
    accessionNo: "ACC-2023-0318",
    category: "Biography",
    shelfDdc: "BIO - 954 KAL",
    status: "Available",
    isbn: "978-8173711466",
    copiesCount: 6,
    year: 1999,
  },
  {
    id: "cat-3",
    title: "The God of Small Things",
    author: "Arundhati Roy",
    accessionNo: "ACC-2025-0207",
    category: "Fiction",
    shelfDdc: "FIC - ROY",
    status: "Available",
    isbn: "978-0679457312",
    copiesCount: 3,
    year: 1997,
  },
  {
    id: "cat-4",
    title: "India After Gandhi",
    author: "Ramachandra Guha",
    accessionNo: "ACC-2022-0051",
    category: "History",
    shelfDdc: "HIS - 954 GUH",
    status: "On hold",
    isbn: "978-0330505543",
    copiesCount: 5,
    year: 2007,
  },
  {
    id: "cat-5",
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    accessionNo: "ACC-2024-0913",
    category: "Science",
    shelfDdc: "SCI - 523 HAW",
    status: "Issued",
    isbn: "978-0553380163",
    copiesCount: 4,
    year: 1988,
  },
  {
    id: "cat-6",
    title: "Train to Pakistan",
    author: "Khushwant Singh",
    accessionNo: "ACC-2024-0412",
    category: "Fiction",
    shelfDdc: "FIC - SIN",
    status: "Available",
    isbn: "978-0143065883",
    copiesCount: 3,
    year: 1956,
  },
  {
    id: "cat-7",
    title: "The Argumentative Indian",
    author: "Amartya Sen",
    accessionNo: "ACC-2023-0899",
    category: "Philosophy",
    shelfDdc: "PHI - 181 SEN",
    status: "Available",
    isbn: "978-0141012117",
    copiesCount: 2,
    year: 2005,
  },
];

export default function StaffCataloguePage() {
  const { previewData } = useStaff();
  const [items, setItems] = useState<CatalogueItem[]>(sampleCatalogue);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Modals state
  const [addBookModalOpen, setAddBookModalOpen] = useState(false);
  const [importExportModalOpen, setImportExportModalOpen] = useState(false);
  const [selectedSpineLabel, setSelectedSpineLabel] = useState<CatalogueItem | null>(null);
  const [selectedQrLabel, setSelectedQrLabel] = useState<CatalogueItem | null>(null);
  const [activeActionDropdown, setActiveActionDropdown] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Book Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newIsbn, setNewIsbn] = useState("");
  const [newCategory, setNewCategory] = useState("Fiction");
  const [newDdc, setNewDdc] = useState("823");
  const [newCutter, setNewCutter] = useState("");
  const [newShelf, setNewShelf] = useState("Aisle 3, Rack B, Shelf 2");
  const [newCopies, setNewCopies] = useState(3);
  const [newEdition, setNewEdition] = useState("1st Edition");
  const [newPubYear, setNewPubYear] = useState("2026");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.accessionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.shelfDdc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === "All" || item.category === categoryFilter;
      const matchStat = statusFilter === "All" || item.status === statusFilter;
      return matchSearch && matchCat && matchStat;
    });
  }, [items, searchQuery, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const generatedAcc = `ACC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const shelfCode = `${newCategory.slice(0, 3).toUpperCase()} - ${newDdc} ${newAuthor.slice(0, 3).toUpperCase()}`;

    const newItem: CatalogueItem = {
      id: `cat-${Date.now()}`,
      title: newTitle.trim(),
      author: newAuthor.trim(),
      accessionNo: generatedAcc,
      category: newCategory,
      shelfDdc: shelfCode,
      status: "Available",
      copiesCount: Number(newCopies),
      year: Number(newPubYear) || 2026,
      isbn: newIsbn || "978-81-000000-0",
    };

    setItems((prev) => [newItem, ...prev]);
    setIsSubmitting(false);
    setAddBookModalOpen(false);
    setNewTitle("");
    setNewAuthor("");
    setNewIsbn("");
    showToast(`Accessioned "${newItem.title}" with code ${newItem.accessionNo}`);
  };

  const handleExportCSV = () => {
    const headers = ["Title", "Author", "Accession No", "Category", "Shelf / DDC", "Status"];
    const rows = filteredItems.map((b) => [
      `"${b.title}"`,
      `"${b.author}"`,
      b.accessionNo,
      b.category,
      `"${b.shelfDdc}"`,
      b.status,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Janata_Library_Catalogue_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Catalogue exported successfully.");
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0d7a55] text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs flex items-center gap-2 border border-emerald-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#e2f6ee] text-[#0d7a55] flex items-center justify-center shrink-0 shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Catalogue & Stacks
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Holdings, titles, Dewey Decimal Classification and accession tags.
            </p>
          </div>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setImportExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Import / Export</span>
          </button>

          <button
            onClick={() => setAddBookModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0d7a55] hover:bg-[#0a6344] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Book</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#e6f7f0] text-[#0d7a55] flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">8,426</div>
            <div className="text-xs text-slate-500 mt-0.5">Total Titles</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#e8f2fe] text-[#2563eb] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">12,680</div>
            <div className="text-xs text-slate-500 mt-0.5">Physical Copies</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#e6f7f0] text-[#0d7a55] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#0d7a55] tabular-nums leading-tight">7,354</div>
            <div className="text-xs text-slate-500 mt-0.5">Available on Shelves</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#f0edfb] text-[#7c3aed] flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">24</div>
            <div className="text-xs text-slate-500 mt-0.5">Recently Added</div>
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search title, author, accession no..."
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

          {filtersOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-40 text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">Filter Catalogue</span>
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
                  <option value="Fiction">Fiction</option>
                  <option value="History">History</option>
                  <option value="Biography">Biography</option>
                  <option value="Science">Science</option>
                  <option value="Philosophy">Philosophy</option>
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
                  <option value="Available">Available</option>
                  <option value="Issued">Issued</option>
                  <option value="On hold">On hold</option>
                  <option value="Under repair">Under repair</option>
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

      {/* 4. Catalogue Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] tracking-widest uppercase font-bold text-[#0d7a55]">
              STACKS REPOSITORY
            </p>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Accessioned Holdings
            </h3>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-3 py-1 rounded-full self-start sm:self-auto">
            Showing {paginatedItems.length} of {filteredItems.length} titles
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f2f7f4] border-b border-slate-200/80 text-[11px] font-bold text-[#536b60] uppercase tracking-wider">
                <th className="py-3 px-5">TITLE & AUTHOR</th>
                <th className="py-3 px-5">ACCESSION NO.</th>
                <th className="py-3 px-5">CATEGORY</th>
                <th className="py-3 px-5">SHELF / DDC</th>
                <th className="py-3 px-5">STATUS</th>
                <th className="py-3 px-5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedItems.map((book) => (
                <tr key={book.id} className="hover:bg-slate-50/80 transition group">
                  <td className="py-3.5 px-5">
                    <div className="font-semibold text-slate-900 leading-tight">
                      {book.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      by {book.author}
                    </div>
                  </td>

                  <td className="py-3.5 px-5 font-mono text-slate-600 text-xs">
                    {book.accessionNo}
                  </td>

                  <td className="py-3.5 px-5 text-slate-700">
                    {book.category}
                  </td>

                  <td className="py-3.5 px-5 font-mono text-slate-600 text-xs">
                    {book.shelfDdc}
                  </td>

                  <td className="py-3.5 px-5">
                    {book.status === "Available" ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#e2f6ee] text-[#0d7a55] border border-emerald-200">
                        Available
                      </span>
                    ) : book.status === "Issued" ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#e0f2fe] text-[#0369a1] border border-sky-200">
                        Issued
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fef3c7] text-[#b45309] border border-amber-200">
                        {book.status}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-5 text-right relative">
                    <button
                      onClick={() =>
                        setActiveActionDropdown(
                          activeActionDropdown === book.id ? null : book.id
                        )
                      }
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {activeActionDropdown === book.id && (
                      <div className="absolute right-5 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 text-left text-xs">
                        <button
                          onClick={() => {
                            setSelectedSpineLabel(book);
                            setActiveActionDropdown(null);
                          }}
                          className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <Tag className="w-3.5 h-3.5 text-[#0d7a55]" />
                          <span>Print Spine Label</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedQrLabel(book);
                            setActiveActionDropdown(null);
                          }}
                          className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <QrCode className="w-3.5 h-3.5 text-blue-600" />
                          <span>Print Barcode Label</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="py-3 px-5 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ADD BOOK MODAL */}
      {addBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">
                Add New Book to Stacks
              </span>
              <button onClick={() => setAddBookModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBook} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discovery of India"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Primary Author *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jawaharlal Nehru"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    ISBN Code
                  </label>
                  <input
                    type="text"
                    placeholder="978-0195623598"
                    value={newIsbn}
                    onChange={(e) => setNewIsbn(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55] bg-white"
                  >
                    <option>Fiction</option>
                    <option>History</option>
                    <option>Biography</option>
                    <option>Science</option>
                    <option>Philosophy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Dewey Decimal Class
                  </label>
                  <input
                    type="text"
                    placeholder="954"
                    value={newDdc}
                    onChange={(e) => setNewDdc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Number of Copies
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newCopies}
                    onChange={(e) => setNewCopies(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddBookModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#0d7a55] hover:bg-[#0a6344] text-white font-medium cursor-pointer"
                >
                  {isSubmitting ? "Accessioning..." : "Accession to Catalogue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT / EXPORT MODAL */}
      {importExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">
                Import & Export Catalogue
              </span>
              <button
                onClick={() => setImportExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  handleExportCSV();
                  setImportExportModalOpen(false);
                }}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-[#0d7a55] flex items-center gap-3 text-left transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#0d7a55]" />
                <div>
                  <p className="font-semibold text-slate-900">Download CSV Export</p>
                  <p className="text-[11px] text-slate-500">All titles with Dewey numbers</p>
                </div>
              </button>

              <button
                onClick={() => {
                  showToast("Batch MARC21 importer ready.");
                  setImportExportModalOpen(false);
                }}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-600 flex items-center gap-3 text-left transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="font-semibold text-slate-900">Import MARC21 / CSV</p>
                  <p className="text-[11px] text-slate-500">Bulk accession intake</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SPINE LABEL MODAL */}
      {selectedSpineLabel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xs w-full p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900">Spine Label Voucher</span>
              <button onClick={() => setSelectedSpineLabel(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center font-mono space-y-1">
              <div className="text-[10px] text-slate-400 uppercase">District Library</div>
              <div className="text-sm font-bold text-slate-900">{selectedSpineLabel.shelfDdc}</div>
              <div className="text-xs text-slate-600">{selectedSpineLabel.accessionNo}</div>
              <div className="text-[9px] text-slate-400">Copy #1 of {selectedSpineLabel.copiesCount}</div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2 bg-[#0d7a55] hover:bg-[#0a6344] text-white rounded-full font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Label</span>
            </button>
          </div>
        </div>
      )}

      {/* QR BARCODE MODAL */}
      {selectedQrLabel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xs w-full p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900">Accession Barcode</span>
              <button onClick={() => setSelectedQrLabel(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl bg-white text-center space-y-2">
              <div className="w-20 h-20 mx-auto bg-slate-900 text-white rounded-lg flex items-center justify-center font-mono text-[9px] p-2">
                [QR CODE TOKEN]
              </div>
              <div className="font-mono font-bold text-sm text-slate-900">{selectedQrLabel.accessionNo}</div>
              <div className="text-[11px] text-slate-500 truncate">{selectedQrLabel.title}</div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2 bg-[#0d7a55] hover:bg-[#0a6344] text-white rounded-full font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Barcode</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
