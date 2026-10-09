import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileCheck2, 
  Send, 
  Radio, 
  Download, 
  ShieldCheck, 
  ChevronRight, 
  Info,
  Phone,
  Mail,
  Users
} from 'lucide-react';
import { StudentCertificateModal } from './StudentCertificateModal';
import { ExcuseManagementModal } from './ExcuseManagementModal';

interface StudentDashboardProps {
  onNavigateToReports: (courseId?: string, studentId?: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigateToReports }) => {
  const { 
    currentUser, 
    courses, 
    sessions, 
    attendanceRecords, 
    excuses, 
    getAllReportsForStudent,
  } = useAttendance();

  const [certificateCourseId, setCertificateCourseId] = useState<string | null>(null);
  const [excuseModalCourseId, setExcuseModalCourseId] = useState<string | null>(null);

  // Student reports for all courses they are enrolled in
  const myReports = getAllReportsForStudent(currentUser.id);
  const enrolledCourses = courses.filter(c => currentUser.enrolledCourseIds.includes(c.id));

  // Check for any currently active session in enrolled courses
  const activeEnrolledCourses = enrolledCourses.filter(c => c.isSessionActive);

  // Get recent attendance logs for this minor
  const myRecentAttendance = attendanceRecords
    .filter(r => r.studentId === currentUser.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8);

  const myExcuses = excuses.filter(e => e.studentId === currentUser.id);

  return (
    <div className="space-y-8">
      {/* Minor & Family Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>Libretto Minore & Portale Famiglia / Genitori</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <span>{currentUser.name}</span>
              {currentUser.age && (
                <span className="text-sm font-semibold bg-purple-50 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                  {currentUser.age} anni
                </span>
              )}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
              <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                ID Minore: {currentUser.studentNumber || 'MIN-2026-001'}
              </span>
              <span>·</span>
              <span>Genitore: <strong>{currentUser.guardianName || 'Non specificato'}</strong></span>
              <span>·</span>
              <span className="font-mono">{currentUser.guardianPhone || ''}</span>
              <span>·</span>
              <span>{enrolledCourses.length} Corsi Iscritti</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateToReports(undefined, currentUser.id)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Prospetto Certificazioni</span>
            </button>
          </div>
        </div>

        {/* Guardian and Safety Info Details */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[11px] font-medium">Modalità Uscita / Ritiro:</span>
            <span className="font-bold text-slate-800">
              {currentUser.selfDismissalAuthorized ? '✓ Uscita Autonoma Autorizzata' : (currentUser.authorizedPickup || 'Ritiro Genitori')}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[11px] font-medium">Note Sanitarie / Allergie:</span>
            <span className="font-semibold text-slate-800">
              {currentUser.allergiesNotes || 'Nessuna segnalazione'}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[11px] font-medium">Convalida Presenze:</span>
            <span className="font-semibold text-purple-700">
              A cura di Formatore ed Educatore d'aula
            </span>
          </div>
        </div>
      </div>

      {/* Live Session Notice for Minors (NO PIN REQUIRED) */}
      {activeEnrolledCourses.map(course => {
        const activeSession = sessions.find(s => s.courseId === course.id && !s.isCompleted);
        const myRecord = activeSession
          ? attendanceRecords.find(r => r.sessionId === activeSession.id && r.studentId === currentUser.id)
          : null;
        const isPresent = myRecord?.status === 'present' || myRecord?.status === 'late';

        return (
          <div
            key={course.id}
            className="bg-linear-to-r from-purple-950 via-slate-900 to-slate-900 text-white rounded-xl p-6 border border-purple-800/40 shadow-lg"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
                  </span>
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                    Attività di Laboratorio Minori Attiva in Questo Momento
                  </span>
                </div>
                <h3 className="text-xl font-bold">{course.title}</h3>
                <p className="text-xs text-slate-300">
                  {activeSession?.topic || 'Laboratorio in svolgimento'} · Docente: <strong>{course.instructorName}</strong> · Educatore: <strong>{course.educatorName || "Dott.ssa Sara D'Amico"}</strong>
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4 border border-white/10 max-w-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-200">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Rilevazione presenze in corso</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  I formatori e gli educatori stanno registrando l'appello direttamente sul registro di classe. Non è richiesta alcuna firma o digitazione di PIN da parte del minore.
                </p>
                {isPresent && (
                  <div className="mt-2 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Presenza convalidata dagli educatori!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Course Cards & Attendance Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            I Corsi per Minori Frequentati ({enrolledCourses.length})
          </h2>
          <span className="text-xs text-slate-500">Soglia minima di frequenza: 80%</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myReports.map(report => {
            const course = courses.find(c => c.id === report.courseId);

            return (
              <div 
                key={report.courseId}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono font-medium text-slate-500">
                        {course?.code} · {course?.targetAge || 'Minori'}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {report.courseTitle}
                      </h3>
                      <div className="text-xs text-slate-500 mt-1">
                        Formatore: {course?.instructorName} · Educatore: {course?.educatorName || "Dott.ssa Sara D'Amico"}
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                      report.attendancePercent >= 80 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {report.attendancePercent.toFixed(1)}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                      <span>Ore Convalidate: <strong>{report.totalHoursAttended}h</strong> su {report.totalHoursCourse}h</span>
                      <span>{report.totalSessionsCompleted} lezioni svolte</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          report.attendancePercent >= 80 ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, (report.totalHoursAttended / report.totalHoursCourse) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats pills */}
                  <div className="grid grid-cols-4 gap-2 mt-4 text-center text-xs">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2">
                      <div className="font-bold text-emerald-800 text-sm font-mono">{report.presentCount}</div>
                      <div className="text-[10px] text-emerald-600">Presente</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-2">
                      <div className="font-bold text-amber-800 text-sm font-mono">{report.lateCount}</div>
                      <div className="text-[10px] text-amber-600">Ritardo</div>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 rounded-lg p-2">
                      <div className="font-bold text-rose-800 text-sm font-mono">{report.absentCount}</div>
                      <div className="text-[10px] text-rose-600">Assenze</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-2">
                      <div className="font-bold text-blue-800 text-sm font-mono">{report.excusedCount}</div>
                      <div className="text-[10px] text-blue-600">Giustificate</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  {report.isEligibleForCertificate ? (
                    <button
                      onClick={() => setCertificateCourseId(report.courseId)}
                      className="inline-flex items-center gap-1.5 text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Scarica Attestato di Frequenza</span>
                    </button>
                  ) : (
                    <span className="text-amber-700 text-[11px] font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Necessario raggiungere l'80% per l'attestato</span>
                    </span>
                  )}

                  <button
                    onClick={() => setExcuseModalCourseId(report.courseId)}
                    className="w-full sm:w-auto text-center px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                  >
                    Giustifica Assenza Minore
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Excuse Modal */}
      {excuseModalCourseId && (
        <ExcuseManagementModal
          courseId={excuseModalCourseId}
          onClose={() => setExcuseModalCourseId(null)}
        />
      )}

      {/* Certificate Modal */}
      {certificateCourseId && (
        <StudentCertificateModal
          courseId={certificateCourseId}
          studentId={currentUser.id}
          onClose={() => setCertificateCourseId(null)}
        />
      )}
    </div>
  );
};
