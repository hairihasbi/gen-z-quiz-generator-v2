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
  Grid,
  Globe,
  KeyRound,
  Edit,
  User
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

import { Role, User as UserType, Quiz, QuestionType, Difficulty, Question, CognitiveLevel, QuizGenerationParams, Blueprint, LogEntry, LogType, SystemSettings, PricingPackage } from './types';
import { generateQuizContent, generateImageForQuestion, validateGeminiConnection, getApiKeyStats, KeyStats } from './services/geminiService';
import { dbService } from './services/dbService';
import MathRenderer from './components/MathRenderer';
import Homepage from './components/Homepage';
import TourGuide, { Step } from './components/TourGuide';

// --- STYLES FOR PRINTING & MATH ALIGNMENT ---
const GlobalAndPrintStyles = () => (
    <style>{`
        mjx-container { display: inline-block !important; margin: 0 2px !important; vertical-align: middle !important; }
        mjx-container > svg { display: inline-block !important; vertical-align: middle !important; margin: 0 !important; }
        .mjx-chtml { font-size: 100% !important; }
        .bg-graph-paper {
            background-color: #e5e7eb;
            background-image: linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px);
            background-size: 20px 20px;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        @media print {
            @page { margin: 0; size: auto; }
            body { visibility: hidden !important; background: white !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            html, body, #root, #quiz-result-view, .transform, .fixed, .absolute, .relative, .overflow-hidden, .overflow-auto, .h-full, .w-full { position: static !important; transform: none !important; transition: none !important; overflow: visible !important; height: auto !important; width: auto !important; }
            #print-area { visibility: visible !important; position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 15mm 20mm !important; background: white !important; box-shadow: none !important; border: none !important; z-index: 99999 !important; }
            #print-area * { visibility: visible !important; }
            #print-area { color: black !important; font-family: 'Times New Roman', serif !important; font-size: 12pt !important; line-height: 1.5 !important; }
            .text-slate-500, .text-slate-400, .text-slate-600, .text-slate-800 { color: black !important; }
            .avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; display: block !important; margin-bottom: 2em !important; }
            .no-print { display: none !important; }
        }
    `}</style>
);

// --- COMPONENTS ---

const Sidebar = ({ user, isOpen, setIsOpen, onLogout, onOpenKeyManager }: any) => {
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
            return (
              <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'text-slate-600 dark:text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-800'}`}>
                <item.icon size={20} />{item.label}
              </Link>
            );
          })}
          {user.role === Role.TEACHER && (
             <button onClick={() => { setIsOpen(false); onOpenKeyManager(); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-800 transition-colors font-medium">
                 <KeyRound size={20} />Kunci API Saya
             </button>
          )}
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 mt-8 transition-colors"><LogOut size={20} />Keluar</button>
        </nav>
      </aside>
    </>
  );
};

const UserKeyManagerModal = ({ user, onClose, onUpdateKeys }: { user: UserType, onClose: () => void, onUpdateKeys: (keys: string[]) => void }) => {
    const [keys, setKeys] = useState<string[]>(user.apiKeys || []);
    const [newKey, setNewKey] = useState('');
    const [loading, setLoading] = useState(false);
    const addKey = async () => {
        if (!newKey.trim()) return;
        setLoading(true);
        if (!newKey.startsWith('AIza') || newKey.length < 20) { alert("Format API Key sepertinya salah. Harus dimulai dengan 'AIza'."); setLoading(false); return; }
        const updatedKeys = [...keys, newKey.trim()];
        try { await dbService.updateUserApiKeys(user.id, updatedKeys); setKeys(updatedKeys); onUpdateKeys(updatedKeys); setNewKey(''); } catch (e) { alert("Gagal menyimpan key."); } finally { setLoading(false); }
    };
    const removeKey = async (index: number) => { if(!confirm("Hapus key ini?")) return; const updatedKeys = keys.filter((_, i) => i !== index); await dbService.updateUserApiKeys(user.id, updatedKeys); setKeys(updatedKeys); onUpdateKeys(updatedKeys); };
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <div><h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><KeyRound className="text-brand-500" /> Kunci API Saya</h3><p className="text-xs text-slate-500">Kelola Gemini API Key pribadi Anda.</p></div>
                    <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200"><X size={20} className="text-slate-500"/></button>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-900">
                    <div className="space-y-3 mb-6">
                        {keys.map((k, idx) => (<div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"><div className="flex items-center gap-3 overflow-hidden"><div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs">{idx + 1}</div><div className="font-mono text-sm text-slate-600 dark:text-slate-300 truncate">...{k.slice(-8)}</div></div><button onClick={() => removeKey(idx)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button></div>))}
                        {keys.length === 0 && (<div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">Belum ada key tersimpan. Menggunakan key Admin.</div>)}
                    </div>
                    <div className="flex gap-2"><input type="text" className="flex-1 p-3 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none text-sm" placeholder="Paste API Key (AIza...)" value={newKey} onChange={(e) => setNewKey(e.target.value)} /><button onClick={addKey} disabled={!newKey || loading} className="bg-brand-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 transition-colors">{loading ? <RefreshCw className="animate-spin" size={20}/> : <Plus size={20}/>}</button></div>
                </div>
            </div>
        </div>
    );
};

const QuizResultView = ({ quiz, onClose }: { quiz: Quiz, onClose: () => void }) => {
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'blueprint'>('questions');
  
  const handlePrint = (withKey: boolean) => { 
      setShowKey(withKey); 
      // Delay printing slightly to ensure answer keys are rendered in the DOM
      setTimeout(() => { 
          window.print(); 
      }, 500); 
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
      switch (type) { case QuestionType.MULTIPLE_CHOICE: return 'Pilihan Ganda'; case QuestionType.COMPLEX_MULTIPLE_CHOICE: return 'Pilihan Ganda Kompleks'; case QuestionType.TRUE_FALSE: return 'Benar / Salah'; case QuestionType.SHORT_ANSWER: return 'Isian Singkat'; case QuestionType.ESSAY: return 'Uraian'; default: return 'Soal'; }
  };
  const downloadWord = () => {
     let body = "";
     if (activeTab === 'blueprint') {
        body += `<table border="1" cellpadding="5" cellspacing="0" width="100%"><thead><tr><th>No</th><th>KD / CP</th><th>Materi</th><th>Indikator</th><th>Level</th></tr></thead><tbody>`;
        quiz.blueprint.forEach(bp => { body += `<tr><td>${bp.questionNumber}</td><td>${bp.basicCompetency}</td><td>${quiz.topic}</td><td>${bp.indicator}</td><td>${bp.cognitiveLevel}</td></tr>`; });
        body += `</tbody></table>`;
     } else {
         let currentType: QuestionType | null = null;
         quiz.questions.forEach((q, i) => {
             if (q.type !== currentType) { currentType = q.type; body += `<div class='type-header'>${getQuestionTypeLabel(q.type)}</div>`; }
             const showStimulus = q.stimulus && (i === 0 || q.stimulus !== quiz.questions[i - 1].stimulus);
             body += `<div class='question'>`;
             if (showStimulus) { body += `<div style="border:1px solid #000; padding:10px; margin-bottom:10px; font-style:italic;">${q.stimulus}</div>`; }
             body += `<b>${i+1}. ${q.text}</b><br/>`;
             if(q.imageUrl) body += `<img src="${q.imageUrl}" width="200" /><br/>`;
             if(q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.COMPLEX_MULTIPLE_CHOICE || q.type === QuestionType.TRUE_FALSE) {
                 const opts = (q.type === QuestionType.TRUE_FALSE && (!q.options || q.options.length === 0)) ? ['Benar', 'Salah'] : (q.options || []);
                 if (opts.length > 0) { body += `<div class='options'>`; opts.forEach((opt, idx) => { let bullet = `${String.fromCharCode(65+idx)}.`; if (q.type === QuestionType.COMPLEX_MULTIPLE_CHOICE) bullet = '&#9744;'; if (q.type === QuestionType.TRUE_FALSE) bullet = '&#9711;'; body += `${bullet} ${opt}<br/>`; }); body += `</div>`; }
             }
             body += `</div>`;
         });
     }
     const source = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${quiz.title}</title><style>body{font-family:'Times New Roman', serif} .question{margin-bottom:1em} .options{margin-left:1em} .type-header{font-weight:bold; text-transform:uppercase; margin-top:1.5em; margin-bottom:1em; text-decoration:underline;}</style></head><body><center><h1>BANK SOAL ${quiz.level}</h1><h2>${quiz.subject.toUpperCase()} - ${quiz.grade.toUpperCase()}</h2></center><hr/><p><b>Topik:</b> ${quiz.topic} &nbsp;&nbsp;&nbsp; <b>Waktu:</b> 90 Menit</p><hr/><br/>` + body + "</body></html>";
     const blob = new Blob(['\ufeff', source], { type: 'application/msword' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a'); link.href = url; link.download = `${quiz.title.replace(/[^a-z0-9]/gi, '_')}.doc`; link.click();
  };

  return (
    <div id="quiz-result-view" className="bg-graph-paper rounded-none h-full flex flex-col fixed inset-0 z-50 overflow-hidden">
       <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm no-print z-50">
          <div className="flex items-center gap-4">
             <div className="flex flex-col"><h2 className="font-bold text-lg text-slate-800 truncate max-w-md">{quiz.subject} - {quiz.topic}</h2><span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{quiz.questions.length} Butir Soal</span></div>
             <div className="bg-slate-100 p-1 rounded-lg flex items-center ml-4"><button onClick={() => setActiveTab('questions')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'questions' ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}><FileText size={14}/> Soal</button><button onClick={() => setActiveTab('blueprint')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'blueprint' ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}><Grid size={14}/> Kisi-Kisi</button></div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="hidden md:flex items-center gap-2 border-r border-slate-200 pr-4 mr-2"><button onClick={() => setShowKey(!showKey)} className={`px-3 py-1.5 border rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${showKey ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-slate-600 border-slate-200'}`}>{showKey ? <EyeOff size={14}/> : <Eye size={14}/>} Kunci</button></div>
            <button onClick={downloadWord} className="px-3 py-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"><FileText size={14}/> Word</button>
            <button onClick={() => handlePrint(false)} className="px-3 py-1.5 text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"><Printer size={14}/> Cetak Soal</button>
            <button onClick={() => handlePrint(true)} className="px-3 py-1.5 text-white bg-red-600 hover:bg-red-700 border border-red-600 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"><FileType size={14}/> PDF (Soal+Kunci)</button>
            <button onClick={onClose} className="p-2 ml-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><X size={20}/></button>
          </div>
       </div>
       <div className="flex-1 overflow-y-auto p-8 custom-scrollbar flex justify-center bg-graph-paper">
          <div id="print-area" className="w-[210mm] min-h-[297mm] bg-white shadow-2xl mx-auto p-[2.5cm] relative">
             <div className="text-center mb-6 no-print-break"><p className="text-[10px] text-slate-400 font-sans tracking-[0.2em] uppercase mb-2 no-print">Generated by Gen-Z Quiz</p><h1 className="text-2xl font-bold uppercase font-serif tracking-wide text-black mb-1">BANK SOAL {quiz.level}</h1><h2 className="text-lg font-bold uppercase font-serif tracking-wide text-black">{quiz.subject.toUpperCase()} - {quiz.grade.toUpperCase()}</h2></div>
             <div className="border-t-2 border-b-2 border-black py-2 mb-8 font-serif text-sm flex justify-between items-start"><div className="w-2/3 pr-4"><p className="mb-1"><span className="font-bold">Topik:</span> {quiz.topic} {quiz.subTopic ? `(${quiz.subTopic})` : ''}</p></div><div className="w-1/3 text-right"><p className="mb-1"><span className="font-bold">Waktu:</span> 90 Menit</p></div></div>
             {activeTab === 'blueprint' ? (
                 <div>
                    <h3 className="text-center font-bold uppercase font-serif mb-4 border-b pb-2">KISI-KISI PENULISAN SOAL</h3>
                    <table className="w-full border-collapse border border-black text-xs font-serif"><thead className="bg-gray-100"><tr><th className="border border-black p-2 w-10 text-center">No</th><th className="border border-black p-2 text-left">Kompetensi Dasar / Capaian</th><th className="border border-black p-2 text-left w-1/4">Indikator Soal</th><th className="border border-black p-2 w-16 text-center">Level</th><th className="border border-black p-2 w-16 text-center">Bentuk</th></tr></thead><tbody>{quiz.blueprint.map((bp) => (<tr key={bp.questionNumber}><td className="border border-black p-2 text-center">{bp.questionNumber}</td><td className="border border-black p-2">{bp.basicCompetency}</td><td className="border border-black p-2">{bp.indicator}</td><td className="border border-black p-2 text-center">{bp.cognitiveLevel}</td><td className="border border-black p-2 text-center">{quiz.questions[bp.questionNumber-1]?.type === 'MULTIPLE_CHOICE' ? 'PG' : 'Essay'}</td></tr>))}</tbody></table>
                 </div>
             ) : (
                 <div className="space-y-6 font-serif text-black">{quiz.questions.map((q, idx) => { 
                     // Check strictly if stimulus changed
                     const showStimulus = q.stimulus && (idx === 0 || q.stimulus !== quiz.questions[idx - 1].stimulus); 
                     const showTypeHeader = idx === 0 || q.type !== quiz.questions[idx - 1].type; 
                     return (
                     <div key={q.id || idx} className="avoid-break group">
                        {showTypeHeader && (<div className="mt-6 mb-4"><h3 className="font-bold text-sm uppercase underline decoration-2 underline-offset-4 tracking-wider">{getQuestionTypeLabel(q.type)}</h3></div>)}
                        {showStimulus && (<div className="mb-4 p-4 border border-slate-300 bg-slate-50 text-sm italic rounded-sm mx-8"><MathRenderer content={q.stimulus || ''} /></div>)}
                        <div className="flex gap-4">
                            <span className="font-bold min-w-[1.5rem] text-right">{idx + 1}.</span>
                            <div className="flex-1">
                                <div className="mb-3 text-justify leading-relaxed"><MathRenderer content={q.text} /></div>
                                {q.imageUrl && (<img src={q.imageUrl} alt="Soal" className="max-w-[200px] border mb-4 block" />)}
                                {(q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.COMPLEX_MULTIPLE_CHOICE || q.type === QuestionType.TRUE_FALSE) && (<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 ml-2 print-grid">{(q.type === QuestionType.TRUE_FALSE && (!q.options || q.options.length === 0) ? ['Benar', 'Salah'] : (q.options || [])).map((opt, i) => (<div key={i} className="flex gap-2 items-baseline"><span className="font-bold uppercase text-sm w-4">{q.type === QuestionType.COMPLEX_MULTIPLE_CHOICE ? '☐' : (q.type === QuestionType.TRUE_FALSE ? '◯' : String.fromCharCode(65 + i) + '.')}</span><div className="flex-1"><MathRenderer content={opt} inline /></div></div>))}</div>)}
                                {(q.type === QuestionType.ESSAY || q.type === QuestionType.SHORT_ANSWER) && (<div className="w-full h-24 border-b border-dotted border-black mt-2"></div>)}
                            </div>
                        </div>
                        {showKey && (<div className="mt-2 ml-10 p-2 bg-green-50 text-xs text-green-800 border-l-2 border-green-500"><strong>Kunci:</strong> {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer} <span className="mx-2">|</span> <strong>Pembahasan:</strong> <MathRenderer content={q.explanation} inline /></div>)}
                     </div>
                     ); 
                 })}</div>
             )}
          </div>
       </div>
    </div>
  );
};

const HistoryArchive = ({ user }: { user: UserType }) => { const [quizzes, setQuizzes] = useState<Quiz[]>([]); const [searchTerm, setSearchTerm] = useState(''); const [viewQuiz, setViewQuiz] = useState<Quiz | null>(null); const loadQuizzes = async () => { const data = await dbService.getQuizzes(user.role === Role.ADMIN ? undefined : user.id); setQuizzes(data); }; useEffect(() => { loadQuizzes(); }, [user]); const handleDelete = async (id: string, e: React.MouseEvent) => { e.stopPropagation(); if(confirm("Hapus quiz ini permanen?")) { await dbService.deleteQuiz(id); loadQuizzes(); } }; const handleTogglePublic = async (quiz: Quiz, e: React.MouseEvent) => { e.stopPropagation(); await dbService.toggleQuizVisibility(quiz.id, !quiz.isPublic); loadQuizzes(); }; const filtered = quizzes.filter(q => q.title.toLowerCase().includes(searchTerm.toLowerCase()) || q.subject.toLowerCase().includes(searchTerm.toLowerCase())); if (viewQuiz) { return <QuizResultView quiz={viewQuiz} onClose={() => setViewQuiz(null)} />; } return (<div className="space-y-6 max-w-7xl mx-auto"><div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6"><div><h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><Archive className="text-brand-600"/> Riwayat & Arsip</h2><p className="text-slate-500 text-sm">Kelola semua quiz yang telah Anda buat.</p></div><div className="relative w-full md:w-64"><input type="text" placeholder="Cari quiz..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/><Search className="absolute left-3 top-3 text-slate-400" size={18}/></div></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filtered.map(quiz => (<div key={quiz.id} onClick={() => setViewQuiz(quiz)} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer group"><div className="flex justify-between items-start mb-4"><div className="p-3 bg-brand-50 text-brand-600 rounded-xl group-hover:bg-brand-500 group-hover:text-white transition-colors"><FileText size={24}/></div><div className="flex gap-2"><button onClick={(e) => handleTogglePublic(quiz, e)} className={`p-2 rounded-lg transition-colors ${quiz.isPublic ? 'text-green-500 bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`} title={quiz.isPublic ? 'Public' : 'Private'}>{quiz.isPublic ? <Unlock size={16}/> : <Lock size={16}/>}</button><button onClick={(e) => handleDelete(quiz.id, e)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button></div></div><h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1 line-clamp-1">{quiz.title}</h3><div className="flex flex-wrap gap-2 mb-4"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-md">{quiz.subject}</span><span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-md">{quiz.questions.length} Q</span><span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-md">{new Date(quiz.createdAt).toLocaleDateString()}</span></div></div>))}{filtered.length === 0 && (<div className="col-span-full py-12 text-center text-slate-400 flex flex-col items-center"><Archive size={48} className="mb-4 opacity-20"/><p>Tidak ada quiz ditemukan.</p></div>)}</div></div>); };

const SUBJECTS = { "Wajib Umum": [ "Pendidikan Agama Islam dan Budi Pekerti", "Pendidikan Pancasila", "Bahasa Indonesia", "Matematika", "IPA", "IPS", "IPAS", "Koding", "Kecerdasan Artificial", "Sejarah", "Sejarah Indonesia", "Bahasa Inggris", "Seni Budaya", "PJOK", "PKWU", "Al-Qur’an Hadis", "Akidah Akhlak", "Fikih", "Sejarah Kebudayaan Islam", "Ilmu Tafsir", "Ilmu Hadis", "Ushul Fikih" ], "Peminatan MIPA": ["Biologi", "Fisika", "Kimia", "Matematika Peminatan"], "Peminatan IPS": ["Sosiologi", "Ekonomi", "Geografi", "Antropologi"], "Bahasa & Budaya": ["Bahasa & Sastra Indonesia", "Bahasa & Sastra Inggris", "Bahasa Arab", "Bahasa Jepang", "Bahasa Korea", "Bahasa Mandarin", "Bahasa Jerman", "Bahasa Perancis"], "Agama Lain": ["Pendidikan Agama Kristen", "Pendidikan Agama Katolik", "Pendidikan Agama Hindu", "Pendidikan Agama Buddha", "Pendidikan Agama Khonghucu"], "Vokasi": ["Dasar-dasar Kejuruan", "Matematika Terapan", "IPAS"] };
const CreateQuiz = ({ user, onUpdateCredits }: { user: UserType; onUpdateCredits: (credits: number) => void }) => { const navigate = useNavigate(); const [loading, setLoading] = useState(false); const [progress, setProgress] = useState(0); const [loadingStep, setLoadingStep] = useState(''); const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null); const [subjectCategory, setSubjectCategory] = useState("Wajib Umum"); const [subject, setSubject] = useState(SUBJECTS["Wajib Umum"][0]); const [level, setLevel] = useState("SMA"); const [grade, setGrade] = useState("Kelas 10"); const [topic, setTopic] = useState(""); const [subTopic, setSubTopic] = useState(""); const [materialFile, setMaterialFile] = useState<File | null>(null); const [materialText, setMaterialText] = useState(""); const [refImage, setRefImage] = useState<string | null>(null); const [questionCount, setQuestionCount] = useState(10); const [mcOptionCount, setMcOptionCount] = useState<4 | 5>(5); const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM); const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([QuestionType.MULTIPLE_CHOICE]); const [selectedCognitive, setSelectedCognitive] = useState<CognitiveLevel[]>([CognitiveLevel.C2, CognitiveLevel.C3, CognitiveLevel.C4]); const [imgQuestionCount, setImgQuestionCount] = useState(0); const [factCheck, setFactCheck] = useState(true); const [readingMode, setReadingMode] = useState<'none' | 'simple' | 'grouped'>('none'); const [language, setLanguage] = useState<string>('ID');
    useEffect(() => { dbService.getSettings().then(s => setFactCheck(s.ai.factCheck)); }, []); useEffect(() => { if (subjectCategory === "Bahasa & Budaya" || subject.includes("Bahasa")) { setReadingMode('grouped'); } else { setReadingMode('none'); } }, [subject, subjectCategory]); useEffect(() => { const getLangContext = (subj: string) => { if (subj === 'Bahasa Arab') return 'AR'; if (subj === 'Bahasa Jepang') return 'JP'; if (subj === 'Bahasa Korea') return 'KR'; if (subj === 'Bahasa Mandarin') return 'CN'; if (subj === 'Bahasa Jerman') return 'DE'; if (subj === 'Bahasa Perancis') return 'FR'; if (subj === 'Bahasa Inggris') return 'EN'; return 'ID'; }; setLanguage(getLangContext(subject)); }, [subject]);
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { const file = e.target.files[0]; if (file.type === "text/plain") { setMaterialFile(file); const text = await file.text(); setMaterialText(text); } else { alert("Mohon upload file .txt saja untuk ringkasan materi."); } } };
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { const reader = new FileReader(); reader.onloadend = () => { setRefImage(reader.result as string); }; reader.readAsDataURL(e.target.files[0]); } };
    const toggleType = (t: QuestionType) => { if (selectedTypes.includes(t)) { setSelectedTypes(selectedTypes.filter(x => x !== t)); } else { setSelectedTypes([...selectedTypes, t]); } };
    const toggleCognitive = (c: CognitiveLevel) => { if (selectedCognitive.includes(c)) { setSelectedCognitive(selectedCognitive.filter(x => x !== c)); } else { setSelectedCognitive([...selectedCognitive, c]); } };
    const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (user.credits < 1) { alert("Credit tidak mencukupi!"); return; } if (selectedTypes.length === 0) { alert("Pilih minimal satu tipe soal."); return; } if (selectedCognitive.length === 0) { alert("Pilih minimal satu level kognitif."); return; } setLoading(true); setProgress(0); setLoadingStep("Menganalisis Parameter & Materi..."); setGeneratedQuiz(null); const paramDetails = JSON.stringify({ subject, topic, questionCount, difficulty, types: selectedTypes, cognitive: selectedCognitive, factCheck, readingMode, language }, null, 2); await dbService.addLog("START_GENERATE_QUIZ", `Starting generation for ${subject}.\nParams: ${paramDetails}`, LogType.INFO, user.username); try { setProgress(20); setLoadingStep("Mengenerate Soal Presisi (Gemini 3 Flash)..."); const result = await generateQuizContent({ subject, subjectCategory, level, grade, topic, subTopic, materialText, refImageBase64: refImage || undefined, questionCount, mcOptionCount, imageQuestionCount: imgQuestionCount, types: selectedTypes, difficulty, cognitiveLevels: selectedCognitive, languageContext: language as any, readingMode, userApiKeys: user.apiKeys }, factCheck); setProgress(60); const processedQuestions = []; let imgProcessedCount = 0; const totalImagesToGen = result.questions.filter(q => q.hasImage).length; if (totalImagesToGen > 0) { setLoadingStep(`Mengenerate Visual (${totalImagesToGen} Gambar)...`); for (const q of result.questions) { if (q.hasImage && q.imagePrompt) { const imgUrl = await generateImageForQuestion(q.imagePrompt, user.apiKeys); processedQuestions.push({ ...q, imageUrl: imgUrl }); imgProcessedCount++; setProgress(60 + Math.floor((imgProcessedCount / totalImagesToGen) * 35)); } else { processedQuestions.push(q); } } } else { processedQuestions.push(...result.questions); setProgress(95); } setLoadingStep("Menyimpan ke Database..."); const newQuiz: Quiz = { id: Date.now().toString(), title: `${subject} - ${topic}`, subject, subjectCategory, level, grade, topic, subTopic, blueprint: result.blueprint, questions: processedQuestions, createdBy: user.id, createdAt: new Date().toISOString(), status: 'DRAFT', isPublic: false }; await dbService.saveQuiz(newQuiz); const newCredits = user.credits - 1; await dbService.updateUserCredits(user.id, newCredits); onUpdateCredits(newCredits); await dbService.addLog("FINISH_GENERATE_QUIZ", `Successfully generated quiz ID: ${newQuiz.id}\nQuestions: ${newQuiz.questions.length}`, LogType.SUCCESS, user.username); setGeneratedQuiz(newQuiz); setProgress(100); setLoadingStep("Selesai!"); } catch (err) { console.error(err); await dbService.addLog("ERROR_GENERATE_QUIZ", `Failed to generate quiz.\nError: ${(err as Error).message}`, LogType.ERROR, user.username); alert("Gagal membuat quiz: " + (err as Error).message); } finally { setLoading(false); } };
    if (generatedQuiz && !loading) { return <QuizResultView quiz={generatedQuiz} onClose={() => setGeneratedQuiz(null)} />; }
    return (<div className="space-y-6 max-w-5xl mx-auto pb-20"><div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700"><div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-700"><div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center"><BrainCircuit size={28} /></div><div><h2 className="text-2xl font-bold text-slate-800 dark:text-white">Buat Quiz Baru</h2><p className="text-slate-500 text-sm">Konfigurasi parameter AI untuk hasil presisi.</p></div></div><form onSubmit={handleSubmit} className="space-y-8"><section className="space-y-4"><h3 className="text-lg font-bold text-brand-600 flex items-center gap-2"><BookOpen size={20}/> Informasi Mata Pelajaran</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-sm font-medium mb-2 dark:text-slate-300">Kategori Mapel</label><div className="relative"><select className="w-full p-3 pl-4 pr-10 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none appearance-none" value={subjectCategory} onChange={(e) => { setSubjectCategory(e.target.value); setSubject(SUBJECTS[e.target.value as keyof typeof SUBJECTS][0]); }}>{Object.keys(SUBJECTS).map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}</select><ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16}/></div></div><div><label className="block text-sm font-medium mb-2 dark:text-slate-300">Mata Pelajaran</label><div className="relative"><select className="w-full p-3 pl-4 pr-10 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none appearance-none" value={subject} onChange={(e) => setSubject(e.target.value)}>{SUBJECTS[subjectCategory as keyof typeof SUBJECTS].map((s: string) => ( <option key={s} value={s}>{s}</option> ))}</select><ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16}/></div></div><div><label className="block text-sm font-medium mb-2 dark:text-slate-300">Bahasa Pengantar Soal</label><div className="relative"><select className="w-full p-3 pl-4 pr-10 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none appearance-none" value={language} onChange={(e) => setLanguage(e.target.value)}><option value="ID">Bahasa Indonesia</option><option value="EN">Bahasa Inggris (English)</option><option value="AR">Bahasa Arab</option><option value="JP">Bahasa Jepang</option><option value="KR">Bahasa Korea</option><option value="CN">Bahasa Mandarin</option><option value="DE">Bahasa Jerman</option><option value="FR">Bahasa Perancis</option></select><Globe className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16}/></div></div><div><label className="block text-sm font-medium mb-2 dark:text-slate-300">Jenjang Sekolah</label><select className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none" value={level} onChange={e => setLevel(e.target.value)}><option>SD</option><option>SMP</option><option>MTs</option><option>SMA</option><option>MA</option><option>SMK</option></select></div><div><label className="block text-sm font-medium mb-2 dark:text-slate-300">Kelas</label><select className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none" value={grade} onChange={e => setGrade(e.target.value)}><option>Kelas 1</option><option>Kelas 2</option><option>Kelas 3</option><option>Kelas 4</option><option>Kelas 5</option><option>Kelas 6</option><option>Kelas 7</option><option>Kelas 8</option><option>Kelas 9</option><option>Kelas 10</option><option>Kelas 11</option><option>Kelas 12</option></select></div></div></section><section className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700"><h3 className="text-lg font-bold text-brand-600 flex items-center gap-2"><FileText size={20}/> Materi & Referensi</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="col-span-1 md:col-span-2"><label className="block text-sm font-medium mb-2 dark:text-slate-300">Topik / Tujuan Pembelajaran</label><input type="text" className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Contoh: Integral Tentu, Hukum Newton II, Tata Bahasa Arab..." value={topic} onChange={e => setTopic(e.target.value)} required /></div><div><label className="block text-sm font-medium mb-2 dark:text-slate-300">Sub-Materi (Opsional)</label><input type="text" className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Spesifik sub-bab..." value={subTopic} onChange={e => setSubTopic(e.target.value)} /></div><div><label className="block text-sm font-medium mb-2 dark:text-slate-300">Upload Ringkasan (.txt)</label><div className="relative border-2 border-dashed border-slate-300 rounded-xl p-3 hover:border-brand-500 transition-colors bg-slate-50 dark:bg-slate-800 dark:border-slate-600"><input type="file" accept=".txt" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><div className="flex items-center justify-center gap-2 text-slate-500"><Upload size={18}/><span className="text-sm truncate">{materialFile ? materialFile.name : "Pilih file .txt"}</span></div></div></div><div><label className="block text-sm font-medium mb-2 dark:text-slate-300">Gambar Referensi (Opsional)</label><div className="relative border-2 border-dashed border-slate-300 rounded-xl p-3 hover:border-brand-500 transition-colors bg-slate-50 dark:bg-slate-800 dark:border-slate-600"><input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><div className="flex items-center justify-center gap-2 text-slate-500"><ImageIcon size={18}/><span className="text-sm truncate">{refImage ? "Gambar Terupload" : "Upload Gambar"}</span></div></div></div></div></section><section className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700"><h3 className="text-lg font-bold text-brand-600 flex items-center gap-2"><Settings size={20}/> Parameter Soal</h3><div><label className="block text-sm font-medium mb-3 dark:text-slate-300">Tipe Soal (Bisa pilih lebih dari satu)</label><div className="flex flex-wrap gap-3">{[ { id: QuestionType.MULTIPLE_CHOICE, label: 'Pilihan Ganda' }, { id: QuestionType.COMPLEX_MULTIPLE_CHOICE, label: 'PG Kompleks' }, { id: QuestionType.TRUE_FALSE, label: 'Benar/Salah' }, { id: QuestionType.SHORT_ANSWER, label: 'Isian Singkat' }, { id: QuestionType.ESSAY, label: 'Uraian/Essay' } ].map(type => ( <button key={type.id} type="button" onClick={() => toggleType(type.id)} className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${selectedTypes.includes(type.id) ? 'bg-brand-500 text-white border-brand-500 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}> {type.label} </button> ))}</div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div><label className="block text-sm font-medium mb-2 dark:text-slate-300">Jumlah Soal</label><input type="number" min="1" max="50" className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none" value={questionCount} onChange={e => setQuestionCount(parseInt(e.target.value))} /></div><div><label className="block text-sm font-medium mb-2 dark:text-slate-300">Opsi Jawaban (PG)</label><select className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none" value={mcOptionCount} onChange={e => setMcOptionCount(parseInt(e.target.value) as 4|5)}><option value={4}>4 Opsi (A-D)</option><option value={5}>5 Opsi (A-E)</option></select></div><div><label className="block text-sm font-medium mb-2 dark:text-slate-300">Tingkat Kesulitan</label><select className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none" value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}><option value="EASY">Mudah</option><option value="MEDIUM">Sedang</option><option value="HARD">Sulit</option></select></div></div><div><label className="block text-sm font-medium mb-3 dark:text-slate-300">Level Kognitif (Bloom)</label><div className="flex flex-wrap gap-2">{Object.values(CognitiveLevel).map((c: string) => ( <button key={c} type="button" onClick={() => toggleCognitive(c as CognitiveLevel)} className={`w-10 h-10 rounded-lg text-xs font-bold border transition-all ${selectedCognitive.includes(c as CognitiveLevel) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}> {c} </button> ))}</div></div><div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"><div className="flex items-center gap-3 mb-3"><div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><BookOpenCheck size={20} /></div><div><h4 className="font-bold text-slate-800 dark:text-white text-sm">Mode Literasi & Wacana</h4><p className="text-xs text-slate-500">Pilih strategi wacana/cerita untuk soal.</p></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-3"><button type="button" onClick={() => setReadingMode('none')} className={`p-3 rounded-lg border text-left transition-all ${readingMode === 'none' ? 'bg-white border-blue-500 ring-1 ring-blue-500 shadow-sm' : 'bg-slate-100 border-transparent hover:bg-slate-200'}`}><div className="font-bold text-xs text-slate-800">Tanpa Wacana</div><div className="text-[10px] text-slate-500">Soal langsung (Matematika/Fakta).</div></button><button type="button" onClick={() => setReadingMode('simple')} className={`p-3 rounded-lg border text-left transition-all ${readingMode === 'simple' ? 'bg-white border-blue-500 ring-1 ring-blue-500 shadow-sm' : 'bg-slate-100 border-transparent hover:bg-slate-200'}`}><div className="font-bold text-xs text-slate-800">Wacana Per Soal</div><div className="text-[10px] text-slate-500">Setiap soal punya cerita pendek unik.</div></button><button type="button" onClick={() => setReadingMode('grouped')} className={`p-3 rounded-lg border text-left transition-all ${readingMode === 'grouped' ? 'bg-white border-blue-500 ring-1 ring-blue-500 shadow-sm' : 'bg-slate-100 border-transparent hover:bg-slate-200'}`}><div className="font-bold text-xs text-slate-800">Wacana (Grouped)</div><div className="text-[10px] text-slate-500">Satu teks untuk banyak soal.</div></button></div></div><div className="bg-orange-50 dark:bg-slate-900 p-5 rounded-xl border border-orange-100 dark:border-slate-700 mt-4"><label className="block text-sm font-bold text-brand-800 mb-3 flex items-center gap-2"><ImageIcon size={16}/> Parameter Visual AI (Gemini 2.5 Flash / SVG)</label><div><label className="text-xs text-slate-500 block mb-1">Jumlah Soal Bergambar (Maks: {questionCount})</label><input type="number" min="0" max={questionCount} className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800" value={imgQuestionCount} onChange={e => { const val = parseInt(e.target.value); if (!isNaN(val)) { if (val > questionCount) setImgQuestionCount(questionCount); else if (val < 0) setImgQuestionCount(0); else setImgQuestionCount(val); } else { if (e.target.value === '') setImgQuestionCount(0); } }} /></div><p className="text-xs text-slate-400 mt-2">Aplikasi otomatis menggunakan Gemini 2.5 Flash Image untuk generate. Jika gagal, otomatis fallback ke SVG.</p></div></section><button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-brand-600 to-orange-500 hover:from-brand-700 hover:to-orange-600 text-white font-bold py-4 rounded-xl shadow-xl shadow-brand-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg">{loading ? <RefreshCw className="animate-spin" /> : <BrainCircuit />}{loading ? 'Sedang Memproses...' : 'Generate Soal Sekarang'}</button></form></div>{loading && (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"><div className="bg-white dark:bg-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-400 to-red-500 animate-pulse"></div><div className="text-center space-y-6"><div className="relative w-20 h-20 mx-auto"><div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-700"></div><div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div><div className="absolute inset-0 flex items-center justify-center font-bold text-brand-600 text-sm">{progress}%</div></div><div><h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Sedang Membuat Quiz...</h3><p className="text-brand-600 font-medium animate-pulse">{loadingStep}</p></div><div className="space-y-2"><div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-brand-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div></div><p className="text-xs text-slate-400">Mohon jangan tutup halaman ini.</p></div></div></div></div>)}</div>);
};

// --- NEW COMPONENTS FOR MODALS ---
const ApiMonitorModal = ({ onClose }: { onClose: () => void }) => {
  const [stats, setStats] = useState<KeyStats[]>([]);
  useEffect(() => {
    const update = () => setStats(getApiKeyStats());
    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><Activity className="text-brand-500"/> API Key Monitor</h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} className="text-slate-500"/></button>
        </div>
        <div className="p-0 overflow-auto custom-scrollbar">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold text-xs uppercase sticky top-0">
                    <tr>
                        <th className="p-3">Key (Mask)</th>
                        <th className="p-3">Source</th>
                        <th className="p-3 text-center">Usage</th>
                        <th className="p-3 text-center">Errors</th>
                        <th className="p-3 text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {stats.map((s, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                            <td className="p-3 font-mono text-xs text-slate-600 dark:text-slate-300">{s.keyMask}</td>
                            <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.source === 'SYSTEM' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{s.source}</span></td>
                            <td className="p-3 text-center font-bold">{s.usageCount}</td>
                            <td className="p-3 text-center font-bold text-red-500">{s.errorCount}</td>
                            <td className="p-3 text-center">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : s.status === 'RATE_LIMITED' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>{s.status}</span>
                            </td>
                        </tr>
                    ))}
                    {stats.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-400">No keys active.</td></tr>}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

const DonationModal = ({ user, onClose, selectedPackage }: { user: UserType, onClose: () => void, selectedPackage: PricingPackage | null }) => {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 relative overflow-hidden">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-100 text-green-600">
                        <Wallet size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Pembelian Top Up Credit</h3>
                    <p className="text-slate-500 text-sm mb-6">
                        {selectedPackage 
                            ? <span>Anda memilih <strong>{selectedPackage.name}</strong><br/>Rp {selectedPackage.price.toLocaleString()}</span>
                            : "Dapatkan paket tambahan untuk akun Anda."
                        }
                    </p>
                    
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 mb-6 text-left">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-600">DANA</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-600">SHOPEEPAY</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-xl font-mono font-bold text-slate-800 dark:text-white tracking-wider">0852-4848-1527</p>
                            <button className="text-brand-600 text-xs font-bold hover:bg-brand-50 px-2 py-1 rounded transition-colors" onClick={() => { navigator.clipboard.writeText("085248481527"); alert("Nomor disalin!"); }}>COPY</button>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">a.n. Gen-Z Quiz Admin</p>
                    </div>

                    <a 
                        href={`https://wa.me/6285248481527?text=Halo Admin, saya ingin membeli ${selectedPackage ? selectedPackage.name : 'Credit'}. Username: ${user.username}. ${selectedPackage ? `Paket: ${selectedPackage.name} (${selectedPackage.credits} Credits)` : ''}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg bg-green-600 hover:bg-green-700 shadow-green-500/20"
                    >
                        <MessageCircle size={18} /> Konfirmasi via WhatsApp
                    </a>
                    <p className="text-[10px] text-slate-400 mt-4">Proses verifikasi manual, item akan masuk setelah konfirmasi admin.</p>
                </div>
            </div>
        </div>
    );
};

const Dashboard = ({ user }: { user: UserType }) => {
  const [stats, setStats] = useState({ quizCount: 0, generated: 0 });
  const [chartData, setChartData] = useState<{name: string, generated: number, published: number}[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [showDonation, setShowDonation] = useState(false);
  const [showApiMonitor, setShowApiMonitor] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PricingPackage | null>(null);
  const [creditPackages, setCreditPackages] = useState<PricingPackage[]>([]);
  
  useEffect(() => { if (!localStorage.getItem('genz_tour_completed')) { const t = setTimeout(() => setRunTour(true), 1500); return () => clearTimeout(t); } }, []);
  
  useEffect(() => { 
      const loadStats = async () => { 
          const userId = user.role === Role.ADMIN ? undefined : user.id; 
          const quizzes = await dbService.getQuizzes(userId); 
          const totalQuestions = quizzes.reduce((acc, q) => acc + (q.questions ? q.questions.length : 0), 0); 
          setStats({ quizCount: quizzes.length, generated: totalQuestions }); 
          
          const last7Days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; }); 
          const processedData = last7Days.map(date => { const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' }); const dailyQuizzes = quizzes.filter(q => { const qDate = new Date(q.createdAt); return qDate.getDate() === date.getDate() && qDate.getMonth() === date.getMonth() && qDate.getFullYear() === date.getFullYear(); }); return { name: dayName, generated: dailyQuizzes.length, published: dailyQuizzes.filter(q => q.status === 'PUBLISHED').length }; }); 
          setChartData(processedData); 
          
          const s = await dbService.getSettings(); 
          setSettings(s); 
          if (s.creditPackages) {
              setCreditPackages(s.creditPackages);
          }
      }; 
      loadStats(); 
  }, [user]);

  const handleBuyPackage = (pkg: PricingPackage) => { setSelectedPackage(pkg); setShowDonation(true); };
  const handleGeneralDonation = () => { setSelectedPackage(null); setShowDonation(true); };
  const isCronActive = settings?.cron.enabled || false;
  const tourSteps: Step[] = [{ targetId: 'tour-stats-card', title: 'Statistik Anda', content: 'Lihat ringkasan soal yang telah dibuat dan status sistem di sini.' }, { targetId: 'tour-credits-card', title: 'Credit Guru', content: 'Pantau sisa credit Anda. Credit digunakan setiap kali membuat quiz baru.' }, { targetId: 'tour-nav-create', title: 'Buat Quiz', content: 'Klik menu ini untuk mulai membuat soal otomatis dengan AI.' }, { targetId: 'tour-nav-history', title: 'Riwayat & Arsip', content: 'Akses kembali soal yang sudah dibuat, edit, atau download dalam format Word/PDF.' }];
  
  return (<div className="space-y-6"><TourGuide isOpen={runTour} steps={tourSteps} onClose={() => setRunTour(false)} onComplete={() => { setRunTour(false); localStorage.setItem('genz_tour_completed', 'true'); }} />{showDonation && <DonationModal user={user} onClose={() => setShowDonation(false)} selectedPackage={selectedPackage} />}{showApiMonitor && <ApiMonitorModal onClose={() => setShowApiMonitor(false)} />}{user.credits < 10 && (<div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm animate-fade-in-up"><div className="flex items-center gap-3"><div className="p-2 bg-orange-100 rounded-full text-orange-600"><AlertTriangle size={20} /></div><div><p className="font-bold text-orange-800">Credit Menipis!</p><p className="text-sm text-orange-700">Sisa credit Anda kurang dari 10. Segera isi ulang untuk terus membuat soal.</p></div></div><button onClick={handleGeneralDonation} className="w-full sm:w-auto px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-lg transition-colors shadow-md shadow-orange-500/20 whitespace-nowrap">Isi Ulang Sekarang</button></div>)}{user.role === Role.ADMIN && (<div className="bg-slate-800 text-white p-4 rounded-2xl shadow-lg flex justify-between items-center mb-2"><div className="flex items-center gap-3"><ShieldCheck className="text-green-400" /><div><h3 className="font-bold">Admin Console</h3><p className="text-xs text-slate-400">Monitoring System Health</p></div></div><button onClick={() => setShowApiMonitor(true)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors border border-slate-600"><Activity size={16} className="text-brand-400"/> Monitor API Keys</button></div>)}<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><div id="tour-stats-card" className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-[1.02] transition-transform"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500 dark:text-slate-400">Total Quiz</p><p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.quizCount}</p></div><div className="p-3 rounded-xl bg-blue-500 bg-opacity-10"><BookOpen className="w-6 h-6 text-blue-500" /></div></div></div><div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-[1.02] transition-transform"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500 dark:text-slate-400">Total Soal (Bank)</p><p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.generated}</p></div><div className="p-3 rounded-xl bg-brand-500 bg-opacity-10"><Database className="w-6 h-6 text-brand-500" /></div></div></div><div id="tour-credits-card" className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-[1.02] transition-transform"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Credit Guru</p><div className="flex items-center gap-3"><p className={`text-2xl font-bold ${user.credits < 10 ? 'text-orange-600' : 'text-green-600'}`}>{user.credits}</p><button onClick={handleGeneralDonation} className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"><Heart size={12} className="fill-green-600"/> Top Up</button></div></div><div className="p-3 rounded-xl bg-green-500 bg-opacity-10"><Coins className="w-6 h-6 text-green-500" /></div></div></div><div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-[1.02] transition-transform"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500 dark:text-slate-400">System Status</p><p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{isCronActive ? 'Cron Active' : 'Cron Idle'}</p></div><div className={`p-3 rounded-xl ${isCronActive ? 'bg-purple-500' : 'bg-slate-500'} bg-opacity-10`}><RotateCw className={`w-6 h-6 ${isCronActive ? 'text-purple-500' : 'text-slate-500'}`} /></div></div></div></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700"><h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Statistik Pembuatan Soal (7 Hari Terakhir)</h3><div className="h-80 w-full" style={{ minHeight: '320px' }}><ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" stroke="#64748b" /><YAxis stroke="#64748b" allowDecimals={false} /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /><Legend /><Bar dataKey="generated" fill="#f97316" radius={[4, 4, 0, 0]} name="Soal Dibuat" /><Bar dataKey="published" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Terpublish" /></BarChart></ResponsiveContainer></div></div><div className="lg:col-span-1 space-y-4"><h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Zap size={18} className="text-orange-500 fill-orange-500" /> Paket Top Up Credit</h3>{creditPackages?.map((pkg, idx) => ( <div key={idx} onClick={() => handleBuyPackage(pkg)} className={`p-5 rounded-2xl border cursor-pointer hover:shadow-md transition-all relative overflow-hidden group bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 ${pkg.color}`}><div className="flex justify-between items-start"><div><h4 className="font-bold text-lg text-slate-800 dark:text-white">{pkg.name}</h4><p className="text-3xl font-bold my-2">Rp {pkg.price.toLocaleString()}</p><div className="flex items-center gap-1.5 text-sm font-medium opacity-80"><Coins size={14} /> {pkg.credits} Credits</div>{pkg.description && <p className="text-xs mt-2 opacity-70">{pkg.description}</p>}</div><div className="p-3 bg-white/50 rounded-xl group-hover:scale-110 transition-transform"><Rocket size={24} /></div></div></div>))}</div></div></div>);
};

const UserManagement = () => {
    const [users, setUsers] = useState<UserType[]>([]); const [showAddModal, setShowAddModal] = useState(false); const [newUsername, setNewUsername] = useState(''); const [newPassword, setNewPassword] = useState(''); const [newCredits, setNewCredits] = useState(50); const [editingCreditsId, setEditingCreditsId] = useState<string | null>(null); const [tempCredits, setTempCredits] = useState<number>(0);
    const loadUsers = async () => { const data = await dbService.getAllUsers(); setUsers(data); }; useEffect(() => { loadUsers(); }, []);
    const handleAddUser = async (e: React.FormEvent) => { e.preventDefault(); const newUser: UserType = { id: Date.now().toString(), username: newUsername, role: Role.TEACHER, credits: newCredits, isActive: true }; await dbService.createUser(newUser, newPassword); setShowAddModal(false); setNewUsername(''); setNewPassword(''); setNewCredits(50); loadUsers(); };
    const handleDeleteUser = async (id: string) => { if (confirm("Apakah Anda yakin ingin menghapus user ini? Data tidak bisa dikembalikan.")) { await dbService.deleteUser(id); loadUsers(); } };
    const handleToggleStatus = async (user: UserType) => { await dbService.toggleUserStatus(user.id, !user.isActive); loadUsers(); };
    const startEditCredits = (user: UserType) => { setEditingCreditsId(user.id); setTempCredits(user.credits); };
    const saveCredits = async (id: string) => { await dbService.updateUserCredits(id, tempCredits); setEditingCreditsId(null); loadUsers(); };
    return (<div className="space-y-6 max-w-7xl mx-auto"><div className="flex justify-between items-center mb-6"><div><h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><Users className="text-brand-600"/> Manajemen User</h2><p className="text-slate-500 text-sm">Kelola akses guru, kredit, dan status akun.</p></div><button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20"><UserPlus size={18}/> Tambah Guru</button></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{users.map(u => (<div key={u.id} className={`bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border ${u.isActive ? 'border-slate-100 dark:border-slate-700' : 'border-red-200 bg-red-50 dark:bg-red-900/10'} hover:shadow-md transition-all`}><div className="flex justify-between items-start mb-4"><div className="flex items-center gap-3"><div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${u.role === Role.ADMIN ? 'bg-purple-100 text-purple-600' : 'bg-brand-100 text-brand-600'}`}>{u.username.charAt(0).toUpperCase()}</div><div><h3 className="font-bold text-slate-800 dark:text-white">{u.username}</h3><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${u.role === Role.ADMIN ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>{u.role}</span></div></div>{u.role !== Role.ADMIN && (<button onClick={() => handleDeleteUser(u.id)} className="text-slate-400 hover:text-red-50 p-2 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={16}/></button>)}</div><div className="space-y-4"><div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl flex items-center justify-between"><div className="flex items-center gap-2 text-sm text-slate-500"><Coins size={16} className="text-orange-500"/><span>Sisa Kredit:</span></div>{editingCreditsId === u.id ? (<div className="flex items-center gap-2"><button onClick={() => setTempCredits(p => Math.max(0, p - 10))} className="w-6 h-6 bg-slate-200 rounded text-slate-600 font-bold hover:bg-slate-300">-</button><input type="number" value={tempCredits} onChange={(e) => setTempCredits(parseInt(e.target.value))} className="w-12 text-center bg-white border rounded text-sm font-bold"/><button onClick={() => setTempCredits(p => p + 10)} className="w-6 h-6 bg-slate-200 rounded text-slate-600 font-bold hover:bg-slate-300">+</button><button onClick={() => saveCredits(u.id)} className="text-green-600 font-bold text-xs ml-1 hover:underline">Save</button></div>) : (<div className="flex items-center gap-2"><span className="font-bold text-slate-800 dark:text-white">{u.credits}</span><button onClick={() => startEditCredits(u)} className="text-xs text-blue-500 hover:underline">Edit</button></div>)}</div><div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700"><span className="text-xs text-slate-400">Status Akun</span>{u.role !== Role.ADMIN ? (<button onClick={() => handleToggleStatus(u)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${u.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>{u.isActive ? <ShieldCheck size={14}/> : <ShieldAlert size={14}/>}{u.isActive ? 'Active' : 'Disabled'}</button>) : (<span className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold cursor-not-allowed"><ShieldCheck size={14}/> Protected</span>)}</div></div></div>))}</div>{showAddModal && (<div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up"><div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-slate-800 dark:text-white">Tambah Guru Baru</h3><button onClick={() => setShowAddModal(false)}><X className="text-slate-400 hover:text-slate-600"/></button></div><form onSubmit={handleAddUser} className="space-y-4"><div><label className="block text-sm font-medium mb-1 dark:text-slate-300">Username</label><input type="text" required className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 outline-none focus:ring-2 focus:ring-brand-500" value={newUsername} onChange={(e) => setNewUsername(e.target.value)}/></div><div><label className="block text-sm font-medium mb-1 dark:text-slate-300">Password</label><input type="text" required className="w-full p-3 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 outline-none focus:ring-2 focus:ring-brand-500" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}/></div><div><label className="block text-sm font-medium mb-1 dark:text-slate-300">Limit Kredit</label><div className="flex items-center gap-4"><input type="range" min="10" max="500" step="10" className="flex-1 accent-brand-500" value={newCredits} onChange={(e) => setNewCredits(parseInt(e.target.value))}/><span className="font-bold text-brand-600 w-12 text-center">{newCredits}</span></div></div><button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl mt-4">Simpan User</button></form></div></div>)}</div>);
};

const SystemLogs = ({ user }: { user: UserType }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  useEffect(() => {
    const loadLogs = async () => {
       const data = await dbService.getLogs();
       setLogs(data);
    };
    loadLogs();
  }, []);

  const handleClearLogs = async () => {
      if(confirm("Clear all logs?")) {
          await dbService.clearLogs();
          setLogs([]);
      }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Activity className="text-brand-600"/> System Logs
                </h2>
                <p className="text-slate-500 text-sm">Audit trail aktivitas sistem.</p>
            </div>
            <button onClick={handleClearLogs} className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-bold text-sm hover:bg-red-200 transition-colors">
                Clear Logs
            </button>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold text-xs uppercase">
                        <tr>
                            <th className="p-4">Timestamp</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Action</th>
                            <th className="p-4">User</th>
                            <th className="p-4">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                <td className="p-4 whitespace-nowrap text-slate-500">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                        log.type === LogType.ERROR ? 'bg-red-100 text-red-600' :
                                        log.type === LogType.SUCCESS ? 'bg-green-100 text-green-600' :
                                        log.type === LogType.WARNING ? 'bg-orange-100 text-orange-600' :
                                        'bg-blue-100 text-blue-600'
                                    }`}>
                                        {log.type}
                                    </span>
                                </td>
                                <td className="p-4 font-bold text-slate-700 dark:text-slate-200">{log.action}</td>
                                <td className="p-4 text-slate-500">{log.userId}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-xs max-w-xs truncate" title={log.details}>
                                    {log.details}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

const SettingsPage = () => {
    const [settings, setSettings] = useState<SystemSettings>({ 
        ai: { 
            factCheck: true,
            providerConfig: {
                provider: 'GEMINI',
                litellm: { baseUrl: '', apiKey: '', textModel: 'gpt-3.5-turbo', imageModel: 'dall-e-3' }
            }
        }, 
        cron: { enabled: true },
        creditPackages: []
    });
    const [editingPackage, setEditingPackage] = useState<PricingPackage | null>(null);
    
    useEffect(() => {
        dbService.getSettings().then(s => {
            // Ensure default structure if missing
            if (!s.ai.providerConfig) {
                s.ai.providerConfig = {
                    provider: 'GEMINI',
                    litellm: { baseUrl: '', apiKey: '', textModel: 'gpt-3.5-turbo', imageModel: 'dall-e-3' }
                };
            }
            setSettings(s);
        });
    }, []);

    const handleSave = async () => {
        await dbService.saveSettings(settings);
        alert("Settings saved!");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Settings className="text-slate-600"/> Pengaturan Sistem
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
                <div>
                    <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">AI Configuration</h3>
                    
                    {/* Provider Selection */}
                    <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">AI Engine Provider</label>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setSettings({...settings, ai: {...settings.ai, providerConfig: {...settings.ai.providerConfig!, provider: 'GEMINI'}}})}
                                className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${settings.ai.providerConfig?.provider === 'GEMINI' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Gem size={18} /> Google Gemini (Default)
                            </button>
                            <button 
                                onClick={() => setSettings({...settings, ai: {...settings.ai, providerConfig: {...settings.ai.providerConfig!, provider: 'LITELLM'}}})}
                                className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${settings.ai.providerConfig?.provider === 'LITELLM' ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Server size={18} /> LiteLLM / OpenAI
                            </button>
                        </div>

                        {settings.ai.providerConfig?.provider === 'LITELLM' && (
                            <div className="mt-4 space-y-4 animate-fade-in-up">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Base URL</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-2 rounded-lg border border-slate-300 text-sm" 
                                            placeholder="https://api.openai.com/v1"
                                            value={settings.ai.providerConfig.litellm.baseUrl}
                                            onChange={e => setSettings({...settings, ai: {...settings.ai, providerConfig: {...settings.ai.providerConfig!, litellm: {...settings.ai.providerConfig!.litellm, baseUrl: e.target.value}}}})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">API Key</label>
                                        <input 
                                            type="password" 
                                            className="w-full p-2 rounded-lg border border-slate-300 text-sm" 
                                            placeholder="sk-..."
                                            value={settings.ai.providerConfig.litellm.apiKey}
                                            onChange={e => setSettings({...settings, ai: {...settings.ai, providerConfig: {...settings.ai.providerConfig!, litellm: {...settings.ai.providerConfig!.litellm, apiKey: e.target.value}}}})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Text Model Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-2 rounded-lg border border-slate-300 text-sm" 
                                            placeholder="gpt-3.5-turbo"
                                            value={settings.ai.providerConfig.litellm.textModel}
                                            onChange={e => setSettings({...settings, ai: {...settings.ai, providerConfig: {...settings.ai.providerConfig!, litellm: {...settings.ai.providerConfig!.litellm, textModel: e.target.value}}}})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Image Model Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-2 rounded-lg border border-slate-300 text-sm" 
                                            placeholder="dall-e-3"
                                            value={settings.ai.providerConfig.litellm.imageModel}
                                            onChange={e => setSettings({...settings, ai: {...settings.ai, providerConfig: {...settings.ai.providerConfig!, litellm: {...settings.ai.providerConfig!.litellm, imageModel: e.target.value}}}})}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 italic">
                                    Note: Pastikan Base URL kompatibel dengan format OpenAI (e.g. /v1/chat/completions).
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <div>
                            <div className="font-bold text-slate-700 dark:text-slate-300">Strict Fact Checking</div>
                            <div className="text-xs text-slate-500">Verifikasi fakta sejarah/sains pada output AI.</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={settings.ai.factCheck} onChange={e => setSettings({...settings, ai: {...settings.ai, factCheck: e.target.checked}})} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Credit Packages</h3>
                    <div className="space-y-4">
                        {settings.creditPackages?.map((pkg, idx) => (
                            <div key={pkg.id || idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div>
                                    <div className="font-bold text-slate-800 dark:text-white">{pkg.name}</div>
                                    <div className="text-sm text-slate-500">Rp {pkg.price.toLocaleString()} - {pkg.credits} Credits</div>
                                    {pkg.description && <div className="text-xs text-slate-400 mt-1">{pkg.description}</div>}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingPackage(pkg)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                                    <button onClick={() => {
                                        const newPackages = settings.creditPackages?.filter(p => p.id !== pkg.id);
                                        setSettings({...settings, creditPackages: newPackages});
                                    }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => setEditingPackage({id: Date.now().toString(), name: 'New Package', price: 50000, credits: 50, color: 'bg-blue-50 border-blue-100 text-blue-700', description: ''})} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-400 transition-colors flex items-center justify-center gap-2">
                            <Plus size={18} /> Add New Package
                        </button>
                    </div>
                </div>
                 <div>
                    <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">System Automation</h3>
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <div>
                            <div className="font-bold text-slate-700 dark:text-slate-300">Background Cron Jobs</div>
                            <div className="text-xs text-slate-500">Jalankan tugas otomatis (cleanup, sync, dll).</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={settings.cron.enabled} onChange={e => setSettings({...settings, cron: {...settings.cron, enabled: e.target.checked}})} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
                <button onClick={handleSave} className="px-6 py-2 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors">
                    Simpan Perubahan
                </button>
            </div>
            {editingPackage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-md shadow-xl animate-fade-in-up">
                        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Edit Package</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Package Name</label>
                                <input type="text" className="w-full p-2 rounded-lg border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editingPackage.name} onChange={e => setEditingPackage({...editingPackage, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Price (Rp)</label>
                                    <input type="number" className="w-full p-2 rounded-lg border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editingPackage.price} onChange={e => setEditingPackage({...editingPackage, price: parseInt(e.target.value) || 0})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Credits</label>
                                    <input type="number" className="w-full p-2 rounded-lg border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editingPackage.credits} onChange={e => setEditingPackage({...editingPackage, credits: parseInt(e.target.value) || 0})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                                <input type="text" className="w-full p-2 rounded-lg border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editingPackage.description || ''} onChange={e => setEditingPackage({...editingPackage, description: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Color Theme</label>
                                <select className="w-full p-2 rounded-lg border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editingPackage.color} onChange={e => setEditingPackage({...editingPackage, color: e.target.value})}>
                                    <option value="bg-blue-50 border-blue-100 text-blue-700">Blue (Starter)</option>
                                    <option value="bg-green-50 border-green-100 text-green-700">Green (Eco)</option>
                                    <option value="bg-purple-50 border-purple-100 text-purple-700">Purple (Premium)</option>
                                    <option value="bg-orange-50 border-orange-100 text-orange-700">Orange (Gold)</option>
                                    <option value="bg-gradient-to-br from-brand-50 to-orange-50 border-brand-200 text-brand-700">Gradient (Pro)</option>
                                </select>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setEditingPackage(null)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                                <button onClick={() => {
                                    const newPackages = settings.creditPackages ? [...settings.creditPackages] : [];
                                    const idx = newPackages.findIndex(p => p.id === editingPackage.id);
                                    if (idx >= 0) {
                                        newPackages[idx] = editingPackage;
                                    } else {
                                        newPackages.push(editingPackage);
                                    }
                                    setSettings({...settings, creditPackages: newPackages});
                                    setEditingPackage(null);
                                }} className="flex-1 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CronWorker = ({ user }: { user: UserType }) => {
    useEffect(() => {
        const interval = setInterval(async () => {
            const settings = await dbService.getSettings();
            if (settings.cron.enabled) {
               // Placeholder
            }
        }, 60000);
        return () => clearInterval(interval);
    }, [user]);
    return null;
};

const CloudDatabase = () => {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'TURSO' | 'LOCAL'>('LOCAL');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => { 
      const unsub = dbService.subscribe(s => setStatus(s)); 
      const config = dbService.getStoredConfig(); 
      setUrl(config.url || ''); 
      setToken(config.token || ''); 
      return unsub; 
  }, []);

  const handleTest = async () => {
      if(!url || !token) return alert("Isi URL dan Token terlebih dahulu.");
      setTesting(true);
      const ok = await dbService.testConnection(url, token);
      setTesting(false);
      if(ok) alert("Koneksi Berhasil! Silakan klik Save & Connect.");
      else alert("Koneksi Gagal. Periksa URL atau Token.");
  };

  const handleConnect = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      setLoading(true); 
      try { 
          const success = await dbService.setTursoConfig(url, token); 
          if (success) alert("Terhubung ke Turso!"); 
          else alert("Gagal terhubung. Cek URL dan Token."); 
      } catch (e) { 
          alert("Error connection"); 
      } finally { 
          setLoading(false); 
      } 
  };
  
  const handleDisconnect = async () => { 
      await dbService.disconnectTurso(); 
      setUrl(''); 
      setToken(''); 
      alert("Terputus dari Turso. Menggunakan Local Storage."); 
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-purple-100 text-purple-600 rounded-2xl">
                <CloudCog size={32}/>
            </div>
            <div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Cloud Database</h2>
                <p className="text-slate-500 font-medium">Sinkronisasi data bank soal dengan Turso (SQLite Edge).</p>
            </div>
        </div>

        <div className={`p-6 rounded-3xl border transition-all ${status === 'TURSO' ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${status === 'TURSO' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                        {status === 'TURSO' ? <Wifi size={24}/> : <WifiOff size={24}/>}
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg ${status === 'TURSO' ? 'text-green-800' : 'text-slate-700'}`}>
                            {status === 'TURSO' ? 'Terhubung ke Cloud' : 'Mode Offline'}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {status === 'TURSO' ? 'Data tersimpan aman di server Turso.' : 'Data tersimpan di Local Storage browser.'}
                        </p>
                    </div>
                </div>
                {status === 'TURSO' && (
                    <button onClick={handleDisconnect} className="px-6 py-2.5 bg-red-100 text-red-600 rounded-xl font-bold text-sm hover:bg-red-200 transition-colors">
                        Putus Koneksi
                    </button>
                )}
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-700 relative overflow-hidden">
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 ml-1">Database URL (libsql://)</label>
                    <input 
                        type="text" 
                        className="w-full p-4 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-700 font-mono text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-300 text-slate-600" 
                        placeholder="libsql://your-db-name.turso.io" 
                        value={url} 
                        onChange={e => setUrl(e.target.value)} 
                        disabled={status === 'TURSO'}
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 ml-1">Auth Token</label>
                    <div className="relative">
                        <input 
                            type="password" 
                            className="w-full p-4 pr-12 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-700 font-mono text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-300 text-slate-600" 
                            placeholder="ey..." 
                            value={token} 
                            onChange={e => setToken(e.target.value)} 
                            disabled={status === 'TURSO'}
                        />
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button 
                        type="button" 
                        onClick={handleTest}
                        disabled={loading || status === 'TURSO' || !url || !token}
                        className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-700 transition-all disabled:opacity-50"
                    >
                        {testing ? 'Testing...' : 'Test Connection'}
                    </button>
                    
                    <button 
                        onClick={handleConnect} 
                        disabled={loading || status === 'TURSO'} 
                        className="flex-1 py-4 rounded-2xl bg-[#c084fc] hover:bg-[#a855f7] text-white font-bold shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <RefreshCw className="animate-spin" /> : null}
                        {status === 'TURSO' ? 'Saved' : 'Save & Connect'}
                    </button>
                </div>

                <div className="text-center pt-4">
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Pastikan URL dimulai dengan <span className="font-mono text-purple-500">libsql://</span> atau <span className="font-mono text-purple-500">https://</span> (jika HTTP mode).<br/>
                        Token dapat digenerate melalui Turso CLI: <code className="bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-slate-500 font-mono">turso db tokens create [db-name]</code>
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

const Login = ({ onLogin }: { onLogin: (user: UserType) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDbConfig, setShowDbConfig] = useState(false);
  const [dbUrl, setDbUrl] = useState('');
  const [dbToken, setDbToken] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await dbService.authenticate(username, password);
      if (user) {
        onLogin(user);
        navigate('/dashboard');
      } else {
        setError('Username atau password salah');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
      setUsername('guru123');
      setPassword('guru123');
      // Small delay to visually show fill then submit
      setTimeout(() => {
          const doAuth = async () => {
              setLoading(true);
              const user = await dbService.authenticate('guru123', 'guru123');
              if(user) {
                  onLogin(user);
                  navigate('/dashboard');
              }
              setLoading(false);
          };
          doAuth();
      }, 500);
  };

  const handleDbConnect = async () => {
      if(!dbUrl) return;
      const success = await dbService.setTursoConfig(dbUrl, dbToken);
      if(success) alert("Connected to Turso!");
      else alert("Connection failed. Check URL/Token.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans text-slate-800 p-4">
       <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl w-full max-w-[420px] relative">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
             <div className="w-16 h-16 bg-gradient-to-br from-[#f97316] to-[#ea580c] rounded-[1.2rem] flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-xl shadow-orange-500/20">
                Q
             </div>
             <h2 className="text-2xl font-extrabold text-slate-800">Selamat Datang</h2>
             <p className="text-slate-500 font-medium text-sm mt-1">Masuk untuk mengelola bank soal AI.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-2xl mb-6 text-xs font-bold flex items-center gap-2 animate-pulse">
                <AlertCircle size={16}/> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
                <div className="relative">
                   <input
                      type="text"
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400 font-semibold"
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                   />
                   <Users className="absolute left-4 top-3.5 text-slate-400" size={20} />
                </div>
             </div>

             <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                <div className="relative">
                   <input
                      type="password"
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400 font-semibold"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                   />
                   <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                </div>
             </div>

             <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-base mt-2"
             >
                {loading ? <RefreshCw className="animate-spin" /> : <LogIn size={20} />}
                Sign In
             </button>
          </form>

          {/* DB Config Toggle */}
          <div className="mt-8 pt-6 border-t border-slate-100">
             <button 
                onClick={() => setShowDbConfig(!showDbConfig)}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider mb-4"
             >
                <Database size={14} /> Configure Database Connection <ChevronDown size={14} className={`transition-transform ${showDbConfig ? 'rotate-180' : ''}`} />
             </button>
             
             {showDbConfig && (
                 <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-fade-in-down">
                    <input className="w-full mb-2 p-2.5 text-xs border border-slate-200 rounded-xl font-mono" placeholder="Turso DB URL (libsql://...)" value={dbUrl} onChange={e => setDbUrl(e.target.value)} />
                    <input className="w-full mb-3 p-2.5 text-xs border border-slate-200 rounded-xl font-mono" placeholder="Auth Token" type="password" value={dbToken} onChange={e => setDbToken(e.target.value)} />
                    <button onClick={handleDbConnect} className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs py-2.5 rounded-xl font-bold">Save & Connect</button>
                 </div>
             )}

             {/* Quick Login */}
             <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3">QUICK LOGIN (DEMO)</p>
             <button 
                onClick={handleDemoLogin}
                className="w-full py-3 rounded-2xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50 flex items-center justify-between px-4 transition-all group bg-white"
             >
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                       <User size={16} />
                   </div>
                   <span className="text-sm font-bold text-slate-700">Guru (Demo)</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-orange-500 transition-colors">Click to fill</span>
             </button>
          </div>

          {/* Footer Link */}
          <div className="mt-8 text-center">
             <button onClick={() => navigate('/')} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                Back to Homepage
             </button>
          </div>
       </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showKeyManager, setShowKeyManager] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
        const saved = localStorage.getItem('genz_user');
        if (saved) { setUser(JSON.parse(saved)); }
    };
    checkSession();
  }, []);

  const handleLogin = (u: UserType) => { setUser(u); localStorage.setItem('genz_user', JSON.stringify(u)); };
  const handleLogout = () => { setUser(null); localStorage.removeItem('genz_user'); };
  const updateCredits = (newCredits: number) => { if (user) { const updated = { ...user, credits: newCredits }; setUser(updated); localStorage.setItem('genz_user', JSON.stringify(updated)); } };
  const updateApiKeys = (keys: string[]) => { if (user) { const updated = { ...user, apiKeys: keys }; setUser(updated); localStorage.setItem('genz_user', JSON.stringify(updated)); } };

  return (
    <Router>
        <GlobalAndPrintStyles />
        {!user ? (
            <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        ) : (
            <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors font-sans">
                <Sidebar user={user} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} onLogout={handleLogout} onOpenKeyManager={() => setShowKeyManager(true)} />
                {showKeyManager && ( <UserKeyManagerModal user={user} onClose={() => setShowKeyManager(false)} onUpdateKeys={updateApiKeys} /> )}
                <div className="flex-1 md:ml-64 flex flex-col min-h-screen transition-all duration-300">
                    <header className="bg-white dark:bg-slate-800 h-16 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 no-print">
                        <div className="flex items-center gap-4">
                             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl md:hidden text-slate-600 dark:text-slate-300"><Menu size={20} /></button>
                             <h1 className="font-bold text-lg text-slate-800 dark:text-white hidden sm:block">{user.role === Role.ADMIN ? 'Administrator Panel' : 'Teacher Dashboard'}</h1>
                        </div>
                        <div className="flex items-center gap-4"><div className="hidden md:flex flex-col items-end mr-1"><span className="text-sm font-bold text-slate-700 dark:text-slate-200">{user.username}</span><span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{user.role}</span></div><div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-brand-500/20">{user.username.charAt(0).toUpperCase()}</div></div>
                    </header>
                    <main className="p-4 md:p-8 flex-1 overflow-x-hidden">
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<Dashboard user={user} />} />
                            <Route path="/create-quiz" element={<CreateQuiz user={user} onUpdateCredits={updateCredits} />} />
                            <Route path="/history" element={<HistoryArchive user={user} />} />
                            {user.role === Role.ADMIN ? ( <> <Route path="/database" element={<CloudDatabase />} /> <Route path="/users" element={<UserManagement />} /> <Route path="/logs" element={<SystemLogs user={user} />} /> <Route path="/settings" element={<SettingsPage />} /> </> ) : ( <> <Route path="/database" element={<Navigate to="/dashboard" />} /> <Route path="/users" element={<Navigate to="/dashboard" />} /> <Route path="/logs" element={<Navigate to="/dashboard" />} /> <Route path="/settings" element={<Navigate to="/dashboard" />} /> </> )}
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </main>
                </div>
                <CronWorker user={user} />
            </div>
        )}
    </Router>
  );
};

export default App;