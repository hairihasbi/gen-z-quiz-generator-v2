import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, Star, Phone, Shield, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

const Homepage = () => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
           {/* Navigation */}
           <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-orange-100 z-50 transition-all">
               <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/20">Q</div>
                       <span className="text-2xl font-bold tracking-tight text-slate-900">Gen-Z <span className="text-brand-600">Quiz</span></span>
                   </div>
                   <div className="flex items-center gap-8">
                       <div className="hidden md:flex gap-8 text-sm font-semibold text-slate-600">
                           <a href="#about" className="hover:text-brand-600 transition-colors">Tentang Kami</a>
                           <a href="#services" className="hover:text-brand-600 transition-colors">Layanan</a>
                       </div>
                       <Link to="/login" className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-full font-bold hover:bg-brand-700 hover:scale-105 transition-all shadow-xl shadow-brand-500/20">
                           <LogIn size={18} /> Masuk
                       </Link>
                   </div>
               </div>
           </nav>

           {/* Hero Section */}
           <header className="pt-40 pb-24 px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-100 via-slate-50 to-slate-50 overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
               <div className="max-w-5xl mx-auto text-center relative z-10">
                   <div className="inline-flex items-center gap-2 px-4 py-2 bg-white text-brand-700 rounded-full text-sm font-bold mb-8 border border-orange-100 shadow-sm animate-fade-in-up">
                        <Star size={14} className="fill-brand-500 stroke-brand-500"/> Platform Pembuat Soal AI #1 di Indonesia
                   </div>
                   <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight text-slate-900 leading-[1.1]">
                       Revolusi Pembuatan Soal <br/>
                       <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-red-500">Cerdas & Otomatis</span>
                   </h1>
                   <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
                       Hemat waktu Anda hingga 90% dengan generator soal berbasis Gemini AI. 
                       Mendukung Kurikulum Merdeka, format Matematika (LaTeX), dan berbagai bahasa asing.
                   </p>
                   <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                       <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-brand-600 text-white rounded-2xl font-bold text-lg hover:bg-brand-700 hover:-translate-y-1 transition-all shadow-xl shadow-brand-500/30 flex items-center justify-center gap-2">
                           Mulai Buat Soal <ArrowRight size={20}/>
                       </Link>
                   </div>
               </div>
           </header>

           {/* Features / About Section Placeholder */}
           <section id="about" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <span className="text-brand-600 font-bold tracking-wider uppercase text-sm">Tentang Kami</span>
                        <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-slate-900">Mengapa Memilih Gen-Z Quiz?</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">Kami menggabungkan teknologi AI terbaru dengan pedagogi pendidikan untuk menciptakan alat bantu terbaik bagi guru.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 text-center hover:bg-orange-50 transition-colors group">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 text-brand-500 group-hover:scale-110 transition-transform">
                                <Star size={32} fill="currentColor" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-800">AI Presisi Tinggi</h3>
                            <p className="text-slate-500 leading-relaxed">Menggunakan Google Gemini 3 Flash untuk menghasilkan soal yang akurat, relevan, dan sesuai konteks kurikulum.</p>
                        </div>
                        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 text-center hover:bg-orange-50 transition-colors group">
                             <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 text-brand-500 group-hover:scale-110 transition-transform">
                                <Shield size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-800">Cloud Sync (Turso)</h3>
                            <p className="text-slate-500 leading-relaxed">Data tersimpan aman di cloud dengan latensi rendah. Akses bank soal Anda dari perangkat mana saja.</p>
                        </div>
                        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 text-center hover:bg-orange-50 transition-colors group">
                             <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 text-brand-500 group-hover:scale-110 transition-transform">
                                <FileText size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-800">Export Fleksibel</h3>
                            <p className="text-slate-500 leading-relaxed">Unduh soal dalam format PDF atau DOCX dengan tata letak yang rapi, siap untuk dicetak dan dibagikan.</p>
                        </div>
                    </div>
                </div>
           </section>

           {/* Footer */}
           <footer className="bg-slate-900 text-slate-300 py-20 px-4 rounded-t-[3rem]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-xl">Q</div>
                            <span className="text-2xl font-bold text-white">Gen-Z <span className="text-brand-500">Quiz</span></span>
                        </div>
                        <p className="leading-relaxed max-w-sm text-slate-400">
                            Aplikasi pembuat soal otomatis berbasis AI untuk guru modern. 
                            Mewujudkan pendidikan berkualitas yang efisien dan menyenangkan.
                        </p>
                        <div className="flex gap-4 pt-4">
                            {/* Dummy Social Icons */}
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all cursor-pointer">FB</div>
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all cursor-pointer">IG</div>
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all cursor-pointer">TW</div>
                        </div>
                    </div>
                    
                    <div id="services">
                        <h4 className="text-white font-bold text-lg mb-6">Produk & Layanan</h4>
                        <ul className="space-y-4">
                            <li><a href="#" className="hover:text-brand-400 transition-colors flex items-center gap-2"><ArrowRight size={14}/> Generator Soal</a></li>
                            <li><a href="#" className="hover:text-brand-400 transition-colors flex items-center gap-2"><ArrowRight size={14}/> Analisis AI</a></li>
                            <li><a href="#" className="hover:text-brand-400 transition-colors flex items-center gap-2"><ArrowRight size={14}/> API Integration</a></li>
                        </ul>
                    </div>

                    <div id="contact">
                        <h4 className="text-white font-bold text-lg mb-6">Hubungi Kami</h4>
                        <ul className="space-y-4">
                            <li>
                                <a href="https://wa.me/6285248481527" target="_blank" rel="noreferrer" className="flex items-start gap-3 hover:text-green-400 transition-colors group">
                                    <Phone size={20} className="mt-1 group-hover:animate-bounce" /> 
                                    <span>
                                        <span className="block text-xs text-slate-500 uppercase font-bold mb-1">WhatsApp</span>
                                        0852-4848-1527
                                    </span>
                                </a>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 size={20} className="mt-1 text-brand-500" />
                                <span>
                                    <span className="block text-xs text-slate-500 uppercase font-bold mb-1">Jam Operasional</span>
                                    Senin - Jumat<br/>08:00 - 16:00 WITA
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto border-t border-slate-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                    <p>&copy; 2024 Gen-Z Quiz Generator. All rights reserved.</p>
                    <div className="flex gap-8 mt-6 md:mt-0 font-medium">
                        <a href="#" className="hover:text-brand-400 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-brand-400 transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-brand-400 transition-colors">Sitemap</a>
                    </div>
                </div>
           </footer>
        </div>
    );
};

export default Homepage;