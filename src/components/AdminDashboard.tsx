import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  ShieldCheck, 
  Download, 
  Printer, 
  Send, 
  ChevronRight, 
  GraduationCap, 
  Phone, 
  Mail, 
  AlertCircle,
  FileCheck2,
  Calendar,
  Sparkles,
  BookOpen,
  HeartHandshake
} from 'lucide-react';
import { GoogleImportModal } from './GoogleImportModal';

interface AdminDashboardProps {
  onNavigateToSessions: (courseId?: string) => void;
  onNavigateToReports: (courseId?: string, studentId?: string) => void;
  onNavigateToEmails: () => void;
  onNavigateToCourses: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToSessions,
  onNavigateToReports,
  onNavigateToEmails,
  onNavigateToCourses,
}) => {
  const { 
    courses, 
    sessions, 
    users, 
    attendanceRecords, 
    excuses, 
    getAllReportsForCourse, 
    triggerThresholdWarnings 
  } = useAttendance();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'progress' | 'guardians' | 'staff' | 'analytics'>('progress');

  // Enrolled minors
  const minors = users.filter(u => u.role === 'student');
  const instructors = users.filter(u => u.role === 'instructor');
  const educators = users.filter(u => u.role === 'educator');

  // Calculate project hours & sessions totals
  const totalPlannedHours = courses.reduce((acc, c) => acc + c.totalHours, 0);
  const totalPlannedSessions = courses.reduce((acc, c) => acc + c.totalSessions, 0);

  const completedSessions = sessions.filter(s => s.isCompleted);
  const totalDeliveredHours = completedSessions.reduce((acc, s) => acc + s.hours, 0);
  const overallHoursProgressPercent = totalPlannedHours > 0 ? (totalDeliveredHours / totalPlannedHours) * 100 : 0;

  // Dual-signature compliance (signed by both trainer and educator)
  const dualSignedSessions = completedSessions.filter(s => s.signedByInstructor && s.signedByEducator);
  const dualSignaturePercent = completedSessions.length > 0 ? (dualSignedSessions.length / completedSessions.length) * 100 : 100;

  // Calculate overall attendance percent
  const allReports = courses.flatMap(c => getAllReportsForCourse(c.id));
  const avgAttendancePercent = allReports.length > 0
    ? allReports.reduce((acc, r) => acc + r.attendancePercent, 0) / allReports.length
    : 0;

  // Minors at risk (< 80%)
  const minorsAtRisk = allReports.filter(r => r.attendancePercent < 80);
  const pendingExcuses = excuses.filter(e => e.status === 'pending');

  // Age group demographics
  const ageGroups = {
    'under11': minors.filter(m => (m.age || 0) <= 11).length,
    'from12to14': minors.filter(m => (m.age || 0) >= 12 && (m.age || 0) <= 14).length,
    'over15': minors.filter(m => (m.age || 0) >= 15).length,
  };

  // Staff hours breakdown
  const staffAccounting = [
    ...instructors.map(inst => {
      const taughtCourseIds = courses.filter(c => c.instructorEmail === inst.email || inst.enrolledCourseIds.includes(c.id)).map(c => c.id);
      const taughtSessions = completedSessions.filter(s => taughtCourseIds.includes(s.courseId) || s.signedByInstructor);
      const hours = taughtSessions.reduce((acc, s) => acc + s.hours, 0);
      return {
        id: inst.id,
        name: inst.name,
        roleTitle: 'Formatore / Docente',
        email: inst.email,
        hours,
        sessionsCount: taughtSessions.length,
      };
    }),
    ...educators.map(edu => {
      const eduCourseIds = courses.filter(c => c.educatorEmail === edu.email || edu.enrolledCourseIds.includes(c.id)).map(c => c.id);
      const eduSessions = completedSessions.filter(s => eduCourseIds.includes(s.courseId) || s.signedByEducator);
      const hours = eduSessions.reduce((acc, s) => acc + s.hours, 0);
      return {
        id: edu.id,
        name: edu.name,
        roleTitle: 'Educatore Socio-Pedagogico',
        email: edu.email,
        hours,
        sessionsCount: eduSessions.length,
      };
    }),
  ];

  // Send batch alert to guardians
  const handleSendGuardianAlerts = () => {
    const sentCount = triggerThresholdWarnings();
    setNotificationMsg(`Inviate ${sentCount} comunicazioni email di allerta frequenza ai genitori e tutori dei minori sotto soglia.`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Export full administrative report to CSV
  const handleExportFullReport = () => {
    const headers = [
      'Corso Codice',
      'Titolo Corso Minori',
      'Ente Partner',
      'Fascia Età',
      'Formatore',
      'Educatore',
      'Ore Totali Previste',
      'Ore Erogate',
      'Percentuale Avanzamento Ore',
      'Sessioni Svolte',
      'Minori Iscritti',
      'Frequenza Media (%)',
      'Conformità Doppia Firma (%)'
    ];

    const rows = courses.map(c => {
      const cSessions = completedSessions.filter(s => s.courseId === c.id);
      const deliveredHours = cSessions.reduce((acc, s) => acc + s.hours, 0);
      const cReports = getAllReportsForCourse(c.id);
      const avgAtt = cReports.length > 0 ? (cReports.reduce((acc, r) => acc + r.attendancePercent, 0) / cReports.length).toFixed(1) : '100.0';
      const dualSigned = cSessions.filter(s => s.signedByInstructor && s.signedByEducator).length;
      const dualPerc = cSessions.length > 0 ? ((dualSigned / cSessions.length) * 100).toFixed(1) : '100.0';

      return [
        `"${c.code}"`,
        `"${c.title}"`,
        `"${c.partnerEntity || 'Associazione Partner'}"`,
        `"${c.targetAge || '9-17 anni'}"`,
        `"${c.instructorName}"`,
        `"${c.educatorName || 'Dott.ssa Sara D\'Amico'}"`,
        c.totalHours,
        deliveredHours,
        `${((deliveredHours / c.totalHours) * 100).toFixed(1)}%`,
        cSessions.length,
        cReports.length,
        `${avgAtt}%`,
        `${dualPerc}%`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rendicontazione_progetto_minori_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Toast alert */}
      {notificationMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-emerald-700 font-bold hover:underline cursor-pointer p-1">
            Chiudi
          </button>
        </div>
      )}

      {/* Hero Administrative Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-teal-100/50 via-amber-100/20 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 relative z-10">
          <div className="flex items-start gap-3 sm:gap-4 max-w-2xl">
            <img 
              src="/edulabs_banner.jpg" 
              alt="EduLabs Logo" 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 border border-amber-300/80 shadow-xs hidden xs:block"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-teal-100 text-teal-900 border border-teal-200">
                  EduLabs 2026
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                  La città che educa
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">·</span>
                <span className="text-xs text-slate-600 font-medium">InRete Cooperativa Sociale ETS</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                Cruscotto Direzione & Avanzamento Laboratori
              </h1>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Supervisione socio-educativa del Centro Educativo Diffuso per minori 5-17 anni nel territorio di Lamezia Terme. Rilevazione presenze con verbalizzazione congiunta Formatori ed Educatori d'aula, monitoraggio soglie minime di frequenza e rendicontazione enti.
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex-1 sm:flex-none px-3.5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>Importa Google Form / Sheets</span>
            </button>

            <button
              onClick={handleExportFullReport}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
              title="Esporta foglio di calcolo rendicontazione"
            >
              <Download className="w-4 h-4 text-slate-600 shrink-0" />
              <span className="hidden sm:inline">Esporta CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer no-print hidden sm:flex"
              title="Stampa prospetto riepilogativo per enti"
            >
              <Printer className="w-4 h-4 text-slate-600 shrink-0" />
              <span>Stampa</span>
            </button>
          </div>
        </div>

        {/* Global Progress Strip */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Laboratori Diffusi</span>
            <span className="font-bold text-slate-800 text-sm">{courses.length} Laboratori territoriali</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Monte Ore Erogato</span>
            <span className="font-bold text-slate-800 text-sm font-mono">{totalDeliveredHours}h su {totalPlannedHours}h totali</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Minori Coinvolti</span>
            <span className="font-bold text-teal-800 text-sm font-mono">{minors.length} / 220 target attesi</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Soglia Minima Frequenza</span>
            <span className="font-bold text-emerald-700 text-sm">70% per attestato</span>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Hours Progress */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Avanzamento Ore</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
            {overallHoursProgressPercent.toFixed(1)}%
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">
            {totalDeliveredHours}h erogate su {totalPlannedHours}h
          </div>
        </div>

        {/* Global Average Attendance */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Frequenza Media</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-2 font-mono">
            {avgAttendancePercent.toFixed(1)}%
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">
            Media su tutti i laboratori
          </div>
        </div>

        {/* Dual Signature Compliance */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Doppia Firma OK</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 mt-2 font-mono">
            {dualSignaturePercent.toFixed(0)}%
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">
            {dualSignedSessions.length} su {completedSessions.length} validate da entrambi
          </div>
        </div>

        {/* Minors at risk */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Allerta Sotto Soglia</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 mt-2 font-mono">
            {minorsAtRisk.length}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Minori &lt;70%</span>
            {minorsAtRisk.length > 0 && (
              <button
                onClick={handleSendGuardianAlerts}
                className="text-rose-700 hover:text-rose-900 font-bold hover:underline cursor-pointer"
              >
                Invia Avvisi
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation for Detailed Views (Scrollable horizontally on mobile) */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar whitespace-nowrap gap-1">
        <button
          onClick={() => setActiveTab('progress')}
          className={`py-2.5 sm:py-3 px-3.5 sm:px-5 text-xs font-bold border-b-2 cursor-pointer transition-colors shrink-0 ${
            activeTab === 'progress'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Avanzamento dei Laboratori ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab('guardians')}
          className={`py-2.5 sm:py-3 px-3.5 sm:px-5 text-xs font-bold border-b-2 cursor-pointer transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'guardians'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Minori a Rischio & Famiglie</span>
          {minorsAtRisk.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
              {minorsAtRisk.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`py-2.5 sm:py-3 px-3.5 sm:px-5 text-xs font-bold border-b-2 cursor-pointer transition-colors shrink-0 ${
            activeTab === 'staff'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Ore Formatori ed Educatori
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-2.5 sm:py-3 px-3.5 sm:px-5 text-xs font-bold border-b-2 cursor-pointer transition-colors shrink-0 ${
            activeTab === 'analytics'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Dati Demografici & Statistiche
        </button>
      </div>

      {/* TAB 1: Progress per Course */}
      {activeTab === 'progress' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Stato di Avanzamento dei Laboratori Educativi per Minori
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Verbalizzazione congiunta, ore erogate e conformità firme Formatore + Educatore
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium shrink-0">Filtro:</span>
              <select
                value={selectedCourseFilter}
                onChange={e => setSelectedCourseFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-medium cursor-pointer w-full sm:w-auto"
              >
                <option value="all">Tutti i Laboratori</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* MOBILE VIEW FOR COURSE ADVANCEMENT (Cards) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {courses
              .filter(c => selectedCourseFilter === 'all' || c.id === selectedCourseFilter)
              .map(course => {
                const courseSessions = completedSessions.filter(s => s.courseId === course.id);
                const deliveredHours = courseSessions.reduce((acc, s) => acc + s.hours, 0);
                const progressPercent = (deliveredHours / course.totalHours) * 100;
                const courseReports = getAllReportsForCourse(course.id);
                const avgAtt = courseReports.length > 0
                  ? courseReports.reduce((acc, r) => acc + r.attendancePercent, 0) / courseReports.length
                  : 100;
                const dualCount = courseSessions.filter(s => s.signedByInstructor && s.signedByEducator).length;

                return (
                  <div key={course.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            {course.code}
                          </span>
                          <span className="text-[10px] bg-purple-50 text-purple-700 font-semibold px-1.5 py-0.2 rounded">
                            {course.targetAge || 'Minori'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{course.title}</h4>
                        {course.partnerEntity && (
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                            a cura di <strong className="text-slate-700">{course.partnerEntity}</strong>
                          </div>
                        )}
                      </div>

                      <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono shrink-0 ${
                        avgAtt >= 80 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                      }`}>
                        {avgAtt.toFixed(1)}% presenze
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1 font-mono text-slate-600">
                        <span>Avanzamento: <strong>{deliveredHours}h</strong> su {course.totalHours}h</span>
                        <span>{progressPercent.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, progressPercent)}%` }}
                        />
                      </div>
                    </div>

                    {/* Operators & Dual Signatures */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Docente:</span>
                        <span className="font-bold text-slate-800">{course.instructorName}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Educatore:</span>
                        <span className="font-bold text-purple-700">{course.educatorName || "Dott.ssa Sara D'Amico"}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                        <span className="text-slate-500">Conformità doppie firme:</span>
                        <span className="font-bold text-purple-700 font-mono flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{dualCount}/{courseSessions.length} sessioni validate</span>
                        </span>
                      </div>
                    </div>

                    {/* Mobile Card Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onNavigateToSessions(course.id)}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold text-center cursor-pointer transition-colors shadow-2xs"
                      >
                        Apri Registro
                      </button>
                      <button
                        onClick={() => onNavigateToReports(course.id)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold text-center border border-slate-200 cursor-pointer transition-colors"
                      >
                        Vedi Report
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px]">
                  <th className="py-3 px-4">Laboratorio & Ente</th>
                  <th className="py-3 px-4">Operatori Assegnati (Formatore + Educatore)</th>
                  <th className="py-3 px-4">Avanzamento Ore</th>
                  <th className="py-3 px-4 text-center">Sessioni</th>
                  <th className="py-3 px-4 text-center">Frequenza Media</th>
                  <th className="py-3 px-4 text-center">Firme Conformi</th>
                  <th className="py-3 px-4 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses
                  .filter(c => selectedCourseFilter === 'all' || c.id === selectedCourseFilter)
                  .map(course => {
                    const courseSessions = completedSessions.filter(s => s.courseId === course.id);
                    const deliveredHours = courseSessions.reduce((acc, s) => acc + s.hours, 0);
                    const progressPercent = (deliveredHours / course.totalHours) * 100;
                    const courseReports = getAllReportsForCourse(course.id);
                    const avgAtt = courseReports.length > 0
                      ? courseReports.reduce((acc, r) => acc + r.attendancePercent, 0) / courseReports.length
                      : 100;
                    const dualCount = courseSessions.filter(s => s.signedByInstructor && s.signedByEducator).length;

                    return (
                      <tr key={course.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{course.title}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono font-medium">{course.code}</span>
                            <span>·</span>
                            <span className="text-purple-700 font-medium truncate max-w-[200px]">
                              {course.partnerEntity}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-slate-900 font-semibold">{course.instructorName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <span className="text-purple-600 font-medium">Educatore:</span>
                            <span>{course.educatorName || "Dott.ssa Sara D'Amico"}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 w-48">
                          <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                            <span className="font-bold text-slate-800">{deliveredHours}h / {course.totalHours}h</span>
                            <span className="text-slate-500">{progressPercent.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full" 
                              style={{ width: `${Math.min(100, progressPercent)}%` }}
                            />
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center tabular-nums font-mono">
                          <span className="font-bold text-slate-900">{courseSessions.length}</span>
                          <span className="text-slate-400"> / {course.totalSessions}</span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] font-mono ${
                            avgAtt >= 80 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                          }`}>
                            {avgAtt.toFixed(1)}%
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                            <ShieldCheck className="w-3 h-3 text-purple-600" />
                            <span>{dualCount}/{courseSessions.length}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onNavigateToSessions(course.id)}
                              className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors"
                            >
                              Registro
                            </button>
                            <button
                              onClick={() => onNavigateToReports(course.id)}
                              className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                            >
                              Report
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Guardians & Minors at risk */}
      {activeTab === 'guardians' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Minori con Frequenza Inferiore alla Soglia dell'80%
              </h3>
              <p className="text-xs text-slate-500">
                Contatto immediato dei genitori/tutori legali per prevenire l'esclusione dal certificato
              </p>
            </div>
            {minorsAtRisk.length > 0 && (
              <button
                onClick={handleSendGuardianAlerts}
                className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Invia Avviso a Tutte le Famiglie</span>
              </button>
            )}
          </div>

          {minorsAtRisk.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Tutti i minori hanno una presenza regolare!</p>
              <p className="text-xs text-slate-500">Nessun allievo risulta attualmente sotto la soglia minima dell'80%.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {minorsAtRisk.map((rep, idx) => {
                const minorUser = minors.find(m => m.id === rep.studentId);

                return (
                  <div key={idx} className="border border-rose-200 bg-rose-50/40 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-slate-900">{rep.studentName}</span>
                          <span className="text-[11px] text-slate-500 ml-2">
                            {rep.age ? `${rep.age} anni` : ''} · {rep.studentNumber}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 font-mono">
                          {rep.attendancePercent.toFixed(1)}%
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-slate-700 font-medium">
                        Corso: <strong>{rep.courseTitle}</strong>
                      </div>

                      <div className="mt-3 pt-3 border-t border-rose-200/60 text-xs space-y-1.5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Riferimento Famiglia / Tutore Legale:
                        </div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span>{minorUser?.guardianName || rep.guardianName || 'Genitore non specificato'}</span>
                        </div>
                        
                        {/* 1-tap call & email buttons */}
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          {(minorUser?.guardianPhone || rep.guardianPhone) && (
                            <a 
                              href={`tel:${minorUser?.guardianPhone || rep.guardianPhone}`}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Phone className="w-3.5 h-3.5 text-blue-600" />
                              <span>{minorUser?.guardianPhone || rep.guardianPhone}</span>
                            </a>
                          )}
                          {(minorUser?.guardianEmail || rep.guardianEmail) && (
                            <a 
                              href={`mailto:${minorUser?.guardianEmail || rep.guardianEmail}`}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 truncate max-w-[180px]"
                            >
                              <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate">{minorUser?.guardianEmail || rep.guardianEmail}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px]">
                        Assenze: {rep.absentCount} lezioni ({rep.totalHoursCourse - rep.totalHoursAttended}h perse)
                      </span>
                      <button
                        onClick={() => onNavigateToReports(rep.courseId, rep.studentId)}
                        className="px-2.5 py-1 bg-white border border-rose-200 rounded text-rose-800 font-semibold hover:bg-rose-50 cursor-pointer"
                      >
                        Scheda
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Staff & Operators Hours Accounting */}
      {activeTab === 'staff' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Rendicontazione Ore Lavorate per Operatori (Formatori ed Educatori)
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Monte ore verificato tramite firma congiunta e registro delle presenze
              </p>
            </div>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Totale Operatori: <strong>{staffAccounting.length}</strong>
            </span>
          </div>

          {/* MOBILE CARDS FOR STAFF */}
          <div className="block md:hidden divide-y divide-slate-100">
            {staffAccounting.map(member => (
              <div key={member.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">{member.name}</div>
                  <div className="mt-0.5">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      member.roleTitle.includes('Educatore')
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {member.roleTitle}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{member.email}</div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black font-mono text-slate-900">{member.hours}h</div>
                  <div className="text-[10px] text-slate-500">{member.sessionsCount} sessioni</div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE FOR STAFF */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px]">
                  <th className="py-3 px-4">Operatore</th>
                  <th className="py-3 px-4">Qualifica & Ruolo</th>
                  <th className="py-3 px-4">Email Istituzionale</th>
                  <th className="py-3 px-4 text-center">Sessioni Presidiate</th>
                  <th className="py-3 px-4 text-right">Ore Erogate Rendicontabili</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffAccounting.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {member.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        member.roleTitle.includes('Educatore')
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {member.roleTitle}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {member.email}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {member.sessionsCount} sessioni
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-mono font-bold text-base text-slate-900">
                      {member.hours}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Demographic Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Distribuzione Fasce d'Età Minori
            </h4>
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span>9 - 11 anni (Primaria / Junior)</span>
                  <span className="font-bold">{ageGroups.under11} minori</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(ageGroups.under11 / Math.max(1, minors.length)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span>12 - 14 anni (Secondaria I grado)</span>
                  <span className="font-bold">{ageGroups.from12to14} minori</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${(ageGroups.from12to14 / Math.max(1, minors.length)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span>15 - 17 anni (Adolescenti / Teen)</span>
                  <span className="font-bold">{ageGroups.over15} minori</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full" 
                    style={{ width: `${(ageGroups.over15 / Math.max(1, minors.length)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Modalità Ritiro & Uscita Minori
            </h4>
            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-700">Ritiro a cura Genitori / Delegati</span>
                <span className="font-bold text-slate-900 font-mono">
                  {minors.filter(m => !m.selfDismissalAuthorized).length} minori
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg text-emerald-900">
                <span className="font-medium">Autorizzazione Uscita Autonoma (≥ 14a)</span>
                <span className="font-bold font-mono">
                  {minors.filter(m => m.selfDismissalAuthorized).length} minori
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg text-amber-900">
                <span className="font-medium">Minori con Note Sanitarie / BES</span>
                <span className="font-bold font-mono">
                  {minors.filter(m => m.allergiesNotes && m.allergiesNotes !== 'Nessuna').length} minori
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sorgente Dati Anagrafica
            </h4>
            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-700">Iscrizioni da Google Form / Sheets</span>
                <span className="font-bold text-emerald-600 font-mono">
                  {minors.filter(m => m.importedFromGoogle).length} minori
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-700">Giustificazioni Genitori Pendenti</span>
                <span className="font-bold text-purple-600 font-mono">
                  {pendingExcuses.length} in attesa
                </span>
              </div>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer transition-colors"
              >
                Importa altri dati da Google Sheets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Import Modal */}
      <GoogleImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={count => {
          setNotificationMsg(`Importazione completata: ${count} minori registrati/aggiornati con successo da Google Sheets!`);
          setTimeout(() => setNotificationMsg(null), 5000);
        }}
      />
    </div>
  );
};
