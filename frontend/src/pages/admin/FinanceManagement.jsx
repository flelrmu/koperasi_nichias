import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Plus,
  FileText,
  PieChart,
  ArrowRightLeft,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Tags,
  User,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Printer,
  Settings2,
  Edit2,
  Trash2,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import Button from "../../components/atoms/Button";
import StatusBadge from "../../components/atoms/StatusBadge";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import NeracaInlineTab from "./NeracaInlineTab";
import SHUTab from "./SHUTab";
import moment from "moment";

const formatNumber = (num) => {
  if (!num) return "";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseNumber = (str) => {
  if (!str) return "";
  return str.toString().replace(/\./g, "");
};

export default function FinanceManagement() {
  const { api, user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("arus-kas");
  const [exportTrigger, setExportTrigger] = useState(0);
  const isBendahara = user?.role === "Bendahara";

  // Helper for current date
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const currentYear = String(now.getFullYear());

  // --- Arus Kas State ---
  const [arusKasData, setArusKasData] = useState([]);
  const [loadingKas, setLoadingKas] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [bulan, setBulan] = useState(currentMonth);
  const [tahun, setTahun] = useState(currentYear);
  const [showModalKas, setShowModalKas] = useState(false);
  const [currentKasBalance, setCurrentKasBalance] = useState(0);
  const [isClosed, setIsClosed] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [filterKategori, setFilterKategori] = useState("all");
  const itemsPerPage = 10;

  // --- Kategori State ---
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [realtimeSaldo, setRealtimeSaldo] = useState({ CASH: 0, BANK: 0 });
  const [formDataKas, setFormDataKas] = useState({
    user_id: "",
    nama_kategori: "",
    nominal: "",
    keterangan: "",
    jenis: "",
    metode_pembayaran: "CASH",
  });

  // --- Category Modal State ---
  const [showModalCat, setShowModalCat] = useState(false);
  const [editCatData, setEditCatData] = useState(null);
  const [formDataCat, setFormDataCat] = useState({
    nama_kategori: "",
    jenis: "Debit",
    saldo_awal: "",
  });
  const [showConfirmDelete, setShowConfirmDelete] = useState({
    isOpen: false,
    id: null,
    name: "",
    type: "category",
  });

  // --- Edit Kas State ---
  const [editKasData, setEditKasData] = useState(null);

  // --- Adjust Saldo State ---
  const [showModalAdjust, setShowModalAdjust] = useState(false);
  const [formDataAdjust, setFormDataAdjust] = useState({
    saldo_cash: "",
    saldo_bank: "",
  });
  const [isAdjusting, setIsAdjusting] = useState(false);

  const fetchPeriodeStatus = useCallback(async () => {
    try {
      const res = await api.get(
        `/keuangan/periode-status?bulan=${bulan}&tahun=${tahun}`,
      );
      if (res.data.success) {
        setIsClosed(res.data.is_closed);
      }
    } catch (error) {
      console.error("Error fetching periode status:", error);
    }
  }, [api, bulan, tahun]);

  const fetchArusKas = useCallback(async () => {
    setLoadingKas(true);
    try {
      const res = await api.get(
        `/keuangan/arus-kas?bulan=${bulan}&tahun=${tahun}`,
      );
      if (res.data.success) {
        setArusKasData(res.data.data);
        if (res.data.currentBalance !== undefined) {
          setCurrentKasBalance(res.data.currentBalance);
        }
      }
    } catch (error) {
      console.error("Error fetching arus kas:", error);
    } finally {
      setLoadingKas(false);
    }
  }, [api, bulan, tahun]);

  const fetchSetupData = useCallback(async () => {
    try {
      const [catRes, userRes, saldoRes] = await Promise.all([
        api.get("/keuangan/kategori"),
        api.get("/user/anggota"),
        api.get(`/keuangan/saldo-kas?bulan=${bulan}&tahun=${tahun}`),
      ]);
      setCategories(catRes.data.data);
      setUsers(userRes.data.data || []);
      if (saldoRes.data.success) {
        setRealtimeSaldo(saldoRes.data.data);
        const total =
          (saldoRes.data.data.CASH || 0) + (saldoRes.data.data.BANK || 0);
        setCurrentKasBalance(total);
      }
    } catch (error) {
      console.error("Error fetching setup data:", error);
    }
  }, [api, bulan, tahun]);

  useEffect(() => {
    setCurrentPage(1);
  }, [bulan, tahun, searchTerm, filterKategori]);

  useEffect(() => {
    if (activeTab === "arus-kas" || activeTab === "neraca") {
      fetchArusKas();
      fetchSetupData();
      fetchPeriodeStatus();
    }

    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
    );
    socket.on("arus-kas-updated", () => {
      fetchArusKas();
      fetchSetupData();
    });
    return () => socket.disconnect();
  }, [activeTab, fetchArusKas, fetchSetupData]);

  const handleCategoryChange = (catName) => {
    const cat = categories.find((c) => c.nama_kategori === catName);
    setFormDataKas({
      ...formDataKas,
      nama_kategori: catName,
      jenis: cat ? cat.jenis : "",
    });
  };

  const handleSubmitKas = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editKasData) {
        res = await api.put(
          `/keuangan/arus-kas/${editKasData.kas_id}`,
          formDataKas,
        );
      } else {
        res = await api.post("/keuangan/arus-kas", formDataKas);
      }

      if (res.data.success) {
        setShowModalKas(false);
        setEditKasData(null);
        setFormDataKas({
          user_id: "",
          nama_kategori: "",
          nominal: "",
          keterangan: "",
          jenis: "",
        });
        fetchArusKas();
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Gagal menyimpan transaksi",
        "error",
      );
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editCatData) {
        await api.put(
          `/keuangan/kategori/${editCatData.kategori_id}`,
          formDataCat,
        );
      } else {
        await api.post("/keuangan/kategori", formDataCat);
      }
      setShowModalCat(false);
      setEditCatData(null);
      setFormDataCat({ nama_kategori: "", jenis: "Debit", saldo_awal: "" });
      fetchSetupData();
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Terjadi kesalahan",
        "error",
      );
    }
  };

  const deleteCategory = async () => {
    try {
      await api.delete(`/keuangan/kategori/${showConfirmDelete.id}`);
      setShowConfirmDelete({
        isOpen: false,
        id: null,
        name: "",
        type: "category",
      });
      fetchSetupData();
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Gagal menghapus",
        "error",
      );
    }
  };

  const deleteArusKas = async () => {
    try {
      await api.delete(`/keuangan/arus-kas/${showConfirmDelete.id}`);
      setShowConfirmDelete({
        isOpen: false,
        id: null,
        name: "",
        type: "category",
      });
      fetchArusKas();
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Gagal menghapus arus kas",
        "error",
      );
    }
  };

  const handleTutupBuku = async () => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin melakukan TUTUP BUKU untuk periode ${bulan}/${tahun}? Setelah ditutup, transaksi di bulan ini TIDAK DAPAT diubah lagi.`,
      )
    )
      return;

    setIsClosing(true);
    try {
      const res = await api.post("/keuangan/tutup-buku", { bulan, tahun });
      if (res.data.success) {
        showNotification(res.data.message, "success");
        fetchPeriodeStatus();
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Gagal tutup buku",
        "error",
      );
    } finally {
      setIsClosing(false);
    }
  };

  const handleAddKas = () => {
    setEditKasData(null);
    setFormDataKas({
      user_id: "",
      nama_kategori: "",
      nominal: "",
      keterangan: "",
      jenis: "Debit",
      metode_pembayaran: "CASH",
    });
    setShowModalKas(true);
  };

  const handleDeleteConfirm = () => {
    if (showConfirmDelete.type === "kas") {
      deleteArusKas();
    } else {
      deleteCategory();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const tabs = [
    { id: "arus-kas", label: "Arus Kas", icon: ArrowRightLeft },
    { id: "neraca", label: "Neraca", icon: FileText },
    { id: "shu", label: "SHU", icon: PieChart },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  const uniqueCategories = Array.from(
    new Set(
      arusKasData
        .map((item) => item.kategoriKas?.nama_kategori)
        .filter(Boolean),
    ),
  ).sort();

  const filteredKas = arusKasData.filter((item) => {
    const matchesSearch =
      item.keterangan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kode_transaksi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user?.anggota?.nama_lengkap
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesKategori =
      filterKategori === "all" ||
      item.kategoriKas?.nama_kategori === filterKategori;

    return matchesSearch && matchesKategori;
  });

  const totalPages = Math.ceil(filteredKas.length / itemsPerPage);
  const paginatedKas = filteredKas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Premium Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-blue-900/5 relative overflow-hidden">
        {/* Decorative background blurs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#DFEAF4] rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#004A9C]/5 rounded-full -ml-24 -mb-24 opacity-40 blur-3xl"></div>
        
        <div className="space-y-3 relative z-10">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#DFEAF4] text-[#004A9C] rounded-full text-xs font-bold uppercase tracking-widest"
          >
            <TrendingUp size={14} />
            <span>Keuangan</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Manajemen <span className="text-[#004A9C]">Keuangan</span></h2>
          <p className="text-gray-500 text-lg font-medium">
            {isBendahara
              ? "Kelola arus kas, kategori, dan pantau laporan keuangan real-time."
              : "Pantau laporan keuangan dan posisi neraca koperasi."}
          </p>
        </div>
        
        <div className="relative z-10 shrink-0 flex flex-wrap gap-3 items-center w-full md:w-auto">
          {activeTab === "arus-kas" && isBendahara && (
            <Button
              onClick={handleAddKas}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl shadow-lg shadow-[#004A9C]/20 hover:scale-105 transition-all bg-[#004A9C] text-white"
              disabled={isClosed}
            >
              <Plus size={22} />
              <span className="font-bold text-lg">Update Kas</span>
            </Button>
          )}
          {activeTab === "neraca" && (
            <Button 
              onClick={() => {
                setExportTrigger(prev => prev + 1);
              }}
              className="bg-[#DFEAF4] !text-[#004A9C] border border-[#004A9C]/20 flex items-center gap-2 px-8 py-4 rounded-2xl hover:bg-[#d0e1f0] hover:scale-105 transition-all font-bold text-lg"
            >
              <Download size={22} />
              <span>Export Laporan</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto gap-1 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#004A9C] text-white shadow-lg shadow-blue-900/10"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Icon
                size={18}
                className={isActive ? "text-white" : "text-gray-400"}
              />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
          className="min-h-[500px]"
        >
          {activeTab === "arus-kas" && (
            <div className="space-y-6">
              {/* Real-time Balance Card */}
              <div className="bg-gradient-to-br from-[#004A9C] to-[#003B7D] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex items-center justify-between">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-400 opacity-10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <Wallet size={28} className="text-white" />
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm font-medium mb-1">
                      Saldo Kas Saat Ini
                    </p>
                    <h2 className="text-3xl font-black tracking-tight">
                      {formatCurrency(currentKasBalance)}
                    </h2>
                  </div>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                  {isBendahara && (
                    <button
                      onClick={() => {
                        // Hitung saldo awal bulan ini (Saldo Saat Ini - Mutasi Bulan Ini)
                        const getSaldoAwalBulan = (metode) => {
                          const mutasiBulanIni = arusKasData
                            .filter((item) => item.metode_pembayaran === metode)
                            .reduce((acc, item) => {
                              return item.jenis === "Debit"
                                ? acc + parseFloat(item.nominal)
                                : acc - parseFloat(item.nominal);
                            }, 0);
                          return (realtimeSaldo[metode] || 0) - mutasiBulanIni;
                        };

                        setFormDataAdjust({
                          saldo_cash: getSaldoAwalBulan("CASH"),
                          saldo_bank: getSaldoAwalBulan("BANK"),
                          bulan: bulan,
                          tahun: tahun,
                        });
                        setShowModalAdjust(true);
                      }}
                      disabled={isClosed}
                      className={`flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 transition-all group ${isClosed ? "opacity-50 cursor-not-allowed" : "hover:bg-white/20"}`}
                    >
                      <Settings2
                        size={16}
                        className={`text-blue-100 transition-transform duration-500 ${!isClosed && "group-hover:rotate-90"}`}
                      />
                      <span className="text-xs font-bold text-white">
                        Penyesuaian Saldo Awal
                      </span>
                    </button>
                  )}
                  <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                    <div
                      className={`w-2 h-2 rounded-full animate-pulse ${isClosed ? "bg-red-400" : "bg-green-400"}`}
                    ></div>
                    <span className="text-xs font-bold tracking-widest uppercase text-blue-50">
                      {isClosed ? "Periode Terkunci" : "Live Sync"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Cari transaksi..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#004A9C]/20 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <select
                    className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none"
                    value={bulan}
                    onChange={(e) => setBulan(e.target.value)}
                  >
                    {months.map((m, i) => (
                      <option key={i} value={String(i + 1).padStart(2, "0")}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none"
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
                  >
                    {Array.from(
                      { length: now.getFullYear() - 2024 + 2 },
                      (_, i) => 2024 + i,
                    )
                      .reverse()
                      .map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                  </select>
                  <select
                    className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none min-w-[140px]"
                    value={filterKategori}
                    onChange={(e) => setFilterKategori(e.target.value)}
                  >
                    <option value="all">Semua Kategori</option>
                    {uniqueCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  {isClosed && (
                    <div className="px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold">
                      <AlertCircle size={16} /> TERKUNCI
                    </div>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#F8FAFC]">
                      <tr>
                        <th className="py-5 px-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Tanggal
                        </th>
                        <th className="py-5 px-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Kode & Kategori
                        </th>
                        <th className="py-5 px-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Keterangan
                        </th>
                        <th className="py-5 px-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Jenis
                        </th>
                        <th className="py-5 px-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                          Nominal
                        </th>
                        <th className="py-5 px-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                          Saldo Akhir
                        </th>
                        <th className="py-5 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                          Metode
                        </th>
                        <th className="py-5 px-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                          Manajemen
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {loadingKas ? (
                        Array(5)
                          .fill(0)
                          .map((_, i) => (
                            <tr key={i}>
                              <td colSpan="7" className="py-5 px-8 text-center">
                                Loading...
                              </td>
                            </tr>
                          ))
                      ) : paginatedKas.length === 0 ? (
                        <tr>
                          <td
                            colSpan="7"
                            className="py-5 px-8 text-center text-gray-400"
                          >
                            Tidak ada data transaksi.
                          </td>
                        </tr>
                      ) : (
                        paginatedKas.map((row) => (
                          <tr
                            key={row.kas_id}
                            className="group hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="py-5 px-8 text-xs font-bold text-gray-700">
                              {formatDate(row.tanggal)}
                            </td>
                            <td className="py-5 px-8">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-mono font-bold text-[#004A9C] bg-blue-50 px-1.5 py-0.5 rounded w-fit">
                                  {row.kode_transaksi}
                                </span>
                                <span className="text-xs font-bold text-gray-600 mt-0.5">
                                  {row.kategoriKas?.nama_kategori}
                                </span>
                              </div>
                            </td>
                            <td className="py-5 px-8">
                              <div className="flex flex-col">
                                {row.user?.anggota && (
                                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                    <User size={12} />{" "}
                                    {row.user.anggota.nama_lengkap}
                                  </span>
                                )}
                                <span className="text-xs text-gray-400 line-clamp-1">
                                  {row.keterangan}
                                </span>
                              </div>
                            </td>
                            <td className="py-5 px-8">
                              <StatusBadge status={row.jenis}>
                                {row.jenis === "Debit"
                                  ? "Pemasukan"
                                  : "Pengeluaran"}
                              </StatusBadge>
                            </td>
                            <td className="py-5 px-8 text-right">
                              <span
                                className={`text-xs font-black ${row.jenis === "Debit" ? "text-green-600" : "text-red-500"}`}
                              >
                                {row.jenis === "Debit" ? "+" : "-"}{" "}
                                {formatCurrency(row.nominal)}
                              </span>
                            </td>
                            <td className="py-5 px-8 text-right">
                              <span className="text-xs font-extrabold text-gray-800">
                                {formatCurrency(row.saldo_akhir)}
                              </span>
                            </td>
                            <td className="py-5 px-4 text-center">
                              <span
                                className={`text-[9px] font-black px-2 py-1 rounded-full ${row.metode_pembayaran === "BANK" ? "bg-blue-100 text-[#004A9C]" : "bg-orange-100 text-orange-600"}`}
                              >
                                {row.metode_pembayaran || "CASH"}
                              </span>
                            </td>
                            <td className="py-5 px-8 text-right">
                              {isBendahara ? (
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!isClosed && (
                                    <>
                                      {(!row.kode_transaksi || row.kode_transaksi.startsWith("TRX-")) ? (
                                        <>
                                          <button
                                            onClick={() => {
                                              setEditKasData(row);
                                              setFormDataKas({
                                                user_id: row.user_id || "",
                                                nama_kategori:
                                                  row.kategoriKas?.nama_kategori ||
                                                  "",
                                                nominal: row.nominal,
                                                keterangan: row.keterangan || "",
                                                jenis: row.jenis,
                                                metode_pembayaran:
                                                  row.metode_pembayaran || "CASH",
                                              });
                                              setShowModalKas(true);
                                            }}
                                            className="p-2 text-gray-400 hover:text-[#004A9C] hover:bg-blue-50 rounded-lg transition-all"
                                            title="Edit Transaksi"
                                          >
                                            <Edit2 size={16} />
                                          </button>
                                          <button
                                            onClick={() =>
                                              setShowConfirmDelete({
                                                isOpen: true,
                                                id: row.kas_id,
                                                name:
                                                  row.keterangan ||
                                                  row.kode_transaksi,
                                                type: "kas",
                                              })
                                            }
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Hapus Transaksi"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </>
                                      ) : (
                                        <span className="text-[9px] font-black px-2.5 py-1 bg-gray-100 text-gray-400 rounded-full uppercase tracking-wider select-none" title="Transaksi otomatis sistem hanya dapat dikelola dari modul asalnya">
                                          Otomatis
                                        </span>
                                      )}
                                    </>
                                  )}
                                  {isClosed && (
                                    <span className="text-[10px] font-bold text-gray-400 italic">
                                      Locked
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[9px] font-bold text-gray-300 uppercase italic">
                                  View Only
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer - Simplified & More Visible */}
                {filteredKas.length > 0 && (
                  <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between bg-[#F8FAFC]">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 sm:mb-0">
                      Menampilkan{" "}
                      <span className="text-[#004A9C]">
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>{" "}
                      -{" "}
                      <span className="text-[#004A9C]">
                        {Math.min(
                          filteredKas.length,
                          currentPage * itemsPerPage,
                        )}
                      </span>{" "}
                      dari{" "}
                      <span className="text-gray-600">
                        {filteredKas.length}
                      </span>{" "}
                      Data
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-[#004A9C] hover:bg-white hover:border-[#004A9C]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} />
                        Sebelumnya
                      </button>

                      <div className="flex gap-1.5 mx-1">
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1,
                        ).map((page) => {
                          if (
                            totalPages > 5 &&
                            Math.abs(page - currentPage) > 1 &&
                            page !== 1 &&
                            page !== totalPages
                          ) {
                            if (Math.abs(page - currentPage) === 2)
                              return (
                                <span key={page} className="px-1 text-gray-300">
                                  ...
                                </span>
                              );
                            return null;
                          }
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                                currentPage === page
                                  ? "bg-[#004A9C] text-white shadow-lg shadow-blue-900/20"
                                  : "border border-gray-200 text-gray-400 hover:bg-white hover:text-[#004A9C] hover:border-[#004A9C]/20"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-[#004A9C] hover:bg-white hover:border-[#004A9C]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Selanjutnya
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Kelola Kategori Button - Only for Bendahara */}
              {isBendahara && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setActiveTab("kategori")}
                    className="flex items-center gap-2 px-6 py-3 bg-[#004A9C] hover:bg-[#003d82] text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20 active:scale-95"
                  >
                    <Tags size={16} />
                    Kelola Saldo Awal
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "kategori" && (
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8 space-y-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab("arus-kas")}
                    className="p-2 hover:bg-gray-50 rounded-lg text-gray-400"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-xl font-bold">Manajemen Saldo Awal</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* KELOMPOK AKTIVA / ASSET */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                    <h3 className="font-black text-gray-800 uppercase tracking-widest text-sm">
                      Kelompok Aktiva (Aset)
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {categories
                      .filter(
                        (c) =>
                          c.tipe_neraca === "Asset" &&
                          [
                            "TAGIHAN PINJAMAN",
                            "TAGIHAN CREDIT BARANG",
                            "TAGIHAN RENTAL",
                            "PERSEDIAAN BARANG",
                            "ALAT KANTOR",
                            "INVESTASI",
                            "INCOME TAX",
                          ].includes(c.nama_kategori),
                      )
                      .map((c) => (
                        <div
                          key={c.kategori_id}
                          className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl flex justify-between items-center hover:shadow-sm transition-all group"
                        >
                          <div>
                            <p className="font-black text-gray-700 text-sm">
                              {c.nama_kategori}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-black uppercase bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                                Asset
                              </span>
                              <span className="text-[10px] font-bold text-gray-400">
                                Saldo Awal:{" "}
                                <span className="text-gray-800">
                                  {formatCurrency(c.saldo_awal)}
                                </span>
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditCatData(c);
                                setFormDataCat({
                                  nama_kategori: c.nama_kategori,
                                  jenis: c.jenis,
                                  tipe_neraca: c.tipe_neraca,
                                  saldo_awal: c.saldo_awal,
                                });
                                setShowModalCat(true);
                              }}
                              className="p-2 text-blue-500 hover:bg-white rounded-xl shadow-sm"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* KELOMPOK PASIVA / LIABILITIES & EQUITY */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
                    <h3 className="font-black text-gray-800 uppercase tracking-widest text-sm">
                      Kelompok Pasiva (Kewajiban & Modal)
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {categories
                      .filter(
                        (c) =>
                          c.tipe_neraca !== "Asset" &&
                          [
                            "DP - PENERIMAAN DIMUKA",
                            "HUTANG USAHA",
                            "HUTANG BIAYA",
                            "TAX LIABILITY",
                            "LOAN",
                            "PROFIT/LOSS",
                            "LABA DITAHAN",
                            "SIMPANAN ANGGOTA",
                          ].includes(c.nama_kategori),
                      )
                      .map((c) => (
                        <div
                          key={c.kategori_id}
                          className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl flex justify-between items-center hover:shadow-sm transition-all group"
                        >
                          <div>
                            <p className="font-black text-gray-700 text-sm">
                              {c.nama_kategori}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${c.tipe_neraca === "Liability" ? "bg-orange-100 text-orange-600" : "bg-purple-100 text-purple-600"}`}
                              >
                                {c.tipe_neraca}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400">
                                Saldo Awal:{" "}
                                <span className="text-gray-800">
                                  {formatCurrency(Math.abs(c.saldo_awal))}
                                </span>
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditCatData(c);
                                setFormDataCat({
                                  nama_kategori: c.nama_kategori,
                                  jenis: c.jenis,
                                  tipe_neraca: c.tipe_neraca,
                                  saldo_awal: c.saldo_awal,
                                });
                                setShowModalCat(true);
                              }}
                              className="p-2 text-blue-500 hover:bg-white rounded-xl shadow-sm"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "shu" && (
            <SHUTab api={api} showNotification={showNotification} user={user} />
          )}
          {activeTab === "neraca" && (
            <NeracaInlineTab 
              api={api} 
              showNotification={showNotification} 
              exportTrigger={exportTrigger}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal Arus Kas */}
      <AnimatePresence>
        {showModalKas && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModalKas(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editKasData ? "Edit Transaksi" : "Catat Transaksi"}
                </h2>
                <button
                  onClick={() => setShowModalKas(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleSubmitKas} className="space-y-4">
                {formDataKas.jenis === "Debit" &&
                  parseFloat(formDataKas.nominal) >
                    realtimeSaldo[formDataKas.metode_pembayaran || "CASH"] && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 mb-2"
                    >
                      <AlertTriangle size={20} />
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-widest">
                          Saldo Tidak Mencukupi
                        </span>
                        <span className="text-[10px] font-bold opacity-80">
                          Saldo {formDataKas.metode_pembayaran || "CASH"} saat
                          ini:{" "}
                          {formatCurrency(
                            realtimeSaldo[
                              formDataKas.metode_pembayaran || "CASH"
                            ],
                          )}
                        </span>
                      </div>
                    </motion.div>
                  )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Kategori
                    </label>
                    <select
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#004A9C]/20"
                      value={formDataKas.nama_kategori}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                    >
                      <option value="">Pilih Kategori</option>
                      {categories
                        .filter(
                          (c) =>
                            ![
                              "Simpanan Pokok",
                              "Simpanan Wajib",
                              "Simpanan Sukarela",
                              "Penarikan Simpanan",
                              "PINJAMAN UANG",
                              "CREDIT BARANG",
                              "ANGSURAN PINJAMAN UANG",
                              "ANGSURAN CREDIT BARANG",
                              "PENDAPATAN PINJAMAN",
                              "PENJUALAN CREDIT",
                              "BUNGA/PROFIT",
                              "BUNGA",
                              "PROFIT",
                              "Biaya Operasional",
                              "LABA DITAHAN",
                              "PROFIT/LOSS",
                              "SIMPANAN ANGGOTA",
                              "TAGIHAN PINJAMAN",
                              "TAGIHAN CREDIT BARANG",
                              "PEMBAGIAN SHU ANGGOTA",
                              "PEMBAGIAN SHU PENGURUS",
                              "CASH",
                              "BANK",
                            ].includes(c.nama_kategori),
                        )
                        .map((c) => (
                          <option key={c.kategori_id} value={c.nama_kategori}>
                            {c.nama_kategori}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Nominal (Rp)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="0"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#004A9C]/20"
                      value={formatNumber(formDataKas.nominal)}
                      onChange={(e) =>
                        setFormDataKas({
                          ...formDataKas,
                          nominal: parseNumber(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormDataKas({
                          ...formDataKas,
                          metode_pembayaran: "CASH",
                        })
                      }
                      className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${formDataKas.metode_pembayaran === "CASH" ? "border-[#004A9C] bg-[#004A9C]/5 text-[#004A9C]" : "border-gray-100 text-gray-400 hover:bg-gray-50"}`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${formDataKas.metode_pembayaran === "CASH" ? "bg-[#004A9C]" : "bg-gray-200"}`}
                      />
                      TUNAI (CASH)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormDataKas({
                          ...formDataKas,
                          metode_pembayaran: "BANK",
                        })
                      }
                      className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${formDataKas.metode_pembayaran === "BANK" ? "border-[#004A9C] bg-[#004A9C]/5 text-[#004A9C]" : "border-gray-100 text-gray-400 hover:bg-gray-50"}`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${formDataKas.metode_pembayaran === "BANK" ? "bg-[#004A9C]" : "bg-gray-200"}`}
                      />
                      TRANSFER (BANK)
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Jenis Transaksi
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormDataKas({ ...formDataKas, jenis: "Debit" })
                      }
                      className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all ${formDataKas.jenis === "Debit" ? "border-[#27AE60] bg-[#27AE60]/5 text-[#27AE60]" : "border-gray-100 text-gray-400 hover:bg-gray-50"}`}
                    >
                      UANG MASUK (DEBIT)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormDataKas({ ...formDataKas, jenis: "Kredit" })
                      }
                      className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all ${formDataKas.jenis === "Kredit" ? "border-[#EB5757] bg-[#EB5757]/5 text-[#EB5757]" : "border-gray-100 text-gray-400 hover:bg-gray-50"}`}
                    >
                      UANG KELUAR (KREDIT)
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Keterangan
                  </label>
                  <textarea
                    required
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#004A9C]/20"
                    placeholder="Detail transaksi..."
                    value={formDataKas.keterangan}
                    onChange={(e) =>
                      setFormDataKas({
                        ...formDataKas,
                        keterangan: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowModalKas(false)}
                    className="flex-1 !bg-gray-100 !text-gray-500"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={
                      formDataKas.jenis === "Kredit" &&
                      parseFloat(formDataKas.nominal || 0) > 0 &&
                      parseFloat(formDataKas.nominal || 0) >
                        (realtimeSaldo[
                          formDataKas.metode_pembayaran || "CASH"
                        ] || 0)
                    }
                  >
                    Simpan
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Kategori */}
      <AnimatePresence>
        {showModalCat && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModalCat(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editCatData ? "Edit Kategori" : "Tambah Kategori"}
                </h2>
                <button
                  onClick={() => setShowModalCat(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleCategorySubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Nama Kategori
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Biaya Operasional"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#004A9C]/20 outline-none"
                    value={formDataCat.nama_kategori}
                    onChange={(e) =>
                      setFormDataCat({
                        ...formDataCat,
                        nama_kategori: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Saldo Awal (Rp)
                  </label>
                  <input
                    type="text"
                    placeholder="0"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#004A9C]/20 outline-none font-bold"
                    value={formatNumber(Math.abs(formDataCat.saldo_awal))}
                    onChange={(e) =>
                      setFormDataCat({
                        ...formDataCat,
                        saldo_awal: parseNumber(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Kelompok Neraca
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#004A9C]/20 outline-none font-bold"
                    value={formDataCat.tipe_neraca}
                    onChange={(e) =>
                      setFormDataCat({
                        ...formDataCat,
                        tipe_neraca: e.target.value,
                      })
                    }
                  >
                    <option value="Asset">AKTIVA (Aset/Harta)</option>
                    <option value="Liability">PASIVA (Kewajiban/Hutang)</option>
                    <option value="Equity">PASIVA (Modal/Ekuitas)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Jenis Transaksi Default
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormDataCat({ ...formDataCat, jenis: "Debit" })
                      }
                      className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all ${formDataCat.jenis === "Debit" ? "border-[#27AE60] bg-[#27AE60]/5 text-[#27AE60]" : "border-gray-100 text-gray-400 hover:bg-gray-50"}`}
                    >
                      Uang Masuk (Debit)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormDataCat({ ...formDataCat, jenis: "Kredit" })
                      }
                      className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all ${formDataCat.jenis === "Kredit" ? "border-[#EB5757] bg-[#EB5757]/5 text-[#EB5757]" : "border-gray-100 text-gray-400 hover:bg-gray-50"}`}
                    >
                      Uang Keluar (Kredit)
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowModalCat(false)}
                    className="flex-1 !bg-gray-100 !text-gray-500"
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="flex-1">
                    Simpan
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal Konfirmasi Hapus */}
      <AnimatePresence>
        {showConfirmDelete.isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() =>
                setShowConfirmDelete({ isOpen: false, id: null, name: "" })
              }
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {showConfirmDelete.type === "kas"
                  ? "Hapus Transaksi?"
                  : "Hapus Kategori?"}
              </h3>
              <p className="text-gray-500 text-sm mb-8">
                {showConfirmDelete.type === "kas" ? (
                  <>
                    Apakah Anda yakin ingin menghapus transaksi{" "}
                    <span className="font-bold text-gray-700">
                      "{showConfirmDelete.name}"
                    </span>
                    ? Saldo akhir akan dihitung ulang secara otomatis.
                  </>
                ) : (
                  <>
                    Apakah Anda yakin ingin menghapus kategori{" "}
                    <span className="font-bold text-gray-700">
                      "{showConfirmDelete.name}"
                    </span>
                    ? Transaksi yang sudah ada tidak akan hilang, namun kategori
                    ini tidak bisa dipilih lagi.
                  </>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setShowConfirmDelete({ isOpen: false, id: null, name: "" })
                  }
                  className="flex-1 px-6 py-3 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-6 py-3 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Penyesuaian Saldo Awal */}
      <AnimatePresence>
        {showModalAdjust && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModalAdjust(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Penyesuaian Saldo Awal
                </h2>
                <button
                  onClick={() => setShowModalAdjust(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 text-blue-700 mb-6">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-[11px] leading-relaxed font-medium">
                  <span className="font-bold">INFO:</span> Anda sedang mengubah{" "}
                  <span className="font-bold underline">Saldo Awal</span> (Titik
                  Nol). Perubahan ini tidak akan dicatat sebagai transaksi Arus
                  Kas harian.
                </p>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsAdjusting(true);
                  try {
                    // Update CASH
                    await api.put("/keuangan/saldo-kas", {
                      metode_pembayaran: "CASH",
                      saldo_baru: formDataAdjust.saldo_cash,
                      bulan: formDataAdjust.bulan,
                      tahun: formDataAdjust.tahun,
                    });
                    // Update BANK
                    await api.put("/keuangan/saldo-kas", {
                      metode_pembayaran: "BANK",
                      saldo_baru: formDataAdjust.saldo_bank,
                      bulan: formDataAdjust.bulan,
                      tahun: formDataAdjust.tahun,
                    });
                    setShowModalAdjust(false);
                    fetchArusKas();
                    fetchSetupData();
                  } catch (err) {
                    showNotification("Gagal menyesuaikan saldo awal", "error");
                  } finally {
                    setIsAdjusting(false);
                  }
                }}
                className="space-y-6"
              >
                {/* Input CASH */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Saldo Awal Bulan (CASH) -{" "}
                    {months[parseInt(formDataAdjust.bulan) - 1]}{" "}
                    {formDataAdjust.tahun}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      required
                      className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-lg font-black outline-none focus:ring-2 focus:ring-[#004A9C]/20"
                      value={formatNumber(formDataAdjust.saldo_cash)}
                      onChange={(e) =>
                        setFormDataAdjust({
                          ...formDataAdjust,
                          saldo_cash: parseNumber(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                {/* Input BANK */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Saldo Awal Bulan (BANK) -{" "}
                    {months[parseInt(formDataAdjust.bulan) - 1]}{" "}
                    {formDataAdjust.tahun}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      required
                      className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-lg font-black outline-none focus:ring-2 focus:ring-[#004A9C]/20"
                      value={formatNumber(formDataAdjust.saldo_bank)}
                      onChange={(e) =>
                        setFormDataAdjust({
                          ...formDataAdjust,
                          saldo_bank: parseNumber(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={() => setShowModalAdjust(false)}
                    className="flex-1 !bg-gray-100 !text-gray-500"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isAdjusting}
                  >
                    {isAdjusting ? "Memproses..." : "Simpan Saldo Awal"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
