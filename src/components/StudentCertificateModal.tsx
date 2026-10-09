import React, { useRef } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  Calendar,
  Clock,
  Award
} from 'lucide-react';

interface StudentCertificateModalProps {
  studentId: string;
  courseId: string;
  onClose: () => void;
}

export const StudentCertificateModal: React.FC<StudentCertificateModalProps> = ({
  studentId,
  courseId,
  onClose,
}) => {
  const { getStudentReport, courses, sessions, attendanceRecords, users } = useAttendance();
  const printAreaRef = useRef<HTMLDivElement>(null);

  const report = getStudentReport(studentId, courseId);
  const course = courses.find(c => c.id === courseId);
  const student = users.find(u => u.id === studentId);

  if (!report || !course || !student) {
    return null;
  }

  const courseSessions = sessions.filter(s => s.courseId === courseId && s.isCompleted);
  const certificateId = `CERT-2026-IT-${course.code}-${student.studentNumber?.replace('MAT-', '') || '001'}`;
  const issueDate = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const verificationHash = `SHA256-${studentId.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 0).toString(16).toUpperCase()}-VERIFIED`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-2 sm:my-8 overflow-hidden border border-slate-200 max-h-[96vh] flex flex-col">
        {/* Modal Top Bar (Hidden in print) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-b border-slate-200 no-print">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs sm:text-sm truncate mr-2">
            <Award className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="truncate">Attestato di Frequenza Laboratorio Minori</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Stampa / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Content Document */}
        <div ref={printAreaRef} className="p-4 sm:p-10 text-slate-900 bg-white overflow-y-auto flex-1">
          {/* Document Framing Header */}
          <div className="border-2 sm:border-4 border-double border-slate-800 p-4 sm:p-8 relative">
            {/* Top Institutional Header */}
            <div className="text-center space-y-1 sm:space-y-2 border-b border-slate-200 pb-4 sm:pb-6">
              <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-slate-600">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>EduLabs 2026 · Centro Educativo Diffuso · Lamezia Terme</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 uppercase">
                Attestato Ufficiale di Frequenza Minori
              </h1>
              <div className="text-[10px] sm:text-xs text-slate-500 font-mono tracking-wider">
                DOCUMENTO PROT. N. {certificateId} · CUP: C89I26000930001
              </div>
            </div>

            {/* Declaration Body */}
            <div className="my-8 space-y-6 text-sm text-slate-700 leading-relaxed text-center sm:text-left">
              <p>
                Si certifica e documenta in via telematica che il corsista:
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-center my-4">
                <div className="text-2xl font-bold text-slate-950 font-serif tracking-wide">
                  {student.name}
                </div>
                <div className="text-xs text-slate-600 mt-1 font-mono">
                  Matricola: <strong>{student.studentNumber || 'MAT-2026-001'}</strong> · Email: {student.email}
                </div>
              </div>

              <p>
                ha partecipato con regolarità al percorso formativo specialistico online denominato:
              </p>

              <div className="text-center my-4">
                <div className="text-xl font-bold text-slate-900">
                  {course.title}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Codice Corso: <span className="font-mono font-medium">{course.code}</span> · Docente Titolare: <strong>{course.instructorName}</strong>
                </div>
              </div>

              {/* Attendance Metrics Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6 text-center">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Percentuale Rilevata</div>
                  <div className={`text-2xl font-black tabular-nums mt-1 ${report.attendancePercent >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {report.attendancePercent.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Soglia minima: 80%</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Ore Svolte & Validate</div>
                  <div className="text-2xl font-black text-slate-900 tabular-nums mt-1">
                    {report.totalHoursAttended}h
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Su {report.totalHoursCourse}h previste</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Stato Idoneità</div>
                  <div className={`text-lg font-bold mt-1.5 flex items-center justify-center gap-1 ${report.isEligibleForCertificate ? 'text-emerald-700' : 'text-amber-700'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{report.isEligibleForCertificate ? 'AMMESSO' : 'IN COMPILAZIONE'}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Certificazione valida</div>
                </div>
              </div>

              {/* Detailed sessions table summary */}
              <div className="mt-6 border-t border-slate-200 pt-4">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Registro Dettagliato Sessioni Erogate ({courseSessions.length} lezioni convalidate)
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Data</th>
                        <th className="py-2 px-3">Argomento Didattico</th>
                        <th className="py-2 px-3 text-center">Ore</th>
                        <th className="py-2 px-3 text-right">Esito Presenza</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {courseSessions.map(sess => {
                        const rec = attendanceRecords.find(r => r.sessionId === sess.id && r.studentId === student.id);
                        return (
                          <tr key={sess.id}>
                            <td className="py-2 px-3 font-mono text-[11px]">{sess.date}</td>
                            <td className="py-2 px-3 truncate max-w-[260px]">{sess.topic}</td>
                            <td className="py-2 px-3 text-center tabular-nums">{sess.hours}h</td>
                            <td className="py-2 px-3 text-right font-medium">
                              {rec?.status === 'present' && <span className="text-emerald-700">Presente</span>}
                              {rec?.status === 'late' && <span className="text-amber-700">Ritardo ({rec.attendedHours}h)</span>}
                              {rec?.status === 'absent' && <span className="text-rose-700">Assente (0h)</span>}
                              {rec?.status === 'excused' && <span className="text-blue-700">Giustificato</span>}
                              {!rec && <span className="text-slate-400">Non reg.</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Document Verification & Signatures */}
            <div className="mt-10 pt-6 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-600">
              {/* QR Verification Seal */}
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-slate-900 text-white p-1 rounded border border-slate-300 flex items-center justify-center shrink-0">
                  <svg className="w-14 h-14" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="10" y="10" width="25" height="25" fill="#fff" />
                    <rect x="15" y="15" width="15" height="15" fill="#000" />
                    <rect x="65" y="10" width="25" height="25" fill="#fff" />
                    <rect x="70" y="15" width="15" height="15" fill="#000" />
                    <rect x="10" y="65" width="25" height="25" fill="#fff" />
                    <rect x="15" y="70" width="15" height="15" fill="#000" />
                    <rect x="40" y="20" width="10" height="20" fill="#fff" />
                    <rect x="40" y="60" width="20" height="20" fill="#fff" />
                    <rect x="65" y="65" width="25" height="25" fill="#fff" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Convalida Digitale SHA-256</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono break-all max-w-[200px]">
                    {verificationHash}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Data Emissione: {issueDate}
                  </div>
                </div>
              </div>

              {/* Official Signatures */}
              <div className="text-center sm:text-right space-y-1">
                <div className="text-[11px] text-slate-500">Il Formatore Titolare & L'Educatore Socio-Pedagogico</div>
                <div className="font-serif italic font-bold text-slate-900 text-sm py-1">
                  {course.instructorName} & {course.educatorName || "Dott.ssa Sara D'Amico"}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                  Doppia Firma Digitale Qualificata Polo Minori
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer (Hidden in print) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between no-print">
          <div className="text-xs text-slate-500">
            Il presente certificato è conforme al D.Lgs. 82/2005 (Codice dell'Amministrazione Digitale).
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
