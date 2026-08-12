import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, KeyRound, RefreshCw, CheckCircle2, X, Clock, AlertTriangle, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Modal Verifikasi Akses — Kelola Saldo Awal
 *
 * Alur:
 * 1. Modal terbuka → request kode ke backend (GET /keuangan/saldo-awal-code)
 * 2. Tampilkan kode 6-char yang di-generate sistem kepada user
 * 3. User harus mengetik ulang kode tersebut ke dalam input
 * 4. Kirim verifikasi ke backend (POST /keuangan/verify-saldo-awal-code)
 * 5. Jika sukses → panggil onVerified()
 */
export default function SaldoAwalAccessModal({ isOpen, onClose, onVerified }) {
  const { api } = useAuth();

  // State
  const [step, setStep] = useState('loading'); // loading | show-code | input-code | success | error
  const [generatedCode, setGeneratedCode] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 menit dalam detik
  const [isRegenerating, setIsRegenerating] = useState(false);

  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  // Reset semua state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setStep('loading');
      setGeneratedCode('');
      setInputCode('');
      setErrorMsg('');
      setIsVerifying(false);
      fetchCode();
    } else {
      clearInterval(timerRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Timer countdown
  useEffect(() => {
    if (step === 'show-code' || step === 'input-code') {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setStep('input-code');
            setErrorMsg('Kode telah kadaluarsa. Klik "Minta Kode Baru" untuk melanjutkan.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  const fetchCode = useCallback(async () => {
    try {
      setIsRegenerating(true);
      setErrorMsg('');
      setInputCode('');
      const res = await api.get('/keuangan/saldo-awal-code');
      if (res.data.success) {
        setGeneratedCode(res.data.code);
        setExpiresAt(res.data.expiresAt);
        const secondsLeft = Math.floor((res.data.expiresAt - Date.now()) / 1000);
        setTimeLeft(secondsLeft > 0 ? secondsLeft : 300);
        setStep('show-code');
      }
    } catch (err) {
      setStep('error');
      setErrorMsg(err.response?.data?.message || 'Gagal mendapatkan kode akses dari server.');
    } finally {
      setIsRegenerating(false);
    }
  }, [api]);

  const handleProceedToInput = () => {
    setStep('input-code');
  };

  const handleVerify = async () => {
    if (!inputCode || inputCode.length < 6) {
      setErrorMsg('Harap masukkan 6 karakter kode verifikasi.');
      return;
    }
    setIsVerifying(true);
    setErrorMsg('');
    try {
      const res = await api.post('/keuangan/verify-saldo-awal-code', { code: inputCode.toUpperCase() });
      if (res.data.success) {
        setStep('success');
        clearInterval(timerRef.current);
        setTimeout(() => {
          onVerified();
          onClose();
        }, 1200);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Verifikasi gagal. Coba lagi.');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isExpired = timeLeft <= 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={step !== 'success' ? onClose : undefined}
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header gradient */}
            <div className="bg-gradient-to-br from-[#003B7D] to-[#004A9C] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full -ml-16 -mb-16 blur-xl" />

              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-sm border border-white/20">
                    <ShieldAlert size={28} className="text-white" />
                  </div>
                  <div>
                    <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Verifikasi Akses</p>
                    <h2 className="text-xl font-black text-white leading-tight">Kelola Saldo Awal</h2>
                  </div>
                </div>
                {step !== 'success' && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              <p className="relative mt-4 text-blue-100 text-sm font-medium leading-relaxed">
                Halaman ini dilindungi karena mengandung data keuangan krusial. Ikuti langkah verifikasi untuk melanjutkan.
              </p>
            </div>

            {/* Body */}
            <div className="p-6">
              <AnimatePresence mode="wait">

                {/* STEP: Loading */}
                {step === 'loading' && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4 py-6">
                    <div className="w-16 h-16 rounded-2xl bg-[#DFEAF4] flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      >
                        <RefreshCw size={28} className="text-[#004A9C]" />
                      </motion.div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Meminta kode verifikasi dari server...</p>
                  </motion.div>
                )}

                {/* STEP: Show Code */}
                {step === 'show-code' && (
                  <motion.div key="show-code" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="space-y-5">
                    <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xl">
                      <AlertTriangle size={16} className="shrink-0 text-amber-600" />
                      <p className="text-xs font-semibold">Hafalkan kode ini, lalu ketikkan ulang untuk membuktikan Anda yang mengaksesnya.</p>
                    </div>

                    <div className="text-center space-y-2">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Kode Akses Satu Kali</p>
                      {/* Kode Display */}
                      <div className="flex justify-center gap-2 mt-3">
                        {generatedCode.split('').map((char, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="w-12 h-14 bg-gradient-to-br from-[#004A9C] to-[#003B7D] text-white rounded-xl flex items-center justify-center font-black text-2xl tracking-wider shadow-lg shadow-blue-900/20 select-none"
                          >
                            {char}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Timer */}
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <Clock size={14} />
                      <span className="text-xs font-bold">
                        Kode berlaku selama: <span className={`font-black ${timeLeft < 60 ? 'text-red-500' : 'text-[#004A9C]'}`}>{formatTime(timeLeft)}</span>
                      </span>
                    </div>

                    <button
                      onClick={handleProceedToInput}
                      className="w-full py-4 bg-[#004A9C] text-white font-black rounded-2xl shadow-lg shadow-[#004A9C]/25 hover:bg-[#003B7D] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <KeyRound size={18} />
                      Saya Sudah Hafal — Masukkan Kode
                    </button>
                  </motion.div>
                )}

                {/* STEP: Input Code */}
                {step === 'input-code' && (
                  <motion.div key="input-code" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="space-y-5">

                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-14 h-14 bg-[#DFEAF4] rounded-2xl mb-3">
                        <KeyRound size={24} className="text-[#004A9C]" />
                      </div>
                      <p className="text-sm font-bold text-gray-700">Masukkan Kode Verifikasi</p>
                      <p className="text-xs text-gray-400 mt-1">Ketik ulang 6 karakter kode yang ditampilkan sistem</p>
                    </div>

                    {/* OTP Input */}
                    <div className="flex justify-center gap-2">
                      {Array(6).fill(0).map((_, i) => (
                        <input
                          key={i}
                          ref={el => inputRefs.current[i] = el}
                          type="text"
                          maxLength={1}
                          value={inputCode[i] || ''}
                          onChange={e => {
                            const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                            const arr = inputCode.split('');
                            arr[i] = val;
                            const newCode = arr.join('').slice(0, 6);
                            setInputCode(newCode);
                            setErrorMsg('');
                            if (val && i < 5) inputRefs.current[i + 1]?.focus();
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Backspace' && !inputCode[i] && i > 0) {
                              inputRefs.current[i - 1]?.focus();
                            }
                          }}
                          onPaste={e => {
                            e.preventDefault();
                            const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                            setInputCode(pasted);
                            setErrorMsg('');
                            inputRefs.current[Math.min(pasted.length, 5)]?.focus();
                          }}
                          className={`w-12 h-14 border-2 rounded-xl text-center font-black text-xl outline-none transition-all
                            ${isExpired ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed' :
                              inputCode[i] ? 'border-[#004A9C] bg-[#DFEAF4] text-[#004A9C]' :
                              'border-gray-200 hover:border-gray-300 focus:border-[#004A9C] focus:bg-[#DFEAF4]/30'
                            }`}
                          disabled={isExpired}
                          autoFocus={i === 0}
                        />
                      ))}
                    </div>

                    {/* Error / Expiry */}
                    {errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2 bg-red-50 border border-red-200 p-3 rounded-xl"
                      >
                        <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs font-semibold text-red-700">{errorMsg}</p>
                      </motion.div>
                    )}

                    {/* Timer */}
                    {!isExpired && (
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <Clock size={14} />
                        <span className="text-xs font-bold">
                          Sisa waktu: <span className={`font-black ${timeLeft < 60 ? 'text-red-500' : 'text-[#004A9C]'}`}>{formatTime(timeLeft)}</span>
                        </span>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={fetchCode}
                        disabled={isRegenerating}
                        className="flex-1 py-3 border-2 border-gray-200 text-gray-500 font-bold rounded-2xl hover:border-[#004A9C] hover:text-[#004A9C] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RefreshCw size={15} className={isRegenerating ? 'animate-spin' : ''} />
                        Kode Baru
                      </button>
                      <button
                        onClick={handleVerify}
                        disabled={isVerifying || inputCode.length < 6 || isExpired}
                        className="flex-[2] py-3 bg-[#004A9C] text-white font-black rounded-2xl shadow-lg shadow-[#004A9C]/25 hover:bg-[#003B7D] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isVerifying ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
                            <RefreshCw size={16} />
                          </motion.div>
                        ) : (
                          <KeyRound size={16} />
                        )}
                        {isVerifying ? 'Memverifikasi...' : 'Verifikasi & Buka'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP: Error */}
                {step === 'error' && (
                  <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4 py-4 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
                      <Lock size={28} className="text-red-500" />
                    </div>
                    <p className="text-sm font-bold text-gray-700">Gagal Mendapatkan Kode</p>
                    <p className="text-xs text-gray-400">{errorMsg}</p>
                    <button
                      onClick={fetchCode}
                      className="px-6 py-3 bg-[#004A9C] text-white font-bold rounded-2xl text-sm hover:bg-[#003B7D] transition-all flex items-center gap-2"
                    >
                      <RefreshCw size={15} /> Coba Lagi
                    </button>
                  </motion.div>
                )}

                {/* STEP: Success */}
                {step === 'success' && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4 py-6 text-center">
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
                      className="w-20 h-20 bg-green-50 rounded-[2rem] flex items-center justify-center shadow-inner"
                    >
                      <CheckCircle2 size={40} className="text-green-500" />
                    </motion.div>
                    <div>
                      <p className="font-black text-gray-800 text-lg">Verifikasi Berhasil!</p>
                      <p className="text-xs text-gray-400 mt-1">Mengalihkan ke halaman Kelola Saldo Awal...</p>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
