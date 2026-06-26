import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  CreditCard,
  TrendingUp,
  Clock,
  Activity,
  LayoutDashboard,
  ArrowUpRight,
  ChevronRight,
  Info,
  Calendar,
  UserCheck,
  PiggyBank,
} from "lucide-react";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import StatusBadge from "../../components/atoms/StatusBadge";

export default function Dashboard() {
  const navigate = useNavigate();
  const { api, user } = useAuth();
  const socket = useSocket();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/user/profile?t=${Date.now()}`);
      if (response.data.success) {
        setProfileData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      console.log("🔄 Dashboard: Refetching profile due to real-time update");
      fetchProfile();
    };

    socket.on("simpanan:updated", handleUpdate);
    socket.on("simpanan:bulkUpdated", handleUpdate);
    socket.on("transaksi:created", handleUpdate);
    socket.on("transaksi:updated", handleUpdate);
    socket.on("pinjaman:updated", handleUpdate);
    socket.on("pinjaman:bulkUpdated", handleUpdate);
    socket.on("shu:finalized", handleUpdate);
    socket.on("shu:unfinalized", handleUpdate);

    return () => {
      socket.off("simpanan:updated", handleUpdate);
      socket.off("simpanan:bulkUpdated", handleUpdate);
      socket.off("transaksi:created", handleUpdate);
      socket.off("transaksi:updated", handleUpdate);
      socket.off("pinjaman:updated", handleUpdate);
      socket.off("pinjaman:bulkUpdated", handleUpdate);
      socket.off("shu:finalized", handleUpdate);
      socket.off("shu:unfinalized", handleUpdate);
    };
  }, [socket, user, profileData?.anggota_id]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren",
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatCompactCurrency = (val) => {
    if (!val) return "Rp 0";
    const num = parseFloat(val);
    if (num >= 1000000) {
      return `Rp ${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)} Jt`;
    }
    if (num >= 1000) {
      return `Rp ${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)} Rb`;
    }
    return formatCurrency(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const calculateMembershipDuration = (dateString) => {
    if (!dateString) return "-";
    const joinedDate = new Date(dateString);
    const now = new Date();

    let years = now.getFullYear() - joinedDate.getFullYear();
    let months = now.getMonth() - joinedDate.getMonth();
    let days = now.getDate() - joinedDate.getDate();

    if (days < 0) {
      months -= 1;
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += lastMonth.getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years} Thn`);
    if (months > 0) parts.push(`${months} Bln`);
    if (days > 0 || parts.length === 0) parts.push(`${days} Hari`);

    return parts.join(" ");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004A9C]"></div>
      </div>
    );
  }

  const totalSimpanan =
    parseFloat(profileData?.simpanan?.saldo_pokok || 0) +
    parseFloat(profileData?.simpanan?.saldo_wajib || 0) +
    parseFloat(profileData?.simpanan?.saldo_sukarela || 0);

  const totalSHU =
    profileData?.pembagianShu
      ?.filter((curr) => curr.rekap?.is_finalized)
      ?.reduce(
        (acc, curr) =>
          acc + (curr.pembulatan !== null && curr.pembulatan !== undefined
            ? parseFloat(curr.pembulatan)
            : Math.round(parseFloat(curr.shu_diterima || 0) / 1000) * 1000),
        0,
      ) || 0;
  const sisaPinjaman =
    profileData?.pinjaman?.reduce(
      (acc, curr) => acc + parseFloat(curr.sisa_tagihan || 0),
      0,
    ) || 0;

  // Unified Activity Feed: Merge Savings and Loans
  const recentActivities = [
    ...(profileData?.transaksiSimpanan?.map((t) => ({
      id: `trx-${t.transaksi_id}`,
      realId: t.transaksi_id,
      tanggal: t.tanggal,
      kategori: "Simpanan",
      keterangan: t.jenis_transaksi?.replace(/Setoran/g, "Simpanan"),
      nominal: t.nominal,
      type: t.jenis_transaksi?.toLowerCase().includes("tarik") ? "out" : "in",
      status: "Success",
      icon: PiggyBank,
      color: "#27AE60",
    })) || []),
    ...(profileData?.pinjaman?.map((p) => ({
      id: `loan-${p.pinjaman_id}`,
      realId: p.pinjaman_id,
      tanggal: p.tanggal_pengajuan,
      kategori: "Pinjaman",
      keterangan: `Pengajuan ${p.jenis_pinjaman}${p.nama_barang ? " - " + p.nama_barang : ""}`,
      nominal: p.jumlah_pinjaman,
      type: "loan",
      status: p.status,
      icon: CreditCard,
      color: "#004A9C",
    })) || []),
  ]
    .sort((a, b) => {
      const dateA = new Date(a.tanggal);
      const dateB = new Date(b.tanggal);
      if (dateB - dateA !== 0) return dateB - dateA;
      // Secondary sort by ID if dates are equal
      return (b.realId || 0) - (a.realId || 0);
    })
    .slice(0, 7);

  const stats = [
    {
      label: "Total Simpanan",
      rawValue: totalSimpanan,
      icon: Wallet,
      color: "#004A9C",
      detail: "Akumulasi saldo Anda",
    },
    {
      label: "Sisa Pinjaman",
      rawValue: sisaPinjaman,
      icon: CreditCard,
      color: "#EB5757",
      detail: "Total tagihan berjalan",
    },
    {
      label: "Total SHU Diterima",
      rawValue: totalSHU,
      icon: TrendingUp,
      color: "#27AE60",
      detail: "Sisa Hasil Usaha",
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-10"
    >
      {/* Premium Header Section */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-blue-900/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#DFEAF4] rounded-full -mr-32 -mt-32 opacity-40 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#004A9C]/5 rounded-full -ml-24 -mb-24 opacity-40 blur-3xl"></div>

        <div className="space-y-3 relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#DFEAF4] text-[#004A9C] rounded-full text-xs font-bold uppercase tracking-widest"
          >
            <LayoutDashboard size={14} />
            <span>Member Overview</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            Selamat Datang,{" "}
            <span className="text-[#004A9C]">
              {profileData?.nama_lengkap?.split(" ")[0]}
            </span>
            !
          </h2>
          <p className="text-gray-500 text-lg font-medium">
            Pantau pertumbuhan simpanan dan status pinjaman Anda secara
            real-time.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 bg-gray-50 p-4 rounded-3xl border border-gray-100">
          <div className="w-12 h-12 rounded-2xl bg-[#004A9C] text-white flex items-center justify-center shadow-lg shadow-[#004A9C]/20">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              ID Anggota
            </p>
            <p className="text-lg font-black text-[#004A9C]">
              {profileData?.no_anggota || "PROSES..."}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            onMouseEnter={() => setHoveredCard(idx)}
            onMouseLeave={() => setHoveredCard(null)}
            className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-gray-100 hover:shadow-2xl hover:shadow-blue-900/10 transition-all group relative overflow-hidden aspect-square flex flex-col items-center justify-center text-center cursor-help"
          >
            {/* Clipping container for decorative background effects */}
            <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
              <div
                className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 transition-transform duration-700 group-hover:scale-150"
                style={{ backgroundColor: stat.color }}
              />
            </div>

            <div
              className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-sm transition-all group-hover:scale-110 group-hover:rotate-6 duration-500 mb-6 flex-shrink-0 relative z-10"
              style={{ backgroundColor: `${stat.color}10`, color: stat.color }}
            >
              <stat.icon size={28} />
            </div>

            <div className="space-y-2 relative z-10 w-full">
              <h3 className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.2em] leading-tight px-2">
                {stat.label}
              </h3>

              <div className="relative inline-block w-full">
                <p
                  className={`text-3xl font-black transition-all duration-300 text-gray-900 tracking-tighter ${hoveredCard === idx ? "blur-sm opacity-20" : ""}`}
                >
                  {formatCompactCurrency(stat.rawValue)}
                </p>

                <AnimatePresence>
                  {hoveredCard === idx && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      className="absolute inset-0 flex items-center justify-center z-50"
                    >
                      <span className="text-sm font-black text-gray-900 whitespace-nowrap bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-gray-100 shadow-sm">
                        {formatCurrency(stat.rawValue)}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <p className="text-[10px] text-gray-400 font-medium italic">
                {stat.detail}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions Table */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500"
        >
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-[#004A9C] rounded-2xl">
                <Activity size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800 tracking-tight">
                  Aktifitas Terakhir
                </h3>
                <p className="text-sm text-gray-400 font-medium">
                  simpanan & pinjaman terbaru
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/simpan-pinjam")}
              className="p-2 hover:bg-blue-50 rounded-xl transition-all text-gray-400 hover:text-[#004A9C] group/btn"
            >
              <ChevronRight
                size={20}
                className="group-hover/btn:translate-x-1 transition-transform"
              />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="py-5 px-8">Tanggal</th>
                  <th className="py-5 px-8">Kategori</th>
                  <th className="py-5 px-8">Keterangan</th>
                  <th className="py-5 px-8 text-right">Nominal</th>
                  <th className="py-5 px-8 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentActivities.length > 0 ? (
                  recentActivities.map((act, idx) => (
                    <motion.tr
                      key={act.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-[#DFEAF4]/20 transition-all duration-300 group"
                    >
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-3">
                          <Calendar size={14} className="text-gray-300" />
                          <span className="text-xs font-bold text-gray-600">
                            {formatDate(act.tanggal)}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-2">
                          <div
                            className="p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-white transition-colors"
                            style={{ color: act.color }}
                          >
                            <act.icon size={14} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {act.kategori}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-8 text-sm font-bold text-gray-700 tracking-tight">
                        {act.keterangan}
                      </td>
                      <td className="py-5 px-8 text-right">
                        <span
                          className={`text-sm font-black ${
                            act.type === "out"
                              ? "text-red-500"
                              : act.type === "loan"
                                ? "text-[#004A9C]"
                                : "text-[#27AE60]"
                          }`}
                        >
                          {act.type === "out"
                            ? "-"
                            : act.type === "loan"
                              ? ""
                              : "+"}
                          {formatCurrency(act.nominal)}
                        </span>
                      </td>
                      <td className="py-5 px-8 text-center">
                        <StatusBadge status={act.status} />
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-20 text-center text-gray-400 italic font-medium uppercase tracking-widest text-[10px]"
                    >
                      Belum ada aktifitas terbaru.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Member Info / Rules Card */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="bg-gradient-to-br from-[#004A9C] via-[#004A9C] to-[#0a56ad] rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-blue-900/20">
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <pattern
                    id="grid-member"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 10 0 L 0 0 0 10"
                      fill="none"
                      stroke="white"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-member)" />
              </svg>
            </div>

            <div className="relative z-10">
              <h3 className="text-xl font-black mb-4">Informasi Keanggotaan</h3>
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">
                    Lama Keanggotaan
                  </p>
                  <p className="font-black">
                    {calculateMembershipDuration(
                      profileData?.tanggal_bergabung,
                    )}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">
                    Tanggal Bergabung
                  </p>
                  <p className="font-black">
                    {formatDate(profileData?.tanggal_bergabung)}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate("/profile")}
                className="mt-8 w-full py-4 bg-white text-[#004A9C] font-black rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/10"
              >
                Detail Profil <ArrowUpRight size={18} />
              </button>
            </div>
          </div>
 
          <div className="bg-orange-50 border border-orange-100 rounded-[2.5rem] p-8 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
              <Info size={24} />
            </div>
            <div>
              <h4 className="font-black text-orange-800 tracking-tight">
                Butuh Pinjaman?
              </h4>
              <p className="text-sm text-orange-600 font-medium leading-relaxed mt-1">
                Gunakan fasilitas pinjaman koperasi untuk kebutuhan mendesak
                atau modal usaha Anda.
              </p>
            </div>
            <button 
              onClick={() => navigate("/koperasi-rules")}
              className="mt-2 text-orange-700 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
            >
              Pelajari Aturan <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
