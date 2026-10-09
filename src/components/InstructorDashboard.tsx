import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { 
  Users, 
  AlertTriangle, 
  Clock, 
  Send, 
  CheckCircle2, 
  ChevronRight, 
  Radio, 
  QrCode,
  FileText,
  Mail,
  ShieldCheck,
  Calendar,
  Lock
} from 'lucide-react';

interface InstructorDashboardProps {
  onNavigateToSessions: (courseId?: string) => void;
  onNavigateToReports: (courseId?: string, studentId?: string) => void;
  onNavigateToEmails: () => void;
}

export const InstructorDashboard: React.FC<InstructorDashboardProps> = ({
  onNavigateToSessions,
  onNavigateToReports,
  onNavigateToEmails,
}) => {
  const { 
    currentUser, 
    courses, 
    sessions, 
    users, 
    attendanceRecords,
    excuses,
    toggleSessionActive,
    signAndLockSession,
    triggerThresholdWarnings,
    triggerPreSessionReminders,
    getAllReportsForCourse
  } = useAttendance();

  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [showQrModal, setShowQrModal] = useState<string | null>(null);

  // Filter courses relevant to instructor (or all if admin)
  const accessibleCourses = currentUser.role === 'admin'
    ? courses
    : courses.filter(c => currentUser.enrolledCourseIds.includes(c.id));

  // Compute aggregated stats
  const totalStudents = users.filter(u => u.role === 'student').length;
  
  // All reports across accessible courses
  const allReports = accessibleCourses.flatMap(c => getAllReportsForCourse(c.id));
  
  const totalReportsCount = allReports.length || 1;
  const avgAttendancePercent = allReports.reduce((acc, r) => acc + r.attendancePercent, 0) / totalReportsCount;
  
  const atRiskStudents = allReports.filter(r => r.attendancePercent < 80);
  const pendingExcuses = excuses.filter(e => e.status === 'pending');

  // Find currently active sessions
  const activeCourses = accessibleCourses.filter(c => c.isSessionActive);
  const liveSession = activeCourses.length > 0 
    ? sessions.find(s => s.courseId === activeCourses[0].id && !s.isCompleted)
    : null;

  const handleSendBatchWarning = () => {
    const sentCount = triggerThresholdWarnings(selectedCourseFilter === 'all' ? undefined : selectedCourseFilter);
    setNotificationBanner(`Inviate con successo ${sentCount} notifiche email di allerta agli studenti con presenza inferiore all'80%.`);
    setTimeout(() => setNotificationBanner(null), 5000);
  };

  const handleSendPreReminder = (courseId: string) => {
    const sentCount = triggerPreSessionReminders(courseId);
    setNotificationBanner(`Inviati ${sentCount} promemoria email con codice check-in per il corso selezionato.`);
    setTimeout(() => setNotificationBanner(null), 5000);
  };

  return (
    <div className="space-y-8">
      {/* Notification Banner */}
      {notificationBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-lg text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notificationBanner}</span>
          </div>
          <button 
            onClick={() => setNotificationBanner(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-medium cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      )}

      {/* Hero Welcome & Role Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>{currentUser.role === 'admin' ? 'Pannello Amministrazione Istituzionale' : 'Console Docente Ufficiale'}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Benvenuto, {currentUser.name}
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Sistema integrato di rilevazione presenze in tempo reale, monitoraggio delle soglie minime di frequenza e reportistica automatica per i 10 percorsi formativi online.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSendBatchWarning}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Invia Alert Email ({atRiskStudents.length} studenti &lt;80%)</span>
            </button>
            <button
              onClick={() => onNavigateToReports()}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Genera Report Generali</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Corsi Attivi</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 tabular-nums">
              {accessibleCourses.length}
            </span>
            <span className="text-xs text-slate-500">di 10 online</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {accessibleCourses.reduce((acc, c) => acc + c.totalHours, 0)} ore didattiche complessive
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Presenza Media Complessiva</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-bold tabular-nums ${avgAttendancePercent >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {avgAttendancePercent.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500">soglia 80%</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Calcolata su tutte le sessioni concluse
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Studenti Sotto Soglia</span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-bold tabular-nums ${atRiskStudents.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {atRiskStudents.length}
            </span>
            <span className="text-xs text-rose-600 font-medium">a rischio attestato</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Notifiche automatiche attive
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Giustificativi Pendenti</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 tabular-nums">
              {pendingExcuses.length}
            </span>
            <span className="text-xs text-slate-500">da revisionare</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Valuta per aggiornare le ore
          </div>
        </div>
      </div>

      {/* Active Live Session Spotlight (If Any) */}
      {activeCourses.length > 0 && (
        <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Sessione Aula Live in Corso
                </span>
                <span className="text-slate-400 text-xs">·</span>
                <span className="text-xs text-slate-300 font-medium">{activeCourses[0].code}</span>
              </div>
              <h2 className="text-xl font-bold text-white">
                {activeCourses[0].title}
              </h2>
              <p className="text-xs text-slate-300 max-w-xl">
                {liveSession ? liveSession.topic : 'Sessione didattica in corso di erogazione streaming.'}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                <span>Docente: {activeCourses[0].instructorName}</span>
                <span>·</span>
                <span>Orario: {activeCourses[0].schedule}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
              <div className="text-center sm:text-left">
                <div className="text-[11px] font-bold text-slate-300 uppercase">
                  Appello Operatori Presenti
                </div>
                <div className="text-xs text-purple-300 mt-1">
                  Formatore: {activeCourses[0].instructorName}<br/>
                  Educatore: {activeCourses[0].educatorName || "Dott.ssa Sara D'Amico"}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  I minori vengono registrati direttamente sul registro
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <button
                  onClick={() => onNavigateToSessions(activeCourses[0].id)}
                  className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Apri Appello & Firme</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: At-Risk Students & 10 Online Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: 10 Courses Overview (2 cols width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Catalogo 10 Corsi Online</h2>
              <p className="text-xs text-slate-500">Monitoraggio registri, ore erogate e stato sessioni</p>
            </div>
            <button
              onClick={() => onNavigateToSessions()}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Vedi tutti i registri</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {accessibleCourses.map(course => {
              const courseReports = getAllReportsForCourse(course.id);
              const enrolledCount = courseReports.length;
              const courseCompletedSessions = sessions.filter(s => s.courseId === course.id && s.isCompleted).length;
              const completedHours = sessions
                .filter(s => s.courseId === course.id && s.isCompleted)
                .reduce((acc, s) => acc + s.hours, 0);
              const courseAttendanceAvg = enrolledCount > 0
                ? courseReports.reduce((acc, r) => acc + r.attendancePercent, 0) / enrolledCount
                : 100;
              const criticalCount = courseReports.filter(r => r.attendancePercent < 80).length;

              return (
                <div
                  key={course.id}
                  className="bg-white border border-slate-200 rounded-xl p-4.5 hover:border-slate-300 transition-all shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {course.code}
                        </span>
                        <span className="text-xs text-slate-500">{course.category}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-500">{course.level}</span>
                        {course.isSessionActive && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                            Sessione Live
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer" onClick={() => onNavigateToSessions(course.id)}>
                        {course.title}
                      </h3>
                      <div className="text-xs text-slate-500">
                        Docente: <span className="font-medium text-slate-700">{course.instructorName}</span> · {course.schedule}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <div className="text-xs font-semibold text-slate-900 tabular-nums">
                          {courseAttendanceAvg.toFixed(1)}% presenze
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {courseCompletedSessions}/{course.totalSessions} lez. ({completedHours}h/{course.totalHours}h)
                        </div>
                        {criticalCount > 0 && (
                          <div className="text-[11px] font-semibold text-rose-600">
                            {criticalCount} sotto l'80%
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleSessionActive(course.id)}
                          title={course.isSessionActive ? "Disattiva sessione" : "Attiva check-in rapido"}
                          className={`p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            course.isSessionActive
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          <Radio className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onNavigateToSessions(course.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Registro
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Students at Risk & Actions */}
        <div className="space-y-6">
          {/* Risk Radar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">Studenti Sotto Soglia (&lt;80%)</h3>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                {atRiskStudents.length} critici
              </span>
            </div>

            <div className="mt-3 divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {atRiskStudents.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  Nessuno studente attualmente sotto la soglia minima dell'80%. Ottimo risultato!
                </div>
              ) : (
                atRiskStudents.map((rep, idx) => (
                  <div key={`${rep.studentId}-${rep.courseId}-${idx}`} className="py-3 flex items-center justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {rep.studentName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {rep.courseTitle}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {rep.studentNumber} · {rep.absentCount} assenze
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block font-mono text-xs font-bold text-rose-600 tabular-nums bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {rep.attendancePercent.toFixed(1)}%
                      </span>
                      <div className="mt-1">
                        <button
                          onClick={() => onNavigateToReports(rep.courseId, rep.studentId)}
                          className="text-[11px] font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          Apri Report
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={handleSendBatchWarning}
                disabled={atRiskStudents.length === 0}
                className="w-full py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Invia Diffida Formale Via Email</span>
              </button>
            </div>
          </div>

          {/* Pending Excuses Quick Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Richieste Giustificativo</h3>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                {pendingExcuses.length} in attesa
              </span>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {pendingExcuses.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  Tutti i certificati di assenza sono stati esaminati.
                </div>
              ) : (
                pendingExcuses.map(exc => (
                  <div key={exc.id} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{exc.studentName}</span>
                      <span className="text-[11px] text-slate-400">{exc.sessionDate}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 italic">
                      "{exc.reason}"
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        onClick={() => onNavigateToSessions(exc.courseId)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        Revisiona nel registro &rarr;
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Presentation Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center border border-slate-200 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Check-in Presenza Live</h3>
            <p className="text-xs text-slate-500 mt-1">Inquadra o inserisci il codice di convalida</p>

            <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-xl inline-block shadow-inner">
              {/* Scalable SVG QR Representation */}
              <div className="w-48 h-48 bg-white p-3 rounded-lg border border-slate-200 flex flex-col items-center justify-center shadow-xs">
                <svg className="w-40 h-40" viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer corner anchors */}
                  <rect x="5" y="5" width="25" height="25" rx="3" fill="#0f172a" />
                  <rect x="10" y="10" width="15" height="15" fill="#ffffff" />
                  <rect x="13" y="13" width="9" height="9" fill="#0f172a" />

                  <rect x="70" y="5" width="25" height="25" rx="3" fill="#0f172a" />
                  <rect x="75" y="10" width="15" height="15" fill="#ffffff" />
                  <rect x="78" y="13" width="9" height="9" fill="#0f172a" />

                  <rect x="5" y="70" width="25" height="25" rx="3" fill="#0f172a" />
                  <rect x="10" y="75" width="15" height="15" fill="#ffffff" />
                  <rect x="13" y="78" width="9" height="9" fill="#0f172a" />

                  {/* Dense authentic QR dots */}
                  <rect x="35" y="10" width="8" height="8" fill="#0f172a" />
                  <rect x="48" y="10" width="6" height="6" fill="#0f172a" />
                  <rect x="35" y="22" width="6" height="6" fill="#0f172a" />
                  <rect x="52" y="24" width="8" height="6" fill="#0f172a" />

                  <rect x="10" y="38" width="8" height="8" fill="#0f172a" />
                  <rect x="25" y="40" width="6" height="12" fill="#0f172a" />
                  <rect x="38" y="38" width="12" height="12" fill="#0f172a" />
                  <rect x="58" y="38" width="8" height="8" fill="#0f172a" />
                  <rect x="72" y="40" width="14" height="6" fill="#0f172a" />
                  <rect x="85" y="48" width="6" height="10" fill="#0f172a" />

                  <rect x="12" y="55" width="6" height="8" fill="#0f172a" />
                  <rect x="36" y="58" width="10" height="8" fill="#0f172a" />
                  <rect x="52" y="55" width="14" height="10" fill="#0f172a" />
                  <rect x="70" y="58" width="6" height="6" fill="#0f172a" />

                  <rect x="35" y="75" width="8" height="8" fill="#0f172a" />
                  <rect x="48" y="72" width="12" height="6" fill="#0f172a" />
                  <rect x="40" y="85" width="8" height="8" fill="#0f172a" />
                  <rect x="58" y="80" width="12" height="12" fill="#0f172a" />
                  <rect x="75" y="75" width="8" height="8" fill="#0f172a" />
                  <rect x="85" y="85" width="8" height="8" fill="#0f172a" />
                </svg>
              </div>
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">PIN di Convalida:</span>
                <div className="font-mono text-2xl font-black text-slate-900 tracking-widest">
                  {courses.find(c => c.id === showQrModal)?.activeSessionPin || '7429'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowQrModal(null)}
              className="w-full py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Chiudi Finestra
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
