import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { X, Send, FileText, CheckCircle2 } from 'lucide-react';

interface ExcuseManagementModalProps {
  courseId: string;
  onClose: () => void;
}

export const ExcuseManagementModal: React.FC<ExcuseManagementModalProps> = ({
  courseId,
  onClose,
}) => {
  const { courses, sessions, currentUser, submitExcuse } = useAttendance();
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  const course = courses.find(c => c.id === courseId) || courses[0];
  const courseSessions = sessions.filter(s => s.courseId === course.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId && courseSessions.length > 0) {
      submitExcuse(course.id, courseSessions[0].id, reason);
    } else {
      submitExcuse(course.id, selectedSessionId, reason);
    }
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full p-5 sm:p-6 border border-slate-200 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Invia Giustificativo di Assenza</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Giustificativo Inoltrato con Successo!</h4>
            <p className="text-xs text-slate-500">
              La richiesta è stata inviata al docente titolare per la verifica e l'approvazione delle ore.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corso di Riferimento
              </label>
              <div className="text-xs text-slate-900 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {course.title} ({course.code})
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Seleziona Data / Sessione Assente
              </label>
              <select
                value={selectedSessionId}
                onChange={e => setSelectedSessionId(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">-- Seleziona una lezione --</option>
                {courseSessions.map(sess => (
                  <option key={sess.id} value={sess.id}>
                    {sess.date} - Lezione #{sess.sessionNumber}: {sess.topic}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motivazione Dettagliata dell'Assenza
              </label>
              <textarea
                rows={4}
                required
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Es. Visita medica specialistica con certificato prot. 481, impegno lavorativo straordinario o impedimento di forza maggiore..."
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:border-blue-500"
              />
              <span className="text-[11px] text-slate-400">
                Puoi allegare o menzionare i riferimenti del documento a supporto.
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Invia Richiesta al Docente</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
