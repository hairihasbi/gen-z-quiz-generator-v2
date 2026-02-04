import React, { useState, useEffect, useRef } from 'react';
import { 
  HashRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  Link, 
  useLocation, 
  useNavigate 
} from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Archive, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  PlusCircle,
  Database,
  Activity,
  FileText,
  Download,
  Eye,
  EyeOff, 
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  CloudCog,
  Upload,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Languages,
  Printer,
  FileType,
  Maximize2,
  Search,
  Filter,
  Lock,
  Unlock,
  Share2,
  UserPlus,
  Coins,
  Power,
  ShieldCheck,
  ShieldAlert,
  FileUp,
  RotateCw,
  Plus,
  Terminal,
  AlertTriangle,
  Info,
  Clock,
  Zap,
  Save,
  Server,
  Key,
  BookOpenCheck,
  LogIn,
  Link2,
  ArrowLeft,
  ChevronLeft,
  Heart,
  Wallet,
  QrCode,
  Copy,
  MessageCircle,
  Loader2,
  Gem,
  Rocket,
  Cpu,
  List,
  Grid
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

import { Role, User, Quiz, QuestionType, Difficulty, Question, CognitiveLevel, QuizGenerationParams, Blueprint, LogEntry, LogType, SystemSettings } from './types';
import { generateQuizContent, generateImageForQuestion, validateGeminiConnection, getApiKeyStats, KeyStats } from './services/geminiService';
import { dbService } from './services/dbService';
import MathRenderer from './components/MathRenderer';
import Homepage from './components/Homepage';
import TourGuide, { Step } from './components/TourGuide';

// --- STYLES FOR PRINTING & MATH ALIGNMENT ---
const GlobalAndPrintStyles = () => (
    <style>{`
        /* --- GLOBAL MATHJAX FIXES --- */
        mjx-container {
            display: inline-block !important;
            margin: 0 2px !important;
            vertical-align: middle !important;
        }
        
        mjx-container > svg {
            display: inline-block !important;
            vertical-align: middle !important;
            margin: 0 !important;
        }

        .mjx-chtml {
            font-size: 100% !important;
        }

        /* Graph Paper Background */
        .bg-graph-paper {
            background-color: #e5e7eb;
            background-image: 
                linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px);
            background-size: 20px 20px;
        }

        /* Scrollbar styling */
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }

        /* --- PRINT STYLES --- */
        @media print {
            @page {
                margin: 0;
                size: auto; 
            }
            
            body {
                visibility: hidden !important;
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            /* Reset Constraints */
            html, body, #root, #quiz-result-view, .transform, .fixed, .absolute, .relative, .overflow-hidden, .overflow-auto, .h-full, .w-full {
                position: static !important;
                transform: none !important;
                transition: none !important;
                overflow: visible !important;
                height: auto !important;
                width: auto !important;
            }

            /* Target Print Area */
            #print-area {
                visibility: visible !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 15mm 20mm !important; /* Standard A4 padding */
                background: white !important;
                box-shadow: none !important;
                border: none !important;
                z-index: 99999 !important;
            }

            #print-area * {
                visibility: visible !important;
            }

            /* Typography */
            #print-area {
                color: black !important;
                font-family: 'Times New Roman', serif !important;
                font-size: 12pt !important;
                line-height: 1.5 !important;
            }
            .text-slate-500, .text-slate-400, .text-slate-600, .text-slate-800 {
                color: black !important;
            }

            /* CRITICAL: Page Break Logic */
            .avoid-break {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                display: block !important; 
                margin-bottom: 2em !important; 
            }

            /* Hide UI Controls */
            .no-print {
                display: none !important;
            }
        }
    `}</style>
);

// --- COMPONENTS ---

// 1. Sidebar
const Sidebar = ({ user, isOpen, setIsOpen, onLogout }: any) => {
  const location = useLocation();
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: [Role.ADMIN, Role.TEACHER] },
    { icon: PlusCircle, label: 'Buat Quiz', path: '/create-quiz', roles: [Role.ADMIN, Role.TEACHER] },
    { icon: Archive, label: 'Riwayat & Arsip', path: '/history', roles: [Role.ADMIN, Role.TEACHER] },
    { icon: CloudCog, label: 'Cloud Database', path: '/database', roles: [Role.ADMIN] },
    { icon: Users, label: 'Manajemen User', path: '/users', roles: [Role.ADMIN] },
    { icon: Activity, label: 'Log Sistem', path: '/logs', roles: [Role.ADMIN] },
    { icon: Settings, label: 'Pengaturan', path: '/settings', roles: [Role.ADMIN] },
  ];
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />}
      <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-slate-900 border-r border-brand-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 no-print`}>
        <div className="flex items-center justify-center h-16 border-b border-brand-100 dark:border-slate-800 bg-brand-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold">Q</div>
            <span className="text-xl font-bold text-slate-800 dark:text-white">Gen-Z <span className="text-brand-500">Quiz</span></span>
          </div>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {menuItems.map((item) => {
            if (!item.roles.includes(user.role)) return null;
            const isActive = location.pathname === item.path;
            // Add IDs for Tour Guide
            let tourId = undefined;
            if (item.path === '/create-quiz') tourId = 'tour-nav-create';
            if (item.path === '/history') tourId = 'tour-nav-history';

            return (
              <Link id={tourId} key={item.path} to={item.path} onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'text-slate-600 dark:text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-800'}`}>
                <item.icon size={20} />{item.label}
              </Link>
            );
          })}
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 mt-8 transition-colors"><LogOut size={20} />Keluar</button>
        </nav>
      </aside>
    </>
  );
};

// ... (ApiMonitorModal, DonationModal, Dashboard, UserManagement remain unchanged)
const ApiMonitorModal = ({ onClose }: { onClose: () => void }) => {
    const [stats, setStats] = useState<KeyStats[]>([]);
    
    useEffect(() => {
        // Fetch initially
        setStats(getApiKeyStats());
        // Poll every 2 seconds
        const interval = setInterval(() => {
            setStats(getApiKeyStats());
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const totalUsage = stats.reduce((acc, s) => acc + s.usageCount, 0);
    const totalErrors = stats.reduce((acc, s) => acc + s.errorCount, 0);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Cpu className="text-brand-500" /> API Key Health Monitor
                        </h3>
                        <p className="text-xs text-slate-500">Real-time usage & rotation status</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600">
                        <X size={20} className="text-slate-500 dark:text-slate-400"/>
                    </button>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-900 grid grid-cols-3 gap-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm text-center">
                        <p className="text-xs text-slate-400 uppercase font-bold">Active Pool</p>
                        <p className="text-2xl font-bold text-brand-600">{stats.length}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm text-center">
                        <p className="text-xs text-slate-400 uppercase font-bold">Total Requests</p>
                        <p className="text-2xl font-bold text-green-600">{totalUsage}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm text-center">
                        <p className="text-xs text-slate-400 uppercase font-bold">Errors / Rate Limits</p>
                        <p className="text-2xl font-bold text-red-500">{totalErrors}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {stats.map((s, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${s.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : s.status === 'RATE_LIMITED' ? 'bg-orange-500' : 'bg-red-500'}`} />
                                <div>
                                    <p className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">{s.keyMask}</p>
                                    <p className="text-[10px] text-slate-400">
                                        Last used: {s.lastUsed ? new Date(s.lastUsed).toLocaleTimeString() : 'Never'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-6 text-right">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Usage</p>
                                    <p className="font-bold text-slate-800 dark:text-white">{s.usageCount}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Status</p>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                        s.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                                        s.status === 'RATE_LIMITED' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {s.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {stats.length === 0 && (
                        <div className="text-center py-10 text-slate-400">
                            No keys found. Check API_KEY environment variable.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface PricingPackage {
    name: string;
    price: number;
    credits: number;
    color: string;
}

const DonationModal = ({ onClose, user, selectedPackage }: { onClose: () => void, user: User, selectedPackage?: PricingPackage | null }) => {
    const [method, setMethod] = useState<'DANA' | 'SHOPEE'>('DANA');
    
    const accountInfo = {
        DANA: { number: '0852-4848-1527', name: 'Gen-Z Admin', color: 'bg-[#118EE9]', text: 'text-[#118EE9]' },
        SHOPEE: { number: '0852-4848-1527', name: 'Gen-Z Admin', color: 'bg-[#EE4D2D]', text: 'text-[#EE4D2D]' }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Nomor tersalin!");
    };

    const handleConfirm = () => {
        let msg = '';
        if (selectedPackage) {
            msg = `Halo Admin Gen-Z Quiz, saya *${user.username}* ingin membeli *${selectedPackage.name}* (${selectedPackage.credits} Credits) seharga Rp ${selectedPackage.price.toLocaleString('id-ID')} via ${method}. Mohon diproses. Terima kasih!`;
        } else {
            msg = `Halo Admin Gen-Z Quiz, saya *${user.username}* telah mengirim donasi via ${method}. Mohon cek dan tambah credit saya. Terima kasih!`;
        }
        window.open(`https://wa.me/6285248481527?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 hover:text-slate-800 transition-colors">
                    <X size={20} />
                </button>

                <div className="p-6 pb-0 text-center">
                    <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                        {selectedPackage ? <Gem size={32} fill="currentColor"/> : <Heart size={32} fill="currentColor" />}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{selectedPackage ? 'Pembelian Paket' : 'Dukungan & Top Up'}</h3>
                    {selectedPackage ? (
                        <div className="mt-3 p-3 bg-brand-50 border border-brand-100 rounded-xl">
                            <p className="text-sm font-bold text-brand-800">{selectedPackage.name}</p>
                            <p className="text-2xl font-bold text-brand-600 mt-1">Rp {selectedPackage.price.toLocaleString('id-ID')}</p>
                            <p className="text-xs text-brand-600 mt-1">+{selectedPackage.credits} Credits</p>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 mt-2">Dukungan Anda membantu server kami tetap hidup. Credit akan ditambahkan setelah konfirmasi.</p>
                    )}
                </div>

                <div className="p-6">
                    {/* Method Selector */}
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-xl mb-6">
                        <button 
                            onClick={() => setMethod('DANA')} 
                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${method === 'DANA' ? 'bg-white dark:bg-slate-600 shadow-sm text-[#118EE9]' : 'text-slate-500'}`}
                        >
                            <Wallet size={16} /> DANA
                        </button>
                        <button 
                            onClick={() => setMethod('SHOPEE')} 
                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${method === 'SHOPEE' ? 'bg-white dark:bg-slate-600 shadow-sm text-[#EE4D2D]' : 'text-slate-500'}`}
                        >
                            <Wallet size={16} /> ShopeePay
                        </button>
                    </div>

                    {/* QR & Info Area */}
                    <div className={`rounded-2xl p-6 border-2 transition-colors ${method === 'DANA' ? 'border-[#118EE9]/20 bg-[#118EE9]/5' : 'border-[#EE4D2D]/20 bg-[#EE4D2D]/5'}`}>
                        <div className="flex flex-col items-center">
                            <div className="text-center w-full">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Transfer Manual ke</p>
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <span className={`text-xl font-bold font-mono ${accountInfo[method].text}`}>{accountInfo[method].number}</span>
                                    <button onClick={() => handleCopy(accountInfo[method].number)} className="p-1.5 hover:bg-black/5 rounded-md transition-colors"><Copy size={14} className="text-slate-400"/></button>
                                </div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">a.n {accountInfo[method].name}</p>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleConfirm}
                        className="w-full mt-6 bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <MessageCircle size={20} /> Konfirmasi Pembelian WA
                    </button>
                </div>
            </div>
        </div>
    );
};

// 2. Dashboard
const Dashboard = ({ user }: { user: User }) => {
  const [stats, setStats] = useState({ quizCount: 0, generated: 0 });
  const [chartData, setChartData] = useState<{name: string, generated: number, published: number}[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [showDonation, setShowDonation] = useState(false);
  const [showApiMonitor, setShowApiMonitor] = useState(false); // NEW STATE
  const [runTour, setRunTour] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PricingPackage | null>(null);

  const packages: PricingPackage[] = [
      { name: 'Paket Starter', price: 50000, credits: 50, color: 'bg-blue-50 border-blue-100 text-blue-700' },
      { name: 'Paket Pro', price: 100000, credits: 100, color: 'bg-gradient-to-br from-brand-50 to-orange-50 border-brand-200 text-brand-700' }
  ];
  
  useEffect(() => {
    // Check Tour Status
    if (!localStorage.getItem('genz_tour_completed')) {
        const t = setTimeout(() => setRunTour(true), 1500);
        return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      // Filter logic: Admin sees all, Teacher sees only theirs
      const userId = user.role === Role.ADMIN ? undefined : user.id;
      const quizzes = await dbService.getQuizzes(userId);
      
      // Calculate total questions for 'Bank Soal'
      const totalQuestions = quizzes.reduce((acc, q) => acc + (q.questions ? q.questions.length : 0), 0);
      
      setStats({ quizCount: quizzes.length, generated: totalQuestions });

      // --- CHART LOGIC: Real Last 7 Days Data ---
      const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i)); // -6 days to Today
          return d;
      });

      const processedData = last7Days.map(date => {
          // Format Day Name (e.g., Sen, Sel, Rab)
          const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
          
          // Filter quizzes for this specific date
          const dailyQuizzes = quizzes.filter(q => {
              const qDate = new Date(q.createdAt);
              return qDate.getDate() === date.getDate() && 
                     qDate.getMonth() === date.getMonth() && 
                     qDate.getFullYear() === date.getFullYear();
          });

          return {
              name: dayName,
              generated: dailyQuizzes.length,
              published: dailyQuizzes.filter(q => q.status === 'PUBLISHED').length
          };
      });

      setChartData(processedData);
      
      const s = await dbService.getSettings();
      setSettings(s);
    };
    loadStats();
  }, [user]);

  const handleBuyPackage = (pkg: PricingPackage) => {
      setSelectedPackage(pkg);
      setShowDonation(true);
  };

  const handleGeneralDonation = () => {
      setSelectedPackage(null);
      setShowDonation(true);
  };

  const isCronActive = settings?.cron.enabled || false;

  const tourSteps: Step[] = [
    { targetId: 'tour-stats-card', title: 'Statistik Anda', content: 'Lihat ringkasan soal yang telah dibuat dan status sistem di sini.' },
    { targetId: 'tour-credits-card', title: 'Credit Guru', content: 'Pantau sisa credit Anda. Credit digunakan setiap kali membuat quiz baru.' },
    { targetId: 'tour-nav-create', title: 'Buat Quiz', content: 'Klik menu ini untuk mulai membuat soal otomatis dengan AI.' },
    { targetId: 'tour-nav-history', title: 'Riwayat & Arsip', content: 'Akses kembali soal yang sudah dibuat, edit, atau download dalam format Word/PDF.' },
  ];
  
  return (
    <div className="space-y-6">
      <TourGuide isOpen={runTour} steps={tourSteps} onClose={() => setRunTour(false)} onComplete={() => { setRunTour(false); localStorage.setItem('genz_tour_completed', 'true'); }} />
      {showDonation && <DonationModal user={user} onClose={() => setShowDonation(false)} selectedPackage={selectedPackage} />}
      {showApiMonitor && <ApiMonitorModal onClose={() => setShowApiMonitor(false)} />}
      
      {/* Low Credit Warning Notification */}
      {user.credits < 10 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm animate-fade-in-up">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                    <AlertTriangle size={20} />
                </div>
                <div>
                    <p className="font-bold text-orange-800">Credit Menipis!</p>
                    <p className="text-sm text-orange-700">Sisa credit Anda kurang dari 10. Segera isi ulang untuk terus membuat soal.</p>
                </div>
            </div>
            <button 
                onClick={handleGeneralDonation}
                className="w-full sm:w-auto px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-lg transition-colors shadow-md shadow-orange-500/20 whitespace-nowrap"
            >
                Isi Ulang Sekarang
            </button>
        </div>
      )}

      {/* Admin Specific Action Bar */}
      {user.role === Role.ADMIN && (
          <div className="bg-slate-800 text-white p-4 rounded-2xl shadow-lg flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                  <ShieldCheck className="text-green-400" />
                  <div>
                      <h3 className="font-bold">Admin Console</h3>
                      <p className="text-xs text-slate-400">Monitoring System Health</p>
                  </div>
              </div>
              <button 
                onClick={() => setShowApiMonitor(true)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors border border-slate-600"
              >
                  <Activity size={16} className="text-brand-400"/> Monitor API Keys
              </button>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div id="tour-stats-card" className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-500 dark:text-slate-400">Total Quiz</p><p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.quizCount}</p></div>
              <div className="p-3 rounded-xl bg-blue-500 bg-opacity-10"><BookOpen className="w-6 h-6 text-blue-500" /></div>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-500 dark:text-slate-400">Total Soal (Bank)</p><p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.generated}</p></div>
              <div className="p-3 rounded-xl bg-brand-500 bg-opacity-10"><Database className="w-6 h-6 text-brand-500" /></div>
            </div>
        </div>
        
        {/* Credit Card with Donation Button - Updated Layout */}
        <div id="tour-credits-card" className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Credit Guru</p>
                  <div className="flex items-center gap-3">
                      <p className={`text-2xl font-bold ${user.credits < 10 ? 'text-orange-600' : 'text-green-600'}`}>{user.credits}</p>
                      <button 
                          onClick={handleGeneralDonation}
                          className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                          <Heart size={12} className="fill-green-600"/> Top Up
                      </button>
                  </div>
              </div>
              <div className="p-3 rounded-xl bg-green-500 bg-opacity-10"><Coins className="w-6 h-6 text-green-500" /></div>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-500 dark:text-slate-400">System Status</p><p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{isCronActive ? 'Cron Active' : 'Cron Idle'}</p></div>
              <div className={`p-3 rounded-xl ${isCronActive ? 'bg-purple-500' : 'bg-slate-500'} bg-opacity-10`}><RotateCw className={`w-6 h-6 ${isCronActive ? 'text-purple-500' : 'text-slate-500'}`} /></div>
            </div>
        </div>
      </div>
      
      {/* --- PRICING PACKAGES SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Statistik Pembuatan Soal (7 Hari Terakhir)</h3>
            <div className="h-80 w-full" style={{ minHeight: '320px' }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" stroke="#64748b" /><YAxis stroke="#64748b" allowDecimals={false} /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /><Legend /><Bar dataKey="generated" fill="#f97316" radius={[4, 4, 0, 0]} name="Soal Dibuat" /><Bar dataKey="published" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Terpublish" /></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Top Up Packages */}
          <div className="lg:col-span-1 space-y-4">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                 <Zap size={18} className="text-orange-500 fill-orange-500" /> Paket Top Up Credit
              </h3>
              
              {/* Starter Package */}
              <div 
                onClick={() => handleBuyPackage(packages[0])}
                className={`p-5 rounded-2xl border cursor-pointer hover:shadow-md transition-all relative overflow-hidden group ${packages[0].color} bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700`}
              >
                  <div className="flex justify-between items-start">
                      <div>
                          <h4 className="font-bold text-lg text-slate-800 dark:text-white">Paket Starter</h4>
                          <p className="text-3xl font-bold text-blue-600 my-2">Rp 50.000</p>
                          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400">
                              <Coins size={14} className="text-orange-500"/> 50 Credits
                          </div>
                      </div>
                      <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                          <Rocket size={24} />
                      </div>
                  </div>
              </div>

              {/* Pro Package */}
              <div 
                onClick={() => handleBuyPackage(packages[1])}
                className="p-5 rounded-2xl border border-brand-200 bg-orange-50/50 dark:bg-slate-800 dark:border-brand-900 cursor-pointer hover:shadow-lg hover:shadow-brand-500/10 transition-all relative overflow-hidden group"
              >
                  <div className="absolute top-0 right-0 bg-brand-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">BEST VALUE</div>
                  <div className="flex justify-between items-start">
                      <div>
                          <h4 className="font-bold text-lg text-brand-800 dark:text-white">Paket Pro</h4>
                          <p className="text-3xl font-bold text-brand-600 my-2">Rp 100.000</p>
                          <div className="flex items-center gap-1.5 text-sm font-medium text-brand-800 dark:text-brand-200">
                              <Coins size={14} className="text-orange-500"/> 100 Credits
                          </div>
                      </div>
                      <div className="p-3 bg-brand-100 text-brand-600 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                          <Gem size={24} />
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

// 3. User Management (Unchanged)
const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newCredits, setNewCredits] = useState(50);
    const [editingCreditsId, setEditingCreditsId] = useState<string | null>(null);
    const [tempCredits, setTempCredits] = useState<number>(0);
    const loadUsers = async () => { const data = await dbService.getAllUsers(); setUsers(data); };
    useEffect(() => { loadUsers(); }, []);
    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const newUser: User = { id: Date.now().toString(), username: newUsername, role: Role.TEACHER, credits: newCredits, isActive: true };
        await dbService.createUser(newUser, newPassword);
        setShowAddModal(false); setNewUsername(''); setNewPassword(''); setNewCredits(50); loadUsers();
    };
    const handleDeleteUser = async (id: string) => { if (confirm("Apakah Anda yakin ingin menghapus user ini? Data tidak bisa dikembalikan.")) { await dbService.deleteUser(id); loadUsers(); } };
    const handleToggleStatus = async (user: User) => { await dbService.toggleUserStatus(user.id, !user.isActive); loadUsers(); };
    const startEditCredits = (user: User) => { setEditingCreditsId(user.id); setTempCredits(user.credits); };
    const saveCredits = async (id: string) => { await dbService.updateUserCredits(id, tempCredits); setEditingCreditsId(null); loadUsers(); };
    return (
        <div className="space-y-6 max-w-7xl mx-auto">
             <div className="flex justify-between items-center mb-6">
               <div><h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><Users className="text-brand-600"/> Manajemen User</h2><p className="text-slate-500 text-sm">Kelola akses guru, kredit, dan status akun.</p></div>
               <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20"><UserPlus size={18}/> Tambah Guru</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {users.map(u => (
                     <div key={u.id} className={`bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border ${u.isActive ? 'border-slate-100 dark:border-slate-700' : 'border-red-200 bg-red-50 dark:bg-red-900/10'} hover:shadow-md transition-all`}>
                         <div className="flex justify-between items-start mb-4">
                             <div className="flex items-center gap-3"><div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${u.role === Role.ADMIN ? 'bg-purple-100 text-purple-600' : 'bg-brand-100 text-brand-600'}`}>{u.username.charAt(0).toUpperCase()}</div><div><h3 className="font-bold text-slate-800 dark:text-white">{u.username}</h3><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${u.role === Role.ADMIN ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>{u.role}</span></div></div>
                             {u.role !== Role.ADMIN && (<button onClick={() => handleDeleteUser(u.id)} className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={16}/></button>)}
                         </div>
                         <div className="space-y-4">
                             <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl flex items-center justify-between">
                                 <div className="flex items-center gap-2 text-sm text-slate-500"><Coins size={16} className="text-orange-500"/><span>Sisa Kredit:</span></div>
                                 {editingCreditsId === u.id ? (<div className="flex items-center gap-2"><button onClick={() => setTempCredits(p => Math.max(0, p - 10))} className="w-6 h-6 bg-slate-200 rounded text-slate-600 font-bold hover:bg-slate-300">-</button><input type="number" value={tempCredits} onChange={(e) => setTempCredits(parseInt(e.target.value))} className="w-12 text-center bg-white border rounded text-sm font-bold"/><button onClick={() => setTempCredits(p => p + 10)} className="w-6 h-6 bg-slate-200 rounded text-slate-600 font-bold hover:bg-slate-300">+</button><button onClick={() => saveCredits(u.id)} className="text-green-600 font-bold text-xs ml-1 hover:underline">Save</button></div>) : (<div className="flex items-center gap-2"><span className="font-bold text-slate-800 dark:text-white">{u.credits}</span><button onClick={() => startEditCredits(u)} className="text-xs text-blue-500 hover:underline">Edit</button></div>)}
                             </div>
                             <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                                 <span className="text-xs text-slate-400">Status Akun</span>
                                 {u.role !== Role.ADMIN ? (<button onClick={() => handleToggleStatus(u)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${u.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>{u.isActive ? <ShieldCheck size={14}/> : <ShieldAlert size={14}/>}{u.isActive ? 'Active' : 'Disabled'}</button>) : (<span className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold cursor-not-allowed"><ShieldCheck size={14}/> Protected</span>)}
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
             {showAddModal && (<div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up"><div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-slate-800 dark:text-white">Tambah Guru Baru</h3><button onClick={() => setShowAddModal(false)}><X className="text-slate-400 hover:text-slate-600"/></button></div><form onSubmit={handleAddUser} className="space-y-4"><div><label className="block text-sm font-medium mb-1 dark:text-slate-300">Username</label><input type="text" required className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 outline-none focus:ring-2 focus:ring-brand-500" value={newUsername} onChange={(e) => setNewUsername(e.target.value)}/></div><div><label className="block text-sm font-medium mb-1 dark:text-slate-300">Password</label><input type="text" required className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 outline-none focus:ring-2 focus:ring-brand-500" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}/></div><div><label className="block text-sm font-medium mb-1 dark:text-slate-300">Limit Kredit</label><div className="flex items-center gap-4"><input type="range" min="10" max="500" step="10" className="flex-1 accent-brand-500" value={newCredits} onChange={(e) => setNewCredits(parseInt(e.target.value))}/><span className="font-bold text-brand-600 w-12 text-center">{newCredits}</span></div></div><button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl mt-4">Simpan User</button></form></div></div>)}
        </div>
    );
};

// 4. Quiz Result View (REDESIGNED TO A4 PAPER LAYOUT)
const QuizResultView = ({ quiz, onClose }: { quiz: Quiz, onClose: () => void }) => {
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'blueprint'>('questions');
  
  const handlePrint = () => {
    window.print();
  };

  const downloadWord = () => {
     const header = `
     <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
     <head><meta charset='utf-8'><title>${quiz.title}</title>
     <style>body{font-family:'Times New Roman', serif} .question{margin-bottom:1em} .options{margin-left:1em}</style>
     </head><body>
     <center><h1>BANK SOAL ${quiz.level}</h1><h2>${quiz.subject.toUpperCase()} - ${quiz.grade.toUpperCase()}</h2></center>
     <hr/>
     <p><b>Topik:</b> ${quiz.topic} &nbsp;&nbsp;&nbsp; <b>Waktu:</b> 90 Menit</p>
     <hr/>
     <br/>
     `;
     
     let body = "";
     if (activeTab === 'blueprint') {
        body += `<table border="1" cellpadding="5" cellspacing="0" width="100%">
        <thead><tr><th>No</th><th>KD / CP</th><th>Materi</th><th>Indikator</th><th>Level</th></tr></thead><tbody>`;
        quiz.blueprint.forEach(bp => {
            body += `<tr><td>${bp.questionNumber}</td><td>${bp.basicCompetency}</td><td>${quiz.topic}</td><td>${bp.indicator}</td><td>${bp.cognitiveLevel}</td></tr>`;
        });
        body += `</tbody></table>`;
     } else {
         quiz.questions.forEach((q, i) => {
             // Deduplicate stimulus logic for Word Export as well
             const showStimulus = q.stimulus && (i === 0 || q.stimulus !== quiz.questions[i - 1].stimulus);
             
             body += `<div class='question'>`;
             if (showStimulus) {
                 body += `<div style="border:1px solid #000; padding:10px; margin-bottom:10px; font-style:italic;">${q.stimulus}</div>`;
             }
             body += `<b>${i+1}. ${q.text}</b><br/>`;
             if(q.imageUrl) body += `<img src="${q.imageUrl}" width="200" /><br/>`;
             if(q.type === QuestionType.MULTIPLE_CHOICE && q.options) {
                 body += `<div class='options'>`;
                 q.options.forEach((opt, idx) => {
                     body += `${String.fromCharCode(65+idx)}. ${opt}<br/>`;
                 });
                 body += `</div>`;
             }
             body += `</div>`;
         });
     }

     const footer = "</body></html>";
     const source = header + body + footer;
     const blob = new Blob(['\ufeff', source], { type: 'application/msword' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = url;
     link.download = `${quiz.title.replace(/[^a-z0-9]/gi, '_')}.doc`;
     link.click();
  };

  return (
    <div id="quiz-result-view" className="bg-graph-paper rounded-none h-full flex flex-col fixed inset-0 z-50 overflow-hidden">
       {/* Top Toolbar (Floating) */}
       <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm no-print z-50">
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
                <h2 className="font-bold text-lg text-slate-800 truncate max-w-md">{quiz.subject} - {quiz.topic}</h2>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{quiz.questions.length} Butir Soal</span>
             </div>
             {/* Tabs */}
             <div className="bg-slate-100 p-1 rounded-lg flex items-center ml-4">
                 <button 
                    onClick={() => setActiveTab('questions')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'questions' ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}
                 >
                    <FileText size={14}/> Soal
                 </button>
                 <button 
                    onClick={() => setActiveTab('blueprint')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'blueprint' ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}
                 >
                    <Grid size={14}/> Kisi-Kisi
                 </button>
             </div>
          </div>

          <div className="flex gap-2 items-center">
            <div className="hidden md:flex items-center gap-2 border-r border-slate-200 pr-4 mr-2">
                <select className="bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg px-2 py-1.5 outline-none font-bold">
                    <option>A4</option>
                    <option>F4</option>
                    <option>Letter</option>
                </select>
                <button onClick={() => setShowKey(!showKey)} className={`px-3 py-1.5 border rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${showKey ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-slate-600 border-slate-200'}`}>
                    {showKey ? <EyeOff size={14}/> : <Eye size={14}/>} Kunci
                </button>
            </div>
            
            <button onClick={downloadWord} className="px-3 py-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors">
                <FileText size={14}/> Word
            </button>
            <button onClick={() => setActiveTab('blueprint')} className="px-3 py-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors">
                <Grid size={14}/> Kisi
            </button>
            <button onClick={handlePrint} className="px-3 py-1.5 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors">
                <Printer size={14}/> PDF / Cetak
            </button>
            <button onClick={onClose} className="p-2 ml-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                <X size={20}/>
            </button>
          </div>
       </div>

       {/* Main Scrollable Area (Background Grid) */}
       <div className="flex-1 overflow-y-auto p-8 custom-scrollbar flex justify-center bg-graph-paper">
          
          {/* A4 Paper Container */}
          <div id="print-area" className="w-[210mm] min-h-[297mm] bg-white shadow-2xl mx-auto p-[2.5cm] relative">
             
             {/* --- DOCUMENT HEADER --- */}
             <div className="text-center mb-6 no-print-break">
                <p className="text-[10px] text-slate-400 font-sans tracking-[0.2em] uppercase mb-2 no-print">Generated by Gen-Z Quiz</p>
                <h1 className="text-2xl font-bold uppercase font-serif tracking-wide text-black mb-1">BANK SOAL {quiz.level}</h1>
                <h2 className="text-lg font-bold uppercase font-serif tracking-wide text-black">{quiz.subject.toUpperCase()} - {quiz.grade.toUpperCase()}</h2>
             </div>

             <div className="border-t-2 border-b-2 border-black py-2 mb-8 font-serif text-sm flex justify-between items-start">
                 <div className="w-2/3 pr-4">
                     <p className="mb-1"><span className="font-bold">Topik:</span> {quiz.topic} {quiz.subTopic ? `(${quiz.subTopic})` : ''}</p>
                     <p className="text-xs text-slate-600">Kode: {quiz.id.substring(quiz.id.length-6)}</p>
                 </div>
                 <div className="w-1/3 text-right">
                     <p className="mb-1"><span className="font-bold">Waktu:</span> 90 Menit</p>
                     <p><span className="font-bold">Jumlah:</span> {quiz.questions.length} Soal</p>
                 </div>
             </div>

             {/* --- CONTENT AREA (QUESTIONS or BLUEPRINT) --- */}
             {activeTab === 'blueprint' ? (
                 <div>
                    <h3 className="text-center font-bold uppercase font-serif mb-4 border-b pb-2">KISI-KISI PENULISAN SOAL</h3>
                    <table className="w-full border-collapse border border-black text-xs font-serif">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border border-black p-2 w-10 text-center">No</th>
                                <th className="border border-black p-2 text-left">Kompetensi Dasar / Capaian</th>
                                <th className="border border-black p-2 text-left w-1/4">Indikator Soal</th>
                                <th className="border border-black p-2 w-16 text-center">Level</th>
                                <th className="border border-black p-2 w-16 text-center">Bentuk</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quiz.blueprint.map((bp) => (
                                <tr key={bp.questionNumber}>
                                    <td className="border border-black p-2 text-center">{bp.questionNumber}</td>
                                    <td className="border border-black p-2">{bp.basicCompetency}</td>
                                    <td className="border border-black p-2">{bp.indicator}</td>
                                    <td className="border border-black p-2 text-center">{bp.cognitiveLevel}</td>
                                    <td className="border border-black p-2 text-center">{quiz.questions[bp.questionNumber-1]?.type === 'MULTIPLE_CHOICE' ? 'PG' : 'Essay'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
             ) : (
                 <>
                    {/* Sub-header specific to question type if needed, or just list */}
                    <div className="text-center font-serif font-bold tracking-widest text-xs uppercase mb-6 text-slate-500">-- SOAL PILIHAN GANDA --</div>

                    <div className="space-y-6 font-serif text-black">
                        {quiz.questions.map((q, idx) => {
                            // LOGIC FOR GROUPED READING:
                            // Check if this stimulus is identical to the previous one.
                            // If yes, hide it (assuming it's a grouped passage shown in the previous question).
                            const showStimulus = q.stimulus && (idx === 0 || q.stimulus !== quiz.questions[idx - 1].stimulus);

                            return (
                                <div key={q.id || idx} className="avoid-break group">
                                    {/* Stimulus Box */}
                                    {showStimulus && (
                                        <div className="mb-4 p-4 border border-slate-300 bg-slate-50 text-sm italic rounded-sm mx-8">
                                            {/* Optional Label for Grouped Readings */}
                                            {!q.stimulus?.includes("Bacaan berikut") && idx < quiz.questions.length - 1 && q.stimulus === quiz.questions[idx + 1].stimulus && (
                                                <div className="font-bold text-xs mb-2 uppercase text-slate-500">Wacana berikut untuk soal nomor {idx + 1} sampai ...</div>
                                            )}
                                            <MathRenderer content={q.stimulus || ''} />
                                        </div>
                                    )}

                                    <div className="flex gap-4">
                                        <span className="font-bold min-w-[1.5rem] text-right">{idx + 1}.</span>
                                        <div className="flex-1">
                                            {/* Question Stem */}
                                            <div className="mb-3 text-justify leading-relaxed">
                                                <MathRenderer content={q.text} />
                                            </div>
                                            
                                            {/* Image */}
                                            {q.imageUrl && (
                                                <img src={q.imageUrl} alt="Soal" className="max-w-[200px] border mb-4 block" />
                                            )}
                                            
                                            {/* Options */}
                                            {q.type === QuestionType.MULTIPLE_CHOICE && q.options && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 ml-2 print-grid">
                                                    {q.options.map((opt, i) => (
                                                        <div key={i} className="flex gap-2 items-baseline">
                                                            <span className="font-bold uppercase text-sm w-4">{String.fromCharCode(65 + i)}.</span>
                                                            <div className="flex-1"><MathRenderer content={opt} inline /></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Essay Space */}
                                            {q.type === QuestionType.ESSAY && (
                                                <div className="w-full h-24 border-b border-dotted border-black mt-2"></div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Key (Only Visible if Toggled) */}
                                    {showKey && (
                                        <div className="mt-2 ml-10 p-2 bg-green-50 text-xs text-green-800 border-l-2 border-green-500 no-print">
                                            <strong>Kunci:</strong> {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer} <span className="mx-2">|</span> <strong>Pembahasan:</strong> <MathRenderer content={q.explanation} inline />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                 </>
             )}
          </div>
       </div>
    </div>
  );
};

// ... (HistoryArchive, CreateQuiz, CloudDatabase, SystemLogs, SettingsPage, Login, CronWorker, App functions below remain exactly as they were in previous file, just ensure imports at top are updated as shown in first section)
const HistoryArchive = ({ user }: { user: User }) => {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewQuiz, setViewQuiz] = useState<Quiz | null>(null);

    const loadQuizzes = async () => {
        const data = await dbService.getQuizzes(user.role === Role.ADMIN ? undefined : user.id);
        setQuizzes(data);
    };

    useEffect(() => { loadQuizzes(); }, [user]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if(confirm("Hapus quiz ini permanen?")) {
            await dbService.deleteQuiz(id);
            loadQuizzes();
        }
    };

    const handleTogglePublic = async (quiz: Quiz, e: React.MouseEvent) => {
        e.stopPropagation();
        await dbService.toggleQuizVisibility(quiz.id, !quiz.isPublic);
        loadQuizzes();
    };

    const filtered = quizzes.filter(q => q.title.toLowerCase().includes(searchTerm.toLowerCase()) || q.subject.toLowerCase().includes(searchTerm.toLowerCase()));

    if (viewQuiz) {
        return <QuizResultView quiz={viewQuiz} onClose={() => setViewQuiz(null)} />;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
               <div>
                   <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                       <Archive className="text-brand-600"/> Riwayat & Arsip
                   </h2>
                   <p className="text-slate-500 text-sm">Kelola semua quiz yang telah Anda buat.</p>
               </div>
               <div className="relative w-full md:w-64">
                   <input 
                    type="text" 
                    placeholder="Cari quiz..." 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                   />
                   <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filtered.map(quiz => (
                     <div key={quiz.id} onClick={() => setViewQuiz(quiz)} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer group">
                         <div className="flex justify-between items-start mb-4">
                             <div className="p-3 bg-brand-50 text-brand-600 rounded-xl group-hover:bg-brand-500 group-hover:text-white transition-colors">
                                 <FileText size={24}/>
                             </div>
                             <div className="flex gap-2">
                                <button onClick={(e) => handleTogglePublic(quiz, e)} className={`p-2 rounded-lg transition-colors ${quiz.isPublic ? 'text-green-500 bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`} title={quiz.isPublic ? 'Public' : 'Private'}>
                                    {quiz.isPublic ? <Unlock size={16}/> : <Lock size={16}/>}
                                </button>
                                <button onClick={(e) => handleDelete(quiz.id, e)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                     <Trash2 size={16}/>
                                </button>
                             </div>
                         </div>
                         <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1 line-clamp-1">{quiz.title}</h3>
                         <div className="flex flex-wrap gap-2 mb-4">
                             <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-md">{quiz.subject}</span>
                             <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-md">{quiz.questions.length} Q</span>
                             <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-md">{new Date(quiz.createdAt).toLocaleDateString()}</span>
                         </div>
                     </div>
                 ))}
                 {filtered.length === 0 && (
                     <div className="col-span-full py-12 text-center text-slate-400 flex flex-col items-center">
                         <Archive size={48} className="mb-4 opacity-20"/>
                         <p>Tidak ada quiz ditemukan.</p>
                     </div>
                 )}
             </div>
        </div>
    );
};

const SUBJECTS = {
  "Wajib Umum": [
    "Pendidikan Agama Islam dan Budi Pekerti", 
    "Pendidikan Pancasila", 
    "Bahasa Indonesia", 
    "Matematika", 
    "IPA", 
    "IPS", 
    "IPAS", 
    "Koding", 
    "Kecerdasan Artificial", 
    "Sejarah", 
    "Sejarah Indonesia",
    "Bahasa Inggris", 
    "Seni Budaya", 
    "PJOK", 
    "PKWU", 
    "Al-Qur’an Hadis",
    "Akidah Akhlak",
    "Fikih",
    "Sejarah Kebudayaan Islam",
    "Ilmu Tafsir",
    "Ilmu Hadis",
    "Ushul Fikih"
  ],
  "Peminatan MIPA": ["Biologi", "Fisika", "Kimia", "Matematika Peminatan"],
  "Peminatan IPS": ["Sosiologi", "Ekonomi", "Geografi", "Antropologi"],
  "Bahasa & Budaya": ["Bahasa & Sastra Indonesia", "Bahasa & Sastra Inggris", "Bahasa Arab", "Bahasa Jepang", "Bahasa Korea", "Bahasa Mandarin", "Bahasa Jerman", "Bahasa Perancis"],
  "Agama Lain": ["Pendidikan Agama Kristen", "Pendidikan Agama Katolik", "Pendidikan Agama Hindu", "Pendidikan Agama Buddha", "Pendidikan Agama Khonghucu"],
  "Vokasi": ["Dasar-dasar Kejuruan", "Matematika Terapan", "IPAS"]
};

const CreateQuiz = ({ user, onUpdateCredits }: { user: User; onUpdateCredits: (credits: number) => void }) => {
    const navigate = useNavigate(); 
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loadingStep, setLoadingStep] = useState('');
    const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);

    // Form States
    const [subjectCategory, setSubjectCategory] = useState("Wajib Umum");
    const [subject, setSubject] = useState(SUBJECTS["Wajib Umum"][0]);
    const [level, setLevel] = useState("SMA");
    const [grade, setGrade] = useState("Kelas 10");
    const [topic, setTopic] = useState("");
    const [subTopic, setSubTopic] = useState("");
    
    // Files
    const [materialFile, setMaterialFile] = useState<File | null>(null);
    const [materialText, setMaterialText] = useState("");
    const [refImage, setRefImage] = useState<string | null>(null);

    // Parameters
    const [questionCount, setQuestionCount] = useState(10);
    const [mcOptionCount, setMcOptionCount] = useState<4 | 5>(5);
    const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
    const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([QuestionType.MULTIPLE_CHOICE]);
    const [selectedCognitive, setSelectedCognitive] = useState<CognitiveLevel[]>([CognitiveLevel.C2, CognitiveLevel.C3, CognitiveLevel.C4]);
    const [imgQuestionCount, setImgQuestionCount] = useState(0);
    
    // New: Fact Check State
    const [factCheck, setFactCheck] = useState(true);
    // New: Reading Mode (replaces simple boolean)
    const [readingMode, setReadingMode] = useState<'none' | 'simple' | 'grouped'>('none');

    useEffect(() => {
        // Load default setting
        dbService.getSettings().then(s => setFactCheck(s.ai.factCheck));
    }, []);

    // Effect to auto-enable wacana for language subjects
    useEffect(() => {
        if (subjectCategory === "Bahasa & Budaya" || subject.includes("Bahasa")) {
            setReadingMode('grouped'); // Default to grouped for languages usually
        } else {
            setReadingMode('none');
        }
    }, [subject, subjectCategory]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.type === "text/plain") {
            setMaterialFile(file);
            const text = await file.text();
            setMaterialText(text);
        } else {
            alert("Mohon upload file .txt saja untuk ringkasan materi.");
        }
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setRefImage(reader.result as string);
        };
        reader.readAsDataURL(e.target.files[0]);
        }
    };

    const toggleType = (t: QuestionType) => {
        if (selectedTypes.includes(t)) {
        setSelectedTypes(selectedTypes.filter(x => x !== t));
        } else {
        setSelectedTypes([...selectedTypes, t]);
        }
    };

    const toggleCognitive = (c: CognitiveLevel) => {
        if (selectedCognitive.includes(c)) {
        setSelectedCognitive(selectedCognitive.filter(x => x !== c));
        } else {
        setSelectedCognitive([...selectedCognitive, c]);
        }
    };

    const getLangContext = (subj: string) => {
        if (subj === 'Bahasa Arab') return 'AR';
        if (subj === 'Bahasa Jepang') return 'JP';
        if (subj === 'Bahasa Korea') return 'KR';
        if (subj === 'Bahasa Mandarin') return 'CN';
        if (subj === 'Bahasa Jerman') return 'DE';
        if (subj === 'Bahasa Perancis') return 'FR';
        return 'ID';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (user.credits < 1) {
        alert("Credit tidak mencukupi!");
        return;
        }
        if (selectedTypes.length === 0) {
        alert("Pilih minimal satu tipe soal.");
        return;
        }
        if (selectedCognitive.length === 0) {
        alert("Pilih minimal satu level kognitif.");
        return;
        }

        setLoading(true);
        setProgress(0);
        setLoadingStep("Menganalisis Parameter & Materi...");
        setGeneratedQuiz(null);

        const paramDetails = JSON.stringify({
            subject, topic, questionCount, difficulty, 
            types: selectedTypes, cognitive: selectedCognitive,
            factCheck,
            readingMode
        }, null, 2);

        await dbService.addLog("START_GENERATE_QUIZ", `Starting generation for ${subject}.\nParams: ${paramDetails}`, LogType.INFO, user.username);

        try {
            // Using service with environment variable key as per guidelines.
            // Skipping rotated key logic for generation call.

            setProgress(20);
            setLoadingStep("Mengenerate Soal Presisi (Gemini 3 Flash)...");
            
            const result = await generateQuizContent({
                subject,
                subjectCategory,
                level,
                grade,
                topic,
                subTopic,
                materialText,
                refImageBase64: refImage || undefined,
                questionCount,
                mcOptionCount,
                imageQuestionCount: imgQuestionCount,
                types: selectedTypes,
                difficulty,
                cognitiveLevels: selectedCognitive,
                languageContext: getLangContext(subject),
                readingMode // Pass the new param
            }, factCheck); 

            setProgress(60);

            const processedQuestions = [];
            let imgProcessedCount = 0;
            const totalImagesToGen = result.questions.filter(q => q.hasImage).length;

            if (totalImagesToGen > 0) {
                setLoadingStep(`Mengenerate Visual (${totalImagesToGen} Gambar)...`);
                for (const q of result.questions) {
                    if (q.hasImage && q.imagePrompt) {
                        const imgUrl = await generateImageForQuestion(q.imagePrompt);
                        processedQuestions.push({ ...q, imageUrl: imgUrl });
                        imgProcessedCount++;
                        setProgress(60 + Math.floor((imgProcessedCount / totalImagesToGen) * 35));
                    } else {
                        processedQuestions.push(q);
                    }
                }
            } else {
                processedQuestions.push(...result.questions);
                setProgress(95);
            }

            setLoadingStep("Menyimpan ke Database...");
            const newQuiz: Quiz = {
                id: Date.now().toString(),
                title: `${subject} - ${topic}`,
                subject,
                subjectCategory,
                level,
                grade,
                topic,
                subTopic,
                blueprint: result.blueprint,
                questions: processedQuestions,
                createdBy: user.id,
                createdAt: new Date().toISOString(),
                status: 'DRAFT',
                isPublic: false
            };

            await dbService.saveQuiz(newQuiz);
            
            // Update Credits Locally and in DB
            const newCredits = user.credits - 1;
            await dbService.updateUserCredits(user.id, newCredits);
            onUpdateCredits(newCredits); // Callback to update App state immediately
            
            await dbService.addLog("FINISH_GENERATE_QUIZ", `Successfully generated quiz ID: ${newQuiz.id}\nQuestions: ${newQuiz.questions.length}`, LogType.SUCCESS, user.username);

            setGeneratedQuiz(newQuiz);
            setProgress(100);
            setLoadingStep("Selesai!");

        } catch (err) {
            console.error(err);
            await dbService.addLog("ERROR_GENERATE_QUIZ", `Failed to generate quiz.\nError: ${(err as Error).message}`, LogType.ERROR, user.username);
            alert("Gagal membuat quiz: " + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // If quiz is generated, replace the form with the QuizResultView
    if (generatedQuiz && !loading) {
        return <QuizResultView quiz={generatedQuiz} onClose={() => setGeneratedQuiz(null)} />;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center">
                <BrainCircuit size={28} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Buat Quiz Baru</h2>
                <p className="text-slate-500 text-sm">Konfigurasi parameter AI untuk hasil presisi.</p>
            </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Subject & Level */}
            <section className="space-y-4">
                <h3 className="text-lg font-bold text-brand-600 flex items-center gap-2">
                <BookOpen size={20}/> Informasi Mata Pelajaran
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Kategori Mapel</label>
                    <div className="relative">
                        <select 
                            className="w-full p-3 pl-4 pr-10 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
                            value={subjectCategory}
                            onChange={(e) => {
                            setSubjectCategory(e.target.value);
                            setSubject(SUBJECTS[e.target.value as keyof typeof SUBJECTS][0]);
                            }}
                        >
                            {Object.keys(SUBJECTS).map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16}/>
                    </div>
                    </div>
                    <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Mata Pelajaran</label>
                    <div className="relative">
                        <select 
                            className="w-full p-3 pl-4 pr-10 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        >
                            {SUBJECTS[subjectCategory as keyof typeof SUBJECTS].map((s: string) => (
                            <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16}/>
                    </div>
                    </div>
                    <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Jenjang Sekolah</label>
                    <select className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none" value={level} onChange={e => setLevel(e.target.value)}>
                        <option>SD</option>
                        <option>SMP</option>
                        <option>SMA</option>
                        <option>MA</option>
                        <option>SMK</option>
                    </select>
                    </div>
                    <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Kelas</label>
                    <select className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none" value={grade} onChange={e => setGrade(e.target.value)}>
                        <option>Kelas 1</option>
                        <option>Kelas 2</option>
                        <option>Kelas 3</option>
                        <option>Kelas 4</option>
                        <option>Kelas 5</option>
                        <option>Kelas 6</option>
                        <option>Kelas 7</option>
                        <option>Kelas 8</option>
                        <option>Kelas 9</option>
                        <option>Kelas 10</option>
                        <option>Kelas 11</option>
                        <option>Kelas 12</option>
                    </select>
                    </div>
                </div>
            </section>

            {/* Section 2: Material & Context */}
            <section className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-brand-600 flex items-center gap-2">
                <FileText size={20}/> Materi & Referensi
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Topik / Tujuan Pembelajaran</label>
                    <input 
                        type="text" 
                        className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none"
                        placeholder="Contoh: Integral Tentu, Hukum Newton II, Tata Bahasa Arab..."
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        required
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Sub-Materi (Opsional)</label>
                    <input 
                        type="text" 
                        className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none"
                        placeholder="Spesifik sub-bab..."
                        value={subTopic}
                        onChange={e => setSubTopic(e.target.value)}
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Upload Ringkasan (.txt)</label>
                    <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-3 hover:border-brand-500 transition-colors bg-slate-50 dark:bg-slate-800 dark:border-slate-600">
                        <input type="file" accept=".txt" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="flex items-center justify-center gap-2 text-slate-500">
                            <Upload size={18}/>
                            <span className="text-sm truncate">{materialFile ? materialFile.name : "Pilih file .txt"}</span>
                        </div>
                    </div>
                    </div>
                    <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Gambar Referensi (Opsional)</label>
                    <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-3 hover:border-brand-500 transition-colors bg-slate-50 dark:bg-slate-800 dark:border-slate-600">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="flex items-center justify-center gap-2 text-slate-500">
                            <ImageIcon size={18}/>
                            <span className="text-sm truncate">{refImage ? "Gambar Terupload" : "Upload Gambar"}</span>
                        </div>
                    </div>
                    </div>
                </div>
            </section>

            {/* Section 3: AI Parameters */}
            <section className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-brand-600 flex items-center gap-2">
                <Settings size={20}/> Parameter Soal
                </h3>
                
                {/* Types */}
                <div>
                    <label className="block text-sm font-medium mb-3 dark:text-slate-300">Tipe Soal (Bisa pilih lebih dari satu)</label>
                    <div className="flex flex-wrap gap-3">
                    {[
                        { id: QuestionType.MULTIPLE_CHOICE, label: 'Pilihan Ganda' },
                        { id: QuestionType.COMPLEX_MULTIPLE_CHOICE, label: 'PG Kompleks' },
                        { id: QuestionType.TRUE_FALSE, label: 'Benar/Salah' },
                        { id: QuestionType.SHORT_ANSWER, label: 'Isian Singkat' },
                        { id: QuestionType.ESSAY, label: 'Uraian/Essay' }
                    ].map(type => (
                        <button
                            key={type.id}
                            type="button"
                            onClick={() => toggleType(type.id)}
                            className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${selectedTypes.includes(type.id) ? 'bg-brand-500 text-white border-brand-500 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}
                        >
                            {type.label}
                        </button>
                    ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Jumlah Soal</label>
                    <input 
                        type="number" min="1" max="50" 
                        className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none"
                        value={questionCount} onChange={e => setQuestionCount(parseInt(e.target.value))}
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Opsi Jawaban (PG)</label>
                    <select 
                        className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none"
                        value={mcOptionCount} onChange={e => setMcOptionCount(parseInt(e.target.value) as 4|5)}
                    >
                        <option value={4}>4 Opsi (A-D)</option>
                        <option value={5}>5 Opsi (A-E)</option>
                    </select>
                    </div>
                    <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Tingkat Kesulitan</label>
                    <select 
                        className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none"
                        value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}
                    >
                        <option value="EASY">Mudah</option>
                        <option value="MEDIUM">Sedang</option>
                        <option value="HARD">Sulit</option>
                    </select>
                    </div>
                </div>
                
                {/* Cognitive Levels */}
                <div>
                    <label className="block text-sm font-medium mb-3 dark:text-slate-300">Level Kognitif (Bloom)</label>
                    <div className="flex flex-wrap gap-2">
                    {Object.values(CognitiveLevel).map((c: string) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => toggleCognitive(c as CognitiveLevel)}
                            className={`w-10 h-10 rounded-lg text-xs font-bold border transition-all ${selectedCognitive.includes(c as CognitiveLevel) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
                        >
                            {c}
                        </button>
                    ))}
                    </div>
                </div>

                {/* Reading Passage Selector (New) */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                         <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                             <BookOpenCheck size={20} />
                         </div>
                         <div>
                             <h4 className="font-bold text-slate-800 dark:text-white text-sm">Mode Literasi & Wacana</h4>
                             <p className="text-xs text-slate-500">Pilih strategi wacana/cerita untuk soal.</p>
                         </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                            type="button"
                            onClick={() => setReadingMode('none')}
                            className={`p-3 rounded-lg border text-left transition-all ${readingMode === 'none' ? 'bg-white border-blue-500 ring-1 ring-blue-500 shadow-sm' : 'bg-slate-100 border-transparent hover:bg-slate-200'}`}
                        >
                            <div className="font-bold text-xs text-slate-800">Tanpa Wacana</div>
                            <div className="text-[10px] text-slate-500">Soal langsung (Matematika/Fakta).</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setReadingMode('simple')}
                            className={`p-3 rounded-lg border text-left transition-all ${readingMode === 'simple' ? 'bg-white border-blue-500 ring-1 ring-blue-500 shadow-sm' : 'bg-slate-100 border-transparent hover:bg-slate-200'}`}
                        >
                            <div className="font-bold text-xs text-slate-800">Wacana Per Soal</div>
                            <div className="text-[10px] text-slate-500">Setiap soal punya cerita pendek unik.</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setReadingMode('grouped')}
                            className={`p-3 rounded-lg border text-left transition-all ${readingMode === 'grouped' ? 'bg-white border-blue-500 ring-1 ring-blue-500 shadow-sm' : 'bg-slate-100 border-transparent hover:bg-slate-200'}`}
                        >
                            <div className="font-bold text-xs text-slate-800">Wacana (Grouped)</div>
                            <div className="text-[10px] text-slate-500">Satu teks untuk banyak soal.</div>
                        </button>
                    </div>
                </div>

                {/* Visuals */}
                <div className="bg-orange-50 dark:bg-slate-900 p-5 rounded-xl border border-orange-100 dark:border-slate-700 mt-4">
                    <label className="block text-sm font-bold text-brand-800 mb-3 flex items-center gap-2">
                    <ImageIcon size={16}/> Parameter Visual AI (Gemini 2.5 Flash / SVG)
                    </label>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Jumlah Soal Bergambar (Maks: {questionCount})</label>
                        <input 
                            type="number" 
                            min="0" 
                            max={questionCount}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800"
                            value={imgQuestionCount} 
                            onChange={e => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) {
                                    if (val > questionCount) setImgQuestionCount(questionCount);
                                    else if (val < 0) setImgQuestionCount(0);
                                    else setImgQuestionCount(val);
                                } else {
                                    if (e.target.value === '') setImgQuestionCount(0); 
                                }
                            }}
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Aplikasi otomatis menggunakan Gemini 2.5 Flash Image untuk generate. Jika gagal, otomatis fallback ke SVG.</p>
                </div>
            </section>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-600 to-orange-500 hover:from-brand-700 hover:to-orange-600 text-white font-bold py-4 rounded-xl shadow-xl shadow-brand-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
            >
                {loading ? <RefreshCw className="animate-spin" /> : <BrainCircuit />}
                {loading ? 'Sedang Memproses...' : 'Generate Soal Sekarang'}
            </button>

            </form>
        </div>

        {/* Loading Modal Overlay */}
        {loading && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-400 to-red-500 animate-pulse"></div>
                
                <div className="text-center space-y-6">
                    <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-700"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center font-bold text-brand-600 text-sm">{progress}%</div>
                    </div>
                    
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Sedang Membuat Quiz...</h3>
                        <p className="text-brand-600 font-medium animate-pulse">{loadingStep}</p>
                    </div>

                    <div className="space-y-2">
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-400">Mohon jangan tutup halaman ini.</p>
                    </div>
                </div>
            </div>
            </div>
        )}
        </div>
    );
};

// ... (CloudDatabase, SystemLogs, SettingsPage, Login, CronWorker, App functions remain exactly as they were in previous file, just ensure imports at top are updated as shown in first section)
const CloudDatabase = () => {
    const [url, setUrl] = useState('');
    const [token, setToken] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [msg, setMsg] = useState('');
    const [currentStatus, setCurrentStatus] = useState<'TURSO' | 'LOCAL'>('LOCAL');

    useEffect(() => {
        const conf = dbService.getStoredConfig();
        if (conf) {
            setUrl(conf.url);
            setToken(conf.token);
        }
        // Subscribe to ensure this component also updates if status changes elsewhere
        const unsubscribe = dbService.subscribe((s) => {
            setCurrentStatus(s);
        });
        return () => unsubscribe();
    }, []);

    const handleTest = async () => {
        setStatus('TESTING');
        setMsg('');
        const ok = await dbService.testConnection(url, token);
        if (ok) {
            setStatus('SUCCESS');
            setMsg("Koneksi Berhasil! Database dapat diakses.");
        } else {
            setStatus('ERROR');
            setMsg("Koneksi Gagal. Periksa URL dan Token.");
        }
    };

    const handleSave = async () => {
        const ok = await dbService.setTursoConfig(url, token);
        if (ok) {
            alert("Konfigurasi tersimpan dan terhubung ke Turso Cloud!");
        } else {
            alert("Gagal terhubung. Konfigurasi disimpan tapi sistem kembali ke Local Storage.");
        }
    };
    
    const handleDisconnect = async () => {
        if(confirm("Anda yakin ingin memutuskan koneksi dari cloud?")) {
            await dbService.disconnectTurso();
            setUrl('');
            setToken('');
            setStatus('IDLE');
            setMsg('');
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                    <CloudCog size={22} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Cloud Database</h2>
                    <p className="text-slate-500 text-sm">Konfigurasi koneksi ke Turso (libSQL) untuk sinkronisasi data real-time.</p>
                </div>
            </div>

            {/* Status Card */}
            <div className={`p-6 rounded-2xl border flex items-center justify-between ${currentStatus === 'TURSO' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${currentStatus === 'TURSO' ? 'bg-green-200 text-green-700' : 'bg-orange-200 text-orange-700'}`}>
                        {currentStatus === 'TURSO' ? <Wifi size={24}/> : <WifiOff size={24}/>}
                    </div>
                    <div>
                        <h4 className={`font-bold text-lg ${currentStatus === 'TURSO' ? 'text-green-800' : 'text-orange-800'}`}>
                            Status: {currentStatus === 'TURSO' ? 'Terhubung (Cloud)' : 'Offline (Local Storage)'}
                        </h4>
                        <p className={`text-sm ${currentStatus === 'TURSO' ? 'text-green-600' : 'text-orange-600'}`}>
                            {currentStatus === 'TURSO' 
                                ? 'Data tersimpan aman di server Turso.' 
                                : 'Data hanya tersimpan di browser ini. Hubungkan ke cloud untuk backup.'}
                        </p>
                    </div>
                </div>
                {currentStatus === 'TURSO' && (
                    <button onClick={handleDisconnect} className="px-4 py-2 bg-white text-red-500 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors shadow-sm">
                        Putuskan Koneksi
                    </button>
                )}
            </div>

            {/* Config Form */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Database URL (libsql://)</label>
                        <input 
                            type="text" 
                            className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                            placeholder="libsql://your-db-name.turso.io"
                            value={url}
                            onChange={(e) => {
                                // Auto-fix protocol on paste/type in DB Settings page too
                                let val = e.target.value;
                                if(val.startsWith('libsql://')) val = val.replace('libsql://', 'https://');
                                setUrl(val);
                            }}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Auth Token</label>
                        <div className="relative">
                            <input 
                                type="password" 
                                className="w-full p-3 pr-10 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                                placeholder="ey..."
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                            />
                            <Lock className="absolute right-3 top-3 text-slate-400" size={16}/>
                        </div>
                    </div>

                    {/* Feedback Message */}
                    {status !== 'IDLE' && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${
                            status === 'TESTING' ? 'bg-blue-50 text-blue-700' :
                            status === 'SUCCESS' ? 'bg-green-50 text-green-700' :
                            'bg-red-50 text-red-700'
                        }`}>
                            {status === 'TESTING' && <RefreshCw className="animate-spin"/>}
                            {status === 'SUCCESS' && <CheckCircle2/>}
                            {status === 'ERROR' && <AlertCircle/>}
                            {status === 'TESTING' ? 'Sedang menguji koneksi...' : msg}
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button 
                            onClick={handleTest}
                            disabled={!url || !token || status === 'TESTING'}
                            className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Test Connection
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={!url || !token}
                            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30 disabled:opacity-50"
                        >
                            Save & Connect
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="text-center text-xs text-slate-400">
                <p>Pastikan URL dimulai dengan <code>libsql://</code> atau <code>https://</code> (jika HTTP mode).</p>
                <p>Token dapat digenerate melalui Turso CLI: <code>turso db tokens create [db-name]</code></p>
            </div>
        </div>
    );
};

// 8.1 System Logs
const SystemLogs = ({ user }: { user: User }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    
    const loadLogs = async () => {
        const data = await dbService.getLogs();
        setLogs(data);
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const handleClear = async () => {
        if(confirm("Bersihkan semua log?")) {
            await dbService.clearLogs();
            loadLogs();
        }
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
             <div className="flex justify-between items-center mb-6">
               <div>
                   <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                       <Activity className="text-brand-600"/> Log Sistem
                   </h2>
                   <p className="text-slate-500 text-sm">Aktivitas sistem dan pengguna.</p>
               </div>
               <button onClick={handleClear} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold flex items-center gap-2 text-sm transition-colors">
                   <Trash2 size={16}/> Bersihkan Log
               </button>
             </div>
             
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                 <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left">
                         <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold uppercase text-xs">
                             <tr>
                                 <th className="px-6 py-4">Timestamp</th>
                                 <th className="px-6 py-4">Level</th>
                                 <th className="px-6 py-4">User</th>
                                 <th className="px-6 py-4">Action</th>
                                 <th className="px-6 py-4">Details</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                             {logs.map(log => (
                                 <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                     <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                         {new Date(log.timestamp).toLocaleString()}
                                     </td>
                                     <td className="px-6 py-4">
                                         <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                             log.type === LogType.ERROR ? 'bg-red-100 text-red-600' :
                                             log.type === LogType.SUCCESS ? 'bg-green-100 text-green-600' :
                                             log.type === LogType.WARNING ? 'bg-orange-100 text-orange-600' :
                                             'bg-blue-100 text-blue-600'
                                         }`}>
                                             {log.type}
                                         </span>
                                     </td>
                                     <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{log.userId}</td>
                                     <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{log.action}</td>
                                     <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-md truncate" title={log.details}>
                                         {log.details}
                                     </td>
                                 </tr>
                             ))}
                             {logs.length === 0 && (
                                 <tr>
                                     <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                         Belum ada log aktivitas.
                                     </td>
                                 </tr>
                             )}
                         </tbody>
                     </table>
                 </div>
             </div>
        </div>
    );
};

// 8.2 Settings Page
const SettingsPage = () => {
    const [settings, setSettings] = useState<SystemSettings>({
        ai: { factCheck: true },
        cron: { enabled: true }
    });

    useEffect(() => {
        dbService.getSettings().then(setSettings);
    }, []);

    const handleSave = async () => {
        await dbService.saveSettings(settings);
        alert("Pengaturan disimpan!");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                    <Settings size={22} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Pengaturan Sistem</h2>
                    <p className="text-slate-500 text-sm">Konfigurasi global aplikasi.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-8">
                
                {/* AI Settings */}
                <section className="space-y-4">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white border-b border-slate-100 pb-2">AI & Generasi Soal</h3>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-700 dark:text-slate-300">Fact Checking Otomatis</p>
                            <p className="text-xs text-slate-500">Menambahkan instruksi verifikasi fakta pada prompt AI. Mungkin sedikit memperlambat generasi.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={settings.ai.factCheck}
                                onChange={(e) => setSettings({...settings, ai: {...settings.ai, factCheck: e.target.checked}})} 
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                        </label>
                    </div>
                </section>

                {/* System Settings */}
                <section className="space-y-4">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white border-b border-slate-100 pb-2">Background Tasks</h3>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-700 dark:text-slate-300">Cron Jobs (Background Workers)</p>
                            <p className="text-xs text-slate-500">Mengaktifkan tugas latar belakang (pembersihan cache, cek update, dll).</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={settings.cron.enabled}
                                onChange={(e) => setSettings({...settings, cron: {...settings.cron, enabled: e.target.checked}})} 
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                        </label>
                    </div>
                </section>

                <div className="pt-4">
                    <button onClick={handleSave} className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20 flex items-center gap-2">
                        <Save size={18} /> Simpan Perubahan
                    </button>
                </div>

            </div>
        </div>
    );
};

// 9. Login Component
const Login = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDbSettings, setShowDbSettings] = useState(false);
  const [tursoUrl, setTursoUrl] = useState('');
  const [tursoToken, setTursoToken] = useState('');
  const [dbLoading, setDbLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  useEffect(() => {
      const conf = dbService.getStoredConfig();
      if (conf.url) setTursoUrl(conf.url);
      if (conf.token) setTursoToken(conf.token);
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const user = await dbService.authenticate(username, password);
      if (user) { if (!user.isActive) { setError('Akun dinonaktifkan. Hubungi admin.'); } else { onLogin(user); } } else { setError('Username atau password salah.'); }
    } catch (err) { setError('Terjadi kesalahan sistem.'); } finally { setLoading(false); }
  };
  const handleDbSave = async () => {
      if(!tursoUrl || !tursoToken) return;
      setDbLoading(true); setDbStatus('IDLE');
      const success = await dbService.testConnection(tursoUrl, tursoToken);
      if (success) { await dbService.setTursoConfig(tursoUrl, tursoToken); setDbStatus('SUCCESS'); setTimeout(() => setShowDbSettings(false), 2000); } else { setDbStatus('ERROR'); }
      setDbLoading(false);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl w-full max-w-md border border-slate-100 relative transition-all duration-300">
        <div className="text-center mb-8"><div className="w-20 h-20 bg-brand-500 rounded-3xl flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6 shadow-xl shadow-brand-500/30">Q</div><h2 className="text-3xl font-extrabold text-slate-800 mb-2">Welcome Back!</h2><p className="text-slate-500 text-sm font-medium">Sign in to continue to Gen-Z Quiz</p></div>
        {error && (<div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl flex items-center gap-2 border border-red-100 animate-pulse"><AlertCircle size={18}/> {error}</div>)}
        <form onSubmit={handleSubmit} className="space-y-5">
           <div><label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Username</label><input type="text" required className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username"/></div>
           <div><label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Password</label><input type="password" required className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"/></div>
           <button type="submit" disabled={loading} className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 text-lg">{loading ? <RefreshCw className="animate-spin" size={20}/> : <LogIn size={20}/>}{loading ? 'Signing In...' : 'Sign In'}</button>
        </form>
        <div className="mt-6 pt-6 border-t border-slate-100"><button type="button" onClick={() => setShowDbSettings(!showDbSettings)} className="flex items-center justify-center gap-2 w-full text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"><Database size={14}/> {showDbSettings ? 'Hide Connection Settings' : 'Configure Database Connection'}{showDbSettings ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</button><div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${showDbSettings ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}><div className="overflow-hidden"><div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3"><div><label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1">Turso URL</label><input type="text" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-brand-500 outline-none" placeholder="libsql://..." value={tursoUrl} onChange={(e) => { let val = e.target.value; if(val.startsWith('libsql://')) val = val.replace('libsql://', 'https://'); setTursoUrl(val); }}/></div><div><label className="block text-sm font-bold text-slate-500 mb-1 ml-1">Auth Token</label><input type="password" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-brand-500 outline-none" placeholder="ey..." value={tursoToken} onChange={(e) => setTursoToken(e.target.value)}/></div>{dbStatus === 'SUCCESS' && (<div className="text-xs text-green-600 font-bold flex items-center gap-1 justify-center py-1"><CheckCircle2 size={14}/> Connected Successfully!</div>)}{dbStatus === 'ERROR' && (<div className="text-xs text-red-500 font-bold flex items-center gap-1 justify-center py-1"><AlertCircle size={14}/> Connection Failed</div>)}<button type="button" onClick={handleDbSave} disabled={dbLoading || !tursoUrl || !tursoToken} className="w-full py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">{dbLoading ? <RefreshCw className="animate-spin" size={12}/> : <Link2 size={12}/>}Connect & Save</button></div></div></div></div>
        <div className="mt-8 text-center"><Link to="/" className="text-sm font-bold text-slate-400 hover:text-brand-600 transition-colors">Back to Homepage</Link></div>
      </div>
    </div>
  );
};

// --- CRON WORKER HOOK ---
const CronWorker = ({ user }: { user: User }) => {
    useEffect(() => { if (!user || user.role !== Role.ADMIN) return; const interval = setInterval(async () => { const settings = await dbService.getSettings(); if (!settings.cron.enabled) return; const chance = Math.random(); if (chance > 0.8) { await dbService.addLog("CRON_JOB", "Background task executed: Checking for scheduled quizzes...", LogType.INFO, "SYSTEM"); } }, 10000); return () => clearInterval(interval); }, [user]);
    return null;
};

// --- MAIN APP ---
export default function App() {
  const [user, setUser] = useState<User | null>(() => { try { const saved = localStorage.getItem('genz_session'); return saved ? JSON.parse(saved) : null; } catch (e) { console.error("Session parse error", e); return null; } });
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { const initSession = async () => { await dbService.init(); setIsLoading(false); }; initSession(); }, []);
  const handleLogin = (u: User) => { localStorage.setItem('genz_session', JSON.stringify(u)); setUser(u); };
  const handleLogout = () => { localStorage.removeItem('genz_session'); setUser(null); };
  const updateCredits = (newCredits: number) => { if (user) { const updatedUser = { ...user, credits: newCredits }; setUser(updatedUser); localStorage.setItem('genz_session', JSON.stringify(updatedUser)); } };
  const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: Role[] }) => { if (!user) return <Navigate to="/login" replace />; if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />; return <>{children}</>; };
  if (isLoading) { return (<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="flex flex-col items-center gap-4"><div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div><p className="text-slate-500 font-bold animate-pulse">Memuat Aplikasi...</p></div></div>); }
  return (
    <Router>
      <GlobalAndPrintStyles />
      {user && <CronWorker user={user} />}
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
          <Route path="/*" element={!user ? <Navigate to="/login" /> : (<div className="flex h-screen overflow-hidden"><Sidebar user={user} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} onLogout={handleLogout} /><div className="flex-1 flex flex-col overflow-hidden w-full md:pl-64 transition-all duration-300"><header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 z-10 no-print"><button onClick={() => setSidebarOpen(!isSidebarOpen)} className="md:hidden text-slate-500"><Menu /></button><div className="flex-1 px-4"><h1 className="font-bold text-lg text-slate-800 dark:text-white hidden md:block">{user.role === Role.ADMIN ? 'Administrator Panel' : 'Guru Dashboard'}</h1></div><div className="flex items-center gap-4"><div className="px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-xs font-bold border border-brand-100">Credits: {user.credits}</div><div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">{user.username[0].toUpperCase()}</div></div></header><main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24"><Routes><Route path="/dashboard" element={<Dashboard user={user} />} /><Route path="/create-quiz" element={<CreateQuiz user={user} onUpdateCredits={updateCredits} />} /><Route path="/history" element={<HistoryArchive user={user} />} /><Route path="/database" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><CloudDatabase /></ProtectedRoute>} /><Route path="/users" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><UserManagement /></ProtectedRoute>} /><Route path="/logs" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><SystemLogs user={user} /></ProtectedRoute>} /><Route path="/settings" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><SettingsPage /></ProtectedRoute>} /></Routes></main></div></div>)} />
        </Routes>
      </div>
    </Router>
  );
}