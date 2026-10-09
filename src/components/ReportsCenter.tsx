import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { StudentReportSummary } from '../types/attendance';
import { 
  FileSpreadsheet, 
  Search, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Mail, 
  Award,
  Filter,
  Send
} from 'lucide-react';
import { StudentCertificateModal } from './StudentCertificateModal';

interface ReportsCenterProps {
  initialCourseId?: string;
  initialStudentId?: string;
}

export const ReportsCenter: React.FC<ReportsCenterProps> = ({
  initialCourseId,
  initialStudentId,
}) => {
  const { courses, getAllReportsForCourse, triggerWeeklyReports, sendNotificationEmail } = useAttendance();

  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>(initialCourseId || 'all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'safe' | 'warning_danger'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [selectedCertificate, setSelectedCertificate] = useState<{ studentId: string; courseId: string } | null>(
    initialStudentId && initialCourseId ? { studentId: initialStudentId, courseId: initialCourseId } : null
  );

  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Collect reports based on course filter
  const allReports: StudentReportSummary[] = selectedCourseFilter === 'all'
    ? courses.flatMap(c => getAllReportsForCourse(c.id))
    : getAllReportsForCourse(selectedCourseFilter);

  // Apply filters
  const filteredReports = allReports.filter(rep => {
    // Status filter
    if (statusFilter === 'safe' && rep.attendancePercent < 80) return false;
    if (statusFilter === 'warning_danger' && rep.attendancePercent >= 80) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = rep.studentName.toLowerCase().includes(q);
      const matchEmail = rep.studentEmail.toLowerCase().includes(q);
      const matchMatricola = rep.studentNumber.toLowerCase().includes(q);
      const matchCourse = rep.courseTitle.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchMatricola && !matchCourse) return false;
    }

    return true;
  });

  const handleExportCSV = () => {
    const headers = [
      'Matricola',
      'Nome Studente',
      'Email',
      'Corso',
      'Ore Frequentate',
      'Ore Totali Corso',
      'Percentuale Presenze',
      'Lezioni Presente',
      'Lezioni Ritardo',
      'Lezioni Assente',
      'Lezioni Giustificate',
      'Idoneo Attestato (>=80%)'
    ];

    const rows = filteredReports.map(r => [
      `"${r.studentNumber}"`,
      `"${r.studentName}"`,
      `"${r.studentEmail}"`,
      `"${r.courseTitle}"`,
      r.totalHoursAttended,
      r.totalHoursCourse,
      `${r.attendancePercent.toFixed(1)}%`,
      r.presentCount,
      r.lateCount,
      r.absentCount,
      r.excusedCount,
      r.isEligibleForCertificate ? 'SI' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `report_presenze_corsi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setBannerNotice('File CSV generato ed esportato con successo.');
    setTimeout(() => setBannerNotice(null), 4000);
  };

  const handleSendWeeklyReportsBatch = () => {
    const sentCount = triggerWeeklyReports(selectedCourseFilter === 'all' ? undefined : selectedCourseFilter);
    setBannerNotice(`Generati e inviati con successo ${sentCount} report automatici via email.`);
    setTimeout(() => setBannerNotice(null), 5000);
  };

  const handleSendSingleStudentEmail = (rep: StudentReportSummary) => {
    const bodyHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">Prospetto Presenze Aggiornato</h2>
        <p>Gentile <strong>${rep.studentName}</strong>,</p>
        <p>In allegato informatico trovi il riepilogo per il corso <strong>${rep.courseTitle}</strong>:</p>
        <ul>
          <li>Frequenza Rilevata: <strong>${rep.attendancePercent.toFixed(1)}%</strong></li>
          <li>Ore validate: <strong>${rep.totalHoursAttended}h</strong> su ${rep.totalHoursCourse}h</li>
          <li>Assenze: <strong>${rep.absentCount}</strong> | Giustificate: <strong>${rep.excusedCount}</strong></li>
          <li>Esito Certificazione: <strong>${rep.isEligibleForCertificate ? 'AMMESSO' : 'IN VALUTAZIONE'}</strong></li>
        </ul>
        <p style="font-size: 13px; color: #64748b;">Accademia Formazione PresenzeLive</p>
      </div>
    `;
    sendNotificationEmail(
      rep.studentEmail,
      rep.studentName,
      rep.courseTitle,
      `Prospetto Presenze Individuale: ${rep.courseTitle}`,
      'weekly_report',
      bodyHtml
    );
    setBannerNotice(`Report email inviato a ${rep.studentEmail}.`);
    setTimeout(() => setBannerNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      {bannerNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs px-4 py-3 rounded-lg flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{bannerNotice}</span>
          </div>
          <button onClick={() => setBannerNotice(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            Chiudi
          </button>
        </div>
      )}

      {/* Header and Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Centro Report & Attestati Automatici
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Calcolo automatico percentuali di presenza, monte ore completato e certificati digitali conformi per i 10 corsi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSendWeeklyReportsBatch}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Invia Report Email a Tutti</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Esporta in CSV ({filteredReports.length} righe)</span>
            </button>
          </div>
        </div>

        {/* Filter controls strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Course filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Filtro Corso Online
            </label>
            <select
              value={selectedCourseFilter}
              onChange={e => setSelectedCourseFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Tutti i 10 Corsi Online</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter (Segmented tab) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Soglia Certificazione (80%)
            </label>
            <div className="flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 h-[34px] items-center">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 text-center py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tutti
              </button>
              <button
                onClick={() => setStatusFilter('safe')}
                className={`flex-1 text-center py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'safe' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Idonei (≥80%)
              </button>
              <button
                onClick={() => setStatusFilter('warning_danger')}
                className={`flex-1 text-center py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'warning_danger' ? 'bg-white text-rose-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Critici (&lt;80%)
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Cerca Corsista o Matricola
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nome, cognome o matricola..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table & Mobile Cards */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* MOBILE VIEW FOR REPORTS (Cards) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filteredReports.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              Nessun report corrispondente ai filtri impostati.
            </div>
          ) : (
            filteredReports.map((rep, idx) => {
              const isSafe = rep.attendancePercent >= 80;
              const isDanger = rep.attendancePercent < 70;

              return (
                <div key={`m-${rep.studentId}-${rep.courseId}-${idx}`} className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>{rep.studentName}</span>
                        {rep.age && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-normal">
                            {rep.age}a
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {rep.studentNumber} · {rep.guardianName || rep.studentEmail}
                      </div>
                    </div>

                    <span className={`inline-block font-mono font-bold tabular-nums px-2 py-0.5 rounded text-xs border shrink-0 ${
                      isSafe
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isDanger
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {rep.attendancePercent.toFixed(1)}%
                    </span>
                  </div>

                  <div className="text-xs text-slate-800 font-medium">
                    {rep.courseTitle}
                  </div>

                  {/* Hours progress bar */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-mono text-slate-600">
                      <span>Ore Svolte: <strong>{rep.totalHoursAttended}h</strong> su {rep.totalHoursCourse}h</span>
                      <span>{rep.isEligibleForCertificate ? '✓ Ammesso' : '⚠️ A Rischio'}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${isSafe ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(100, (rep.totalHoursAttended / rep.totalHoursCourse) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Pills for session count */}
                  <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-mono">
                    <div className="bg-emerald-50 text-emerald-800 p-1 rounded">
                      <div className="font-bold">{rep.presentCount}</div>
                      <div className="text-[9px] text-emerald-600">Presente</div>
                    </div>
                    <div className="bg-amber-50 text-amber-800 p-1 rounded">
                      <div className="font-bold">{rep.lateCount}</div>
                      <div className="text-[9px] text-amber-600">Ritardo</div>
                    </div>
                    <div className="bg-rose-50 text-rose-800 p-1 rounded">
                      <div className="font-bold">{rep.absentCount}</div>
                      <div className="text-[9px] text-rose-600">Assente</div>
                    </div>
                    <div className="bg-blue-50 text-blue-800 p-1 rounded">
                      <div className="font-bold">{rep.excusedCount}</div>
                      <div className="text-[9px] text-blue-600">Giustif.</div>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedCertificate({ studentId: rep.studentId, courseId: rep.courseId })}
                      className="flex-1 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>Attestato Ufficiale</span>
                    </button>
                    <button
                      onClick={() => handleSendSingleStudentEmail(rep)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                      title="Invia riepilogo email"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP VIEW FOR REPORTS (Table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                <th className="py-3 px-4">Corsista & Matricola</th>
                <th className="py-3 px-4">Corso Assegnato</th>
                <th className="py-3 px-4 text-center">Frequenza (%)</th>
                <th className="py-3 px-4 text-center">Ore Svolte</th>
                <th className="py-3 px-4 text-center">Pres. / Rit. / Ass. / Giust.</th>
                <th className="py-3 px-4 text-center">Idoneità</th>
                <th className="py-3 px-4 text-right">Azioni Documentali</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Nessun report corrispondente ai filtri impostati.
                  </td>
                </tr>
              ) : (
                filteredReports.map((rep, idx) => {
                  const isSafe = rep.attendancePercent >= 80;
                  const isDanger = rep.attendancePercent < 70;

                  return (
                    <tr key={`${rep.studentId}-${rep.courseId}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      {/* Student info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{rep.studentName}</span>
                          {rep.age && (
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-normal">
                              {rep.age}a
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {rep.studentNumber} · {rep.guardianName ? `${rep.guardianName} (${rep.guardianPhone || ''})` : rep.studentEmail}
                        </div>
                      </td>

                      {/* Course */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 truncate max-w-[200px]">
                          {rep.courseTitle}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {rep.totalSessionsCompleted} lezioni concluse
                        </div>
                      </td>

                      {/* Percent */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block font-mono font-bold tabular-nums px-2 py-0.5 rounded text-xs border ${
                          isSafe
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isDanger
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {rep.attendancePercent.toFixed(1)}%
                        </span>
                      </td>

                      {/* Attended Hours */}
                      <td className="py-3 px-4 text-center tabular-nums font-semibold text-slate-900">
                        {rep.totalHoursAttended}h / {rep.totalHoursCourse}h
                      </td>

                      {/* Session counters */}
                      <td className="py-3 px-4 text-center font-mono tabular-nums text-[11px] text-slate-600">
                        <span className="text-emerald-700 font-semibold">{rep.presentCount}</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="text-amber-600">{rep.lateCount}</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="text-rose-600 font-semibold">{rep.absentCount}</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="text-blue-600">{rep.excusedCount}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {rep.isEligibleForCertificate ? (
                          <span className="text-emerald-700 font-medium inline-flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Ammesso
                          </span>
                        ) : (
                          <span className="text-rose-700 font-medium inline-flex items-center gap-1 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            A Rischio
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSendSingleStudentEmail(rep)}
                            title="Invia prospetto via email"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedCertificate({ studentId: rep.studentId, courseId: rep.courseId })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                          >
                            <Award className="w-3 h-3 text-amber-600" />
                            <span>Attestato</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certificate Modal Trigger */}
      {selectedCertificate && (
        <StudentCertificateModal
          studentId={selectedCertificate.studentId}
          courseId={selectedCertificate.courseId}
          onClose={() => setSelectedCertificate(null)}
        />
      )}
    </div>
  );
};
