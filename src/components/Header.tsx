import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { 
  Users, 
  GraduationCap, 
  ShieldCheck, 
  ChevronDown, 
  RotateCcw,
  Check,
  FileSpreadsheet,
  HeartHandshake,
  BookOpen,
  LayoutDashboard,
  ClipboardCheck,
  BarChart3,
  Mail,
  Menu,
  X,
  Layers,
  Sparkles,
  PhoneCall,
  Info,
  Building2,
  MapPin
} from 'lucide-react';
import { DEFAULT_PROJECT_CONFIG } from '../data/projectConfig';

interface HeaderProps {
  activeTab: 'dashboard' | 'sessions' | 'reports' | 'emails' | 'courses';
  setActiveTab: (tab: 'dashboard' | 'sessions' | 'reports' | 'emails' | 'courses') => void;
  onOpenImportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  setActiveTab,
  onOpenImportModal
}) => {
  const { currentUser, setCurrentUser, users, resetToDefaultData, courses } = useAttendance();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const activeCoursesWithLiveSession = courses.filter(c => c.isSessionActive);

  const roleLabel = 
    currentUser.role === 'admin' ? 'Amministratore' :
    currentUser.role === 'instructor' ? 'Formatore' :
    currentUser.role === 'educator' ? 'Educatore' :
    'Minore / Famiglia';

  const roleBgAvatar = 
    currentUser.role === 'admin' ? 'bg-teal-700' :
    currentUser.role === 'instructor' ? 'bg-sky-600' :
    currentUser.role === 'educator' ? 'bg-amber-600' :
    'bg-emerald-600';

  return (
    <>
      {/* 1. INSTITUTIONAL TOP RIBBON (Comune di Lamezia Terme, Fondo Famiglia, CUP) */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-slate-200 text-[10px] sm:text-[11px] py-1 px-3 sm:px-6 border-b border-teal-900/60 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 font-medium">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-white flex items-center gap-1">
              <Building2 className="w-3 h-3 text-teal-400 shrink-0" />
              <span>Comune di Lamezia Terme</span>
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-teal-200 truncate">Fondo Politiche della Famiglia (Presidenza del Consiglio dei Ministri)</span>
          </div>

          <div className="flex items-center gap-3 text-slate-400 font-mono text-[10px] shrink-0">
            <span>CUP: <strong className="text-teal-300 font-bold">{DEFAULT_PROJECT_CONFIG.cup}</strong></span>
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline text-slate-300">Promosso da: <strong className="text-white">InRete ETS</strong></span>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs transition-shadow">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-15 sm:h-16">
            
            {/* Logo Brand EduLabs 2026 - La città che educa */}
            <button 
              onClick={() => {
                setActiveTab('dashboard');
                setIsMobileMenuOpen(false);
              }} 
              className="text-left group cursor-pointer focus:outline-none flex items-center gap-2.5"
            >
              {/* EduLabs Brand Geometric Icon */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 via-teal-600 to-sky-700 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0 relative overflow-hidden border border-teal-400/40">
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 opacity-90" />
                <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 rounded-full bg-orange-500 opacity-90" />
                <span className="relative z-10 text-white font-black tracking-tight text-xs">EL</span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                    Edu<span className="text-amber-600">Labs</span>
                  </span>
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono">
                    2026
                  </span>
                </div>
                <span className="block text-[10px] text-teal-800 font-extrabold uppercase tracking-wider -mt-0.5 truncate">
                  La città che educa
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-5 lg:gap-6">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`text-xs font-bold transition-colors cursor-pointer py-1.5 border-b-2 ${
                  activeTab === 'dashboard'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {currentUser.role === 'admin' 
                  ? 'Cruscotto Direzione' 
                  : currentUser.role === 'student' 
                  ? 'Diario di Bordo Minore' 
                  : 'Dashboard Operatori'}
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`text-xs font-bold transition-colors cursor-pointer py-1.5 border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'sessions'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Registro Presenze</span>
                {activeCoursesWithLiveSession.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Laboratorio live attivo" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`text-xs font-bold transition-colors cursor-pointer py-1.5 border-b-2 ${
                  activeTab === 'reports'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Rendicontazione & Dati
              </button>
              <button
                onClick={() => setActiveTab('emails')}
                className={`text-xs font-bold transition-colors cursor-pointer py-1.5 border-b-2 ${
                  activeTab === 'emails'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Notifiche Famiglie
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`text-xs font-bold transition-colors cursor-pointer py-1.5 border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'courses'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Gli 8 Laboratori</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              </button>
            </nav>

            {/* Right Action Bar */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Google Sheets Import Button */}
              <button
                onClick={onOpenImportModal}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-teal-900 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="Importa anagrafica minori da Google Form o Google Sheets"
              >
                <FileSpreadsheet className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="hidden sm:inline">Importa Google Sheets</span>
                <span className="sm:hidden text-[11px]">Importa</span>
              </button>

              {/* Profile / Role Switcher Trigger */}
              <button
                onClick={() => setIsUserDropdownOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 pr-2 sm:pr-3 py-1 sm:py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-lg text-slate-800 text-xs font-medium transition-colors cursor-pointer border border-slate-200/60 max-w-[150px] sm:max-w-none"
                aria-label="Seleziona profilo di ruolo"
              >
                <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 ${roleBgAvatar}`}>
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="truncate max-w-[120px] font-bold text-slate-900 text-xs">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {roleLabel}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>

              {/* Mobile Menu Drawer Toggle Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Apri menu mobile"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly, fixed at bottom) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => {
            setActiveTab('dashboard');
            setIsMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-teal-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight truncate">
            {currentUser.role === 'student' ? 'Diario' : 'Direzione'}
          </span>
        </button>

        {/* Tab 2: Registro Presenze */}
        <button
          onClick={() => {
            setActiveTab('sessions');
            setIsMobileMenuOpen(false);
          }}
          className={`relative flex flex-col items-center justify-center min-w-[56px] py-1 px-1 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'sessions'
              ? 'text-teal-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <ClipboardCheck className={`w-5 h-5 ${activeTab === 'sessions' ? 'stroke-[2.5]' : ''}`} />
            {activeCoursesWithLiveSession.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight truncate">Registro</span>
        </button>

        {/* Tab 3: Report & Dati */}
        <button
          onClick={() => {
            setActiveTab('reports');
            setIsMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'reports'
              ? 'text-teal-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${activeTab === 'reports' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight truncate">Rendiconto</span>
        </button>

        {/* Tab 4: Notifiche Famiglie */}
        <button
          onClick={() => {
            setActiveTab('emails');
            setIsMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'emails'
              ? 'text-teal-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className={`w-5 h-5 ${activeTab === 'emails' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight truncate">Famiglie</span>
        </button>

        {/* Tab 5: Menu Altro / Laboratori */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'courses' || isMobileMenuOpen
              ? 'text-amber-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight truncate">Laboratori</span>
        </button>
      </nav>

      {/* MOBILE FULL DRAWER / BOTTOM SHEET FOR "ALTRO & LABORATORI" */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150">
          <div className="bg-white rounded-t-2xl max-h-[88vh] overflow-y-auto p-5 space-y-4 shadow-2xl border-t border-slate-200">
            {/* Sheet Handle & Close */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-teal-600" />
                <h3 className="text-sm font-black text-slate-900">
                  EduLabs 2026 · La città che educa
                </h3>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setActiveTab('courses');
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-left hover:bg-teal-100 transition-colors cursor-pointer"
              >
                <BookOpen className="w-5 h-5 text-teal-700 mb-1" />
                <div className="text-xs font-bold text-teal-950">Gli 8 Laboratori</div>
                <div className="text-[10px] text-teal-700">Dettagli ed enti partner</div>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenImportModal();
                }}
                className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-left hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 mb-1" />
                <div className="text-xs font-bold text-emerald-950">Importa Anagrafica</div>
                <div className="text-[10px] text-emerald-700">Google Form o Sheets</div>
              </button>

              <button
                onClick={() => {
                  setIsUserDropdownOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 text-amber-600 mb-1" />
                <div className="text-xs font-bold text-amber-950">Cambia Profilo</div>
                <div className="text-[10px] text-amber-700">Attuale: {roleLabel}</div>
              </button>

              <button
                onClick={() => {
                  setShowResetConfirm(true);
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-5 h-5 text-rose-600 mb-1" />
                <div className="text-xs font-bold text-rose-950">Ripristina Demo</div>
                <div className="text-[10px] text-rose-700">Reimposta dati di test</div>
              </button>
            </div>

            {/* List of the 8 workshops quick access */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Laboratori Attivi a Lamezia Terme</span>
                <span className="font-mono text-teal-700 font-bold">{courses.length} laboratori</span>
              </div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {courses.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveTab('sessions');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-800 truncate">{c.title}</div>
                      <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                        <span className="font-medium text-teal-700">{c.partnerEntity}</span>
                        {c.venue && <span>· {c.venue}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded shrink-0 border border-teal-200">
                      {c.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Project Institutional Info Footer */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-50 to-slate-100 border border-teal-200 text-[11px] text-slate-700 space-y-1">
              <div className="font-black text-teal-950 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-700" />
                <span>EduLabs 2026 · Centro Educativo Diffuso</span>
              </div>
              <div className="text-slate-600">
                Finanziato dal Comune di Lamezia Terme con risorse del Fondo per le politiche della famiglia
              </div>
              <div className="font-mono text-[10px] text-teal-800 pt-0.5 font-bold">
                CUP: C89I26000930001 · Soggetto promotore: InRete Cooperativa Sociale ETS
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER ROLE SWITCHER MODAL */}
      {isUserDropdownOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Seleziona Profilo Utente</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Alterna tra Direzione Progetto, Formatori, Educatori e Famiglie
                </p>
              </div>
              <button
                onClick={() => setIsUserDropdownOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Roles List */}
            <div className="p-3 overflow-y-auto space-y-3 flex-1">
              {/* Admins */}
              <div>
                <div className="px-2 py-1 text-[11px] font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Direzione & Coordinamento Progetto (InRete ETS)</span>
                </div>
                <div className="space-y-1 mt-1">
                  {users.filter(u => u.role === 'admin').map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setIsUserDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer border ${
                        currentUser.id === u.id
                          ? 'bg-teal-50 text-teal-950 font-bold border-teal-300 shadow-2xs'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[10px] text-slate-500 font-normal truncate">{u.email}</div>
                        </div>
                      </div>
                      {currentUser.id === u.id && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructors */}
              <div>
                <div className="px-2 py-1 text-[11px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                  <span>Formatori / Docenti dei Laboratori</span>
                </div>
                <div className="space-y-1 mt-1">
                  {users.filter(u => u.role === 'instructor').map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setIsUserDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer border ${
                        currentUser.id === u.id
                          ? 'bg-sky-50 text-sky-950 font-bold border-sky-300 shadow-2xs'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[10px] text-slate-500 font-normal truncate">{u.email}</div>
                        </div>
                      </div>
                      {currentUser.id === u.id && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Educators */}
              <div>
                <div className="px-2 py-1 text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
                  <span>Educatori Socio-Pedagogici</span>
                </div>
                <div className="space-y-1 mt-1">
                  {users.filter(u => u.role === 'educator').map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setIsUserDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer border ${
                        currentUser.id === u.id
                          ? 'bg-amber-50 text-amber-950 font-bold border-amber-300 shadow-2xs'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[10px] text-slate-500 font-normal truncate">{u.email}</div>
                        </div>
                      </div>
                      {currentUser.id === u.id && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minors & Families */}
              <div>
                <div className="px-2 py-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Minori & Famiglie (Portale Genitori)</span>
                </div>
                <div className="space-y-1 mt-1">
                  {users.filter(u => u.role === 'student').slice(0, 6).map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setIsUserDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer border ${
                        currentUser.id === u.id
                          ? 'bg-emerald-50 text-emerald-950 font-bold border-emerald-300 shadow-2xs'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-slate-900">{u.name} {u.age ? `(${u.age} anni)` : ''}</div>
                          <div className="text-[10px] text-slate-500 font-normal truncate">
                            Genitore: {u.guardianName || 'N/D'} · {u.guardianPhone || ''}
                          </div>
                        </div>
                      </div>
                      {currentUser.id === u.id && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer py-1.5 px-2 rounded-lg hover:bg-rose-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ripristina Dati Iniziali</span>
              </button>
              <button
                onClick={() => setIsUserDropdownOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Ripristinare i dati predefiniti EduLabs?</h3>
            <p className="text-sm text-slate-600 mt-2">
              Questa azione reimposterà tutte le presenze dei minori, i registri delle lezioni, i dati importati e le notifiche allo stato iniziale dimostrativo del progetto.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  resetToDefaultData();
                  setShowResetConfirm(false);
                  setIsUserDropdownOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 cursor-pointer"
              >
                Conferma Ripristino
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
