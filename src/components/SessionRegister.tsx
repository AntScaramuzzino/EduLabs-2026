import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { AttendanceStatus } from '../types/attendance';
import { 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Lock, 
  Users, 
  Send, 
  PenTool, 
  Phone, 
  Mail, 
  AlertCircle,
  Sparkles,
  PhoneCall,
  UserCheck,
  Check,
  Info
} from 'lucide-react';

interface SessionRegisterProps {
  initialCourseId?: string;
  onNavigateToEmails: () => void;
}

export const SessionRegister: React.FC<SessionRegisterProps> = ({
  initialCourseId,
  onNavigateToEmails,
}) => {
  const { 
    courses, 
    sessions, 
    users, 
    attendanceRecords, 
    updateAttendanceStatus, 
    batchUpdateAttendance,
    signSessionByInstructor,
    signSessionByEducator,
    currentUser,
    sendNotificationEmail
  } = useAttendance();

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    initialCourseId || courses[0]?.id || ''
  );

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];
  const courseSessions = sessions.filter(s => s.courseId === selectedCourse.id);

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    courseSessions[courseSessions.length - 1]?.id || ''
  );

  const selectedSession = courseSessions.find(s => s.id === selectedSessionId) || courseSessions[0];

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [educatorNoteInput, setEducatorNoteInput] = useState<string>(selectedSession?.educatorNotes || '');

  // Enrolled minors for this course
  const enrolledMinors = users.filter(
    u => u.role === 'student' && u.enrolledCourseIds.includes(selectedCourse.id)
  );

  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    if (!selectedSession) return;
    if (selectedSession.isCompleted && selectedSession.signedByInstructor && selectedSession.signedByEducator && currentUser.role !== 'admin') {
      setFeedbackMsg('Il registro è stato convalidato con doppia firma e bloccato. Solo un coordinatore/amministratore può apportare rettifiche.');
      setTimeout(() => setFeedbackMsg(null), 4000);
      return;
    }

    const record = attendanceRecords.find(
      r => r.sessionId === selectedSession.id && r.studentId === studentId
    );

    if (record) {
      updateAttendanceStatus(record.id, newStatus);
    }
  };

  const handleInstructorSign = () => {
    if (!selectedSession) return;
    signSessionByInstructor(selectedSession.id, selectedCourse.instructorName);
    setFeedbackMsg(`Firma del Formatore (${selectedCourse.instructorName}) registrata con marca temporale e hash crittografico.`);
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const handleEducatorSign = () => {
    if (!selectedSession) return;
    const eduName = selectedCourse.educatorName || "Dott.ssa Sara D'Amico";
    signSessionByEducator(selectedSession.id, eduName, educatorNoteInput);
    setFeedbackMsg(`Firma dell'Educatore (${eduName}) e diario pedagogico salvati con successo.`);
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const handleNotifyAbsents = () => {
    if (!selectedSession) return;
    let notifiedCount = 0;
    enrolledMinors.forEach(st => {
      const rec = attendanceRecords.find(r => r.sessionId === selectedSession.id && r.studentId === st.id);
      if (rec?.status === 'absent') {
        const parentEmail = st.guardianEmail || st.email;
        sendNotificationEmail(
          parentEmail,
          st.guardianName || `Genitore di ${st.name}`,
          selectedCourse.title,
          `Notifica Assenza Minore: Laboratorio del ${selectedSession.date}`,
          'threshold_warning',
          `<p>Gentile genitore / tutore legale di <strong>${st.name}</strong>,</p>
          <p>Vi comunichiamo che il minore è risultato assente all'attività educativa <em>"${selectedSession.topic}"</em> del corso <strong>${selectedCourse.title}</strong> del ${selectedSession.date}.</p>
          <p>Per eventuali chiarimenti o per trasmettere il certificato di giustificazione, potete contattare la segreteria o rispondere a questa email.</p>`
        );
        notifiedCount++;
      }
    });

    setFeedbackMsg(`Inviata notifica di assenza via email a ${notifiedCount} famiglie.`);
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Notice on Minors Policy */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 sm:p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <strong>Protocollo Rilevazione Presenze per Minori:</strong> I minori non firmano autonomamente. L'appello in aula e le ore di frequenza sono convalidate congiuntamente dal <strong>Formatore</strong> e dall'<strong>Educatore socio-pedagogico</strong> presenti.
        </div>
      </div>

      {/* Top Selector Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Course select */}
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Laboratorio Minori ({courses.length} Attivi)
            </label>
            <select
              value={selectedCourse.id}
              onChange={e => {
                const newCId = e.target.value;
                setSelectedCourseId(newCId);
                const nextCourseSessions = sessions.filter(s => s.courseId === newCId);
                if (nextCourseSessions.length > 0) {
                  setSelectedSessionId(nextCourseSessions[nextCourseSessions.length - 1].id);
                }
              }}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 sm:p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.title} ({c.targetAge || 'Minori'})
                </option>
              ))}
            </select>
            {selectedCourse.partnerEntity && (
              <div className="text-[10px] text-purple-700 font-semibold mt-1 truncate">
                a cura di {selectedCourse.partnerEntity}
              </div>
            )}
          </div>

          {/* Session select */}
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Sessione / Lezione ({courseSessions.length} programmate)
            </label>
            <select
              value={selectedSession?.id || ''}
              onChange={e => setSelectedSessionId(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 sm:p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {courseSessions.map(s => (
                <option key={s.id} value={s.id}>
                  #{s.sessionNumber} · {s.date} - {s.topic.slice(0, 32)}... {s.signedByInstructor && s.signedByEducator ? '✓ (Firme OK)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Course staff overview */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs flex flex-col justify-center">
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              Operatori Assegnati all'aula:
            </div>
            <div className="font-bold text-slate-900 truncate mt-0.5">
              Docente: {selectedCourse.instructorName}
            </div>
            <div className="text-purple-700 font-semibold truncate text-[11px]">
              Educatore: {selectedCourse.educatorName || "Dott.ssa Sara D'Amico"}
            </div>
          </div>
        </div>
      </div>

      {/* User Feedback Alert */}
      {feedbackMsg && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-blue-700 hover:text-blue-900 font-medium cursor-pointer p-1">
            Chiudi
          </button>
        </div>
      )}

      {/* Dual Signature Operative Box */}
      {selectedSession && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-900">Lezione #{selectedSession.sessionNumber}</span>
                <span>·</span>
                <span>Data: <strong>{selectedSession.date}</strong></span>
                <span>·</span>
                <span>{selectedSession.startTime} - {selectedSession.endTime} ({selectedSession.hours}h)</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                {selectedSession.topic}
              </h2>
            </div>

            {/* Overall status pill */}
            <div className="flex items-center gap-2">
              {selectedSession.signedByInstructor && selectedSession.signedByEducator ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Doppia Firma Convalidata</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[11px] font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Firma congiunta in corso</span>
                </div>
              )}
            </div>
          </div>

          {/* The Two Dedicated Signatures Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {/* 1. Formatore Signature Box */}
            <div className="border border-slate-200 rounded-xl p-3.5 sm:p-4 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <PenTool className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    Firma Formatore / Docente
                  </span>
                  {selectedSession.signedByInstructor ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Firmato
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      In attesa
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  {selectedCourse.instructorName}
                </div>
                {selectedSession.signedByInstructor ? (
                  <div className="mt-2 text-[10px] sm:text-[11px] text-slate-500 font-mono">
                    Hash: {selectedSession.instructorVerificationHash || selectedSession.verificationHash || 'SHA256-DOC-VERIFIED'}<br/>
                    Data: {selectedSession.instructorSignatureTimestamp ? new Date(selectedSession.instructorSignatureTimestamp).toLocaleTimeString('it-IT') : '18:30'}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Il formatore convalida le ore disciplinari erogate per il laboratorio.
                  </p>
                )}
              </div>

              {!selectedSession.signedByInstructor && (
                <button
                  onClick={handleInstructorSign}
                  className="mt-3 w-full py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Firma come Formatore</span>
                </button>
              )}
            </div>

            {/* 2. Educatore Signature Box */}
            <div className="border border-slate-200 rounded-xl p-3.5 sm:p-4 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    Firma Educatore Socio-Pedagogico
                  </span>
                  {selectedSession.signedByEducator ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Firmato
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      In attesa
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  {selectedCourse.educatorName || "Dott.ssa Sara D'Amico"}
                </div>
                {selectedSession.signedByEducator ? (
                  <div className="mt-2 text-[10px] sm:text-[11px] text-slate-500 font-mono">
                    Hash: {selectedSession.educatorVerificationHash || 'SHA256-EDU-VERIFIED'}<br/>
                    Data: {selectedSession.educatorSignatureTimestamp ? new Date(selectedSession.educatorSignatureTimestamp).toLocaleTimeString('it-IT') : '18:30'}
                  </div>
                ) : (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={educatorNoteInput}
                      onChange={e => setEducatorNoteInput(e.target.value)}
                      placeholder="Diario socio-educativo: clima d'aula, dinamiche minori..."
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>

              {!selectedSession.signedByEducator && (
                <button
                  onClick={handleEducatorSign}
                  className="mt-3 w-full py-2.5 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Firma come Educatore</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Bulk Batch Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500 font-medium text-[11px]">Appello rapido:</span>
              <button
                onClick={() => batchUpdateAttendance(selectedSession.id, 'present')}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tutti Presenti</span>
              </button>
              <button
                onClick={() => batchUpdateAttendance(selectedSession.id, 'absent')}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Tutti Assenti
              </button>
            </div>

            <button
              onClick={handleNotifyAbsents}
              className="text-rose-700 hover:text-rose-800 font-bold inline-flex items-center gap-1.5 cursor-pointer py-1 text-xs"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span>Avvisa Genitori dei Minori Assenti</span>
            </button>
          </div>
        </div>
      )}

      {/* Attendance Roster Section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Appello Minori Iscritti ({enrolledMinors.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Formatore & Educatore convalidano le presenze
          </span>
        </div>

        {/* 1. MOBILE ROSTER CARD VIEW (Optimized for Smartphone Screens < md) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {enrolledMinors.length === 0 ? (
            <div className="py-8 px-4 text-center text-slate-400 text-xs">
              Nessun minore iscritto a questo corso. Importa l'anagrafica da Google Sheets.
            </div>
          ) : (
            enrolledMinors.map(minor => {
              const record = attendanceRecords.find(
                r => r.sessionId === selectedSession?.id && r.studentId === minor.id
              );
              const currentStatus = record?.status || 'absent';
              const maxHours = selectedSession?.hours || 2;

              return (
                <div key={minor.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/50 transition-colors">
                  {/* Top Bar: Name, Age, Identification */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                        <span>{minor.name}</span>
                        {minor.age && (
                          <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded border border-purple-200">
                            {minor.age} anni
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {minor.studentNumber || 'MIN-2026-N/A'} · Genitore: <strong className="text-slate-700">{minor.guardianName || 'N/D'}</strong>
                      </div>
                    </div>

                    {/* Quick Call Parent Button */}
                    {minor.guardianPhone && (
                      <a
                        href={`tel:${minor.guardianPhone}`}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                        title="Chiama subito genitore/tutore"
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-[11px]">Chiama</span>
                      </a>
                    )}
                  </div>

                  {/* Presence Status Selector: Large Thumb-friendly Tap Targets (>= 44px) */}
                  <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => handleStatusChange(minor.id, 'present')}
                      className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center cursor-pointer min-h-[44px] ${
                        currentStatus === 'present'
                          ? 'bg-emerald-600 text-white shadow-xs scale-[1.02]'
                          : 'text-slate-600 hover:text-slate-900 bg-transparent'
                      }`}
                    >
                      <span className="text-[11px]">Presente</span>
                      <span className="text-[9px] opacity-80">{maxHours}h</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(minor.id, 'late')}
                      className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center cursor-pointer min-h-[44px] ${
                        currentStatus === 'late'
                          ? 'bg-amber-500 text-white shadow-xs scale-[1.02]'
                          : 'text-slate-600 hover:text-slate-900 bg-transparent'
                      }`}
                    >
                      <span className="text-[11px]">Ritardo</span>
                      <span className="text-[9px] opacity-80">{Math.max(1, maxHours - 1)}h</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(minor.id, 'absent')}
                      className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center cursor-pointer min-h-[44px] ${
                        currentStatus === 'absent'
                          ? 'bg-rose-600 text-white shadow-xs scale-[1.02]'
                          : 'text-slate-600 hover:text-slate-900 bg-transparent'
                      }`}
                    >
                      <span className="text-[11px]">Assente</span>
                      <span className="text-[9px] opacity-80">0h</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(minor.id, 'excused')}
                      className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center cursor-pointer min-h-[44px] ${
                        currentStatus === 'excused'
                          ? 'bg-blue-600 text-white shadow-xs scale-[1.02]'
                          : 'text-slate-600 hover:text-slate-900 bg-transparent'
                      }`}
                    >
                      <span className="text-[11px]">Giustif.</span>
                      <span className="text-[9px] opacity-80">0h</span>
                    </button>
                  </div>

                  {/* Badges for Safety / Pickup / Allergies */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    {minor.selfDismissalAuthorized ? (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                        Uscita Autonoma (≥14a)
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {minor.authorizedPickup ? `Delega: ${minor.authorizedPickup}` : 'Ritiro Genitori'}
                      </span>
                    )}

                    {minor.allergiesNotes && minor.allergiesNotes !== 'Nessuna' && (
                      <span className="bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                        ⚠️ {minor.allergiesNotes}
                      </span>
                    )}

                    <span className="ml-auto text-slate-400 font-mono">
                      Ore: {record?.attendedHours ?? 0}h / {maxHours}h
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 2. DESKTOP ROSTER TABLE VIEW (Screen >= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                <th className="py-3 px-4">Minore & Età</th>
                <th className="py-3 px-4">Genitore / Recapito Emergenza</th>
                <th className="py-3 px-4">Stato Presenza (Appello)</th>
                <th className="py-3 px-4 text-center">Ore Riconosciute</th>
                <th className="py-3 px-4">Uscita / Ritiro</th>
                <th className="py-3 px-4">Note Sanitarie / Pedagogiche</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrolledMinors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nessun minore iscritto a questo corso. Importa l'anagrafica da Google Sheets.
                  </td>
                </tr>
              ) : (
                enrolledMinors.map(minor => {
                  const record = attendanceRecords.find(
                    r => r.sessionId === selectedSession?.id && r.studentId === minor.id
                  );
                  const currentStatus = record?.status || 'absent';
                  const maxHours = selectedSession?.hours || 2;

                  return (
                    <tr key={minor.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Minor Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{minor.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {minor.age ? `${minor.age} anni` : ''} · {minor.studentNumber || 'MIN-2026-N/A'}
                        </div>
                      </td>

                      {/* Guardian & Phone for quick contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{minor.guardianName || 'Genitore N/D'}</div>
                        <div className="text-[11px] text-blue-700 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <a href={`tel:${minor.guardianPhone}`} className="hover:underline">
                            {minor.guardianPhone || 'Nessun telefono'}
                          </a>
                        </div>
                      </td>

                      {/* Status Selector Bar */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
                          <button
                            onClick={() => handleStatusChange(minor.id, 'present')}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Presente
                          </button>
                          <button
                            onClick={() => handleStatusChange(minor.id, 'late')}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                              currentStatus === 'late'
                                ? 'bg-amber-500 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Ritardo
                          </button>
                          <button
                            onClick={() => handleStatusChange(minor.id, 'absent')}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                              currentStatus === 'absent'
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Assente
                          </button>
                          <button
                            onClick={() => handleStatusChange(minor.id, 'excused')}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                              currentStatus === 'excused'
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Giustificato
                          </button>
                        </div>
                      </td>

                      {/* Attended Hours */}
                      <td className="py-3.5 px-4 text-center tabular-nums font-bold text-slate-900">
                        {record?.attendedHours !== undefined ? `${record.attendedHours}h` : '0h'} / {maxHours}h
                      </td>

                      {/* Dismissal / Pickup Authorization */}
                      <td className="py-3.5 px-4">
                        {minor.selfDismissalAuthorized ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Uscita Autonoma
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {minor.authorizedPickup ? `Delega: ${minor.authorizedPickup.slice(0, 18)}...` : 'Ritiro Genitori'}
                          </span>
                        )}
                      </td>

                      {/* Notes / Allergies */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {minor.allergiesNotes && minor.allergiesNotes !== 'Nessuna' ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded inline-block">
                            ⚠️ {minor.allergiesNotes}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
