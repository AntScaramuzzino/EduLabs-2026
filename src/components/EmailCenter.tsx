import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { EmailNotificationLog } from '../types/attendance';
import { 
  Mail, 
  Send, 
  Settings, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Radio, 
  FileText, 
  Eye, 
  Sliders, 
  Check, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Server
} from 'lucide-react';

export const EmailCenter: React.FC = () => {
  const { 
    emailLogs, 
    emailSettings, 
    updateEmailSettings, 
    courses, 
    users, 
    triggerThresholdWarnings, 
    triggerPreSessionReminders, 
    triggerWeeklyReports,
    sendNotificationEmail
  } = useAttendance();

  const [activeTab, setActiveTab] = useState<'outbox' | 'compose' | 'settings'>('outbox');
  const [selectedEmailPreview, setSelectedEmailPreview] = useState<EmailNotificationLog | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual Composer form state
  const [composerCourseId, setComposerCourseId] = useState<string>(courses[0]?.id || '');
  const [composerRecipientType, setComposerRecipientType] = useState<'all_course' | 'single_student'>('all_course');
  const [composerSingleStudentId, setComposerSingleStudentId] = useState<string>('');
  const [composerSubject, setComposerSubject] = useState<string>('Comunicazione Ufficiale Presenze e Frequenza');
  const [composerTemplate, setComposerTemplate] = useState<string>('custom');
  const [composerMessage, setComposerMessage] = useState<string>(
    'Vi ricordiamo che la frequenza minima del corso è fissata all\'80% per avere diritto alla certificazione finale.'
  );

  // Settings form state
  const [settingsForm, setSettingsForm] = useState(emailSettings);
  const [isSettingsSaved, setIsSettingsSaved] = useState(false);

  const students = users.filter(u => u.role === 'student');

  const handleApplyTemplate = (templateType: string) => {
    setComposerTemplate(templateType);
    if (templateType === 'absence_alert') {
      setComposerSubject('⚠️ Attenzione: Numero assenze registrate elevato');
      setComposerMessage(
        'Gentile corsista,\n\nDai nostri registri risulta che hai accumulato diverse assenze. Ti invitiamo a prendere visione delle ore rimanenti e ad accedere alla dashboard per inoltrare eventuali giustificativi prima della sessione di verifica finale.'
      );
    } else if (templateType === 'reminder') {
      setComposerSubject('📅 Promemoria Lezione Online e Check-in Presenze');
      setComposerMessage(
        'Gentile corsista,\n\nTi ricordiamo che la prossima lezione del corso si terrà regolarmente online. All\'inizio della lezione il docente comunicherà il PIN OTP per convalidare la tua presenza.'
      );
    } else if (templateType === 'certificate_ready') {
      setComposerSubject('🎓 Congratulazioni: Soglia 80% Raggiunta - Attestato Disponibile');
      setComposerMessage(
        'Gentile corsista,\n\nCi complimentiamo per la tua costanza! Hai raggiunto la soglia minima di frequenza richiesta per l\'ottenimento del certificato ufficiale. Puoi scaricare l\'attestato digitale direttamente dalla tua dashboard.'
      );
    }
  };

  const handleSendManualEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const course = courses.find(c => c.id === composerCourseId) || courses[0];

    const formattedBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">PresenzeLive • Comunicazione Docente</h2>
        <p style="font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-line;">
          ${composerMessage}
        </p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; margin: 16px 0; font-size: 13px; color: #475569;">
          Corso: <strong>${course.title}</strong> (${course.code})<br/>
          Docente: ${course.instructorName}
        </div>
        <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 24px;">
          Questa notifica è stata generata dal sistema automatico PresenzeLive per conto della segreteria didattica.
        </p>
      </div>
    `;

    if (composerRecipientType === 'all_course') {
      const courseStudents = students.filter(s => s.enrolledCourseIds.includes(course.id));
      courseStudents.forEach(st => {
        sendNotificationEmail(
          st.email,
          st.name,
          course.title,
          composerSubject,
          'weekly_report',
          formattedBody
        );
      });
      setToastMessage(`Email inviata con successo a tutti i ${courseStudents.length} studenti del corso.`);
    } else {
      const student = students.find(s => s.id === composerSingleStudentId);
      if (student) {
        sendNotificationEmail(
          student.email,
          student.name,
          course.title,
          composerSubject,
          'threshold_warning',
          formattedBody
        );
        setToastMessage(`Email inviata con successo a ${student.name} (${student.email}).`);
      }
    }

    setActiveTab('outbox');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmailSettings(settingsForm);
    setIsSettingsSaved(true);
    setToastMessage('Configurazione provider SMTP e trigger automatici salvata correttamente.');
    setTimeout(() => {
      setIsSettingsSaved(false);
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs px-4 py-3 rounded-lg flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            Chiudi
          </button>
        </div>
      )}

      {/* Top Banner and Quick Trigger Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider">
              <Mail className="w-4 h-4" />
              <span>Centro Notifiche Email & Integrazioni</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Automazioni Email & Registro Invii
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Sistema integrato per promemoria lezioni, allarmi automatici per il superamento della soglia minima dell'80% e invio report periodici individuali.
            </p>
          </div>

          {/* Automated trigger launcher buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const count = triggerThresholdWarnings();
                setToastMessage(`Attivata automazione: inviati ${count} alert per studenti sotto soglia.`);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Avvia Alert &lt;80%</span>
            </button>
            <button
              onClick={() => {
                const count = triggerWeeklyReports();
                setToastMessage(`Inviati ${count} report riepilogativi via email.`);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Report a Tutti</span>
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button
            onClick={() => setActiveTab('outbox')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'outbox' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Registro Spedizioni ({emailLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'compose' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Componi Nuova Email</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'settings' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurazione SMTP & Webhook</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Email Outbox Log */}
      {activeTab === 'outbox' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Storico Completo Notifiche Inviate
            </h3>
            <span className="text-xs text-slate-500">
              Provider: {emailSettings.senderEmail}
            </span>
          </div>

          {/* MOBILE CARD VIEW FOR EMAIL LOGS */}
          <div className="block md:hidden divide-y divide-slate-100">
            {emailLogs.length === 0 ? (
              <div className="py-8 px-4 text-center text-slate-400 text-xs">
                Nessuna email registrata nello storico.
              </div>
            ) : (
              emailLogs.map(log => (
                <div key={`m-${log.id}`} className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{log.recipientName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{log.recipientEmail}</div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Consegnata</span>
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-800">
                    {log.subject}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>{log.courseTitle}</span>
                    <button
                      onClick={() => setSelectedEmailPreview(log)}
                      className="px-2 py-1 text-xs font-bold text-blue-700 bg-blue-50 rounded cursor-pointer"
                    >
                      Leggi
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                  <th className="py-3 px-4">Destinatario</th>
                  <th className="py-3 px-4">Oggetto & Tipologia</th>
                  <th className="py-3 px-4">Corso Associato</th>
                  <th className="py-3 px-4">Data & Ora Invio</th>
                  <th className="py-3 px-4 text-center">Stato Consegna</th>
                  <th className="py-3 px-4 text-right">Anteprima HTML</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {emailLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Nessuna email registrata nello storico.
                    </td>
                  </tr>
                ) : (
                  emailLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{log.recipientName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{log.recipientEmail}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 truncate max-w-[280px]">
                          {log.subject}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {log.type === 'threshold_warning' && 'Allerta Soglia Minima'}
                          {log.type === 'session_reminder' && 'Promemoria Lezione'}
                          {log.type === 'weekly_report' && 'Prospetto Presenze'}
                          {log.type === 'checkin_confirmed' && 'Conferma Check-in'}
                          {log.type === 'excuse_status' && 'Esito Giustificativo'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 truncate max-w-[180px]">
                        {log.courseTitle}
                      </td>

                      <td className="py-3 px-4 tabular-nums text-slate-500">
                        {new Date(log.sentAt).toLocaleString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Consegnata</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedEmailPreview(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Visualizza</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Compose Email */}
      {activeTab === 'compose' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-3xl">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Componi e Invia Notifica Email
          </h3>

          <form onSubmit={handleSendManualEmail} className="space-y-4 text-xs">
            {/* Quick Templates */}
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Modelli Email Predefiniti (1-Click)
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('absence_alert')}
                  className="px-2.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg font-medium cursor-pointer"
                >
                  Modello Allerta Assenze (&lt;80%)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('reminder')}
                  className="px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg font-medium cursor-pointer"
                >
                  Modello Promemoria Lezione
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('certificate_ready')}
                  className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg font-medium cursor-pointer"
                >
                  Modello Attestato Conseguito
                </button>
              </div>
            </div>

            {/* Course select */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corso di Riferimento</label>
              <select
                value={composerCourseId}
                onChange={e => setComposerCourseId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient scope */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destinatari</label>
                <select
                  value={composerRecipientType}
                  onChange={e => setComposerRecipientType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                >
                  <option value="all_course">Tutti gli studenti iscritti al corso</option>
                  <option value="single_student">Singolo studente specifico</option>
                </select>
              </div>

              {composerRecipientType === 'single_student' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Seleziona Studente</label>
                  <select
                    value={composerSingleStudentId}
                    onChange={e => setComposerSingleStudentId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                  >
                    <option value="">-- Seleziona uno studente --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.studentNumber}) - {s.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Oggetto dell'Email</label>
              <input
                type="text"
                required
                value={composerSubject}
                onChange={e => setComposerSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corpo del Messaggio</label>
              <textarea
                rows={5}
                required
                value={composerMessage}
                onChange={e => setComposerMessage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Invia Notifica Adesso</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-3xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Integrazione Server di Posta & Trigger Automatici
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configura i parametri del gateway email SMTP/API e abilita le automazioni per le presenze.
              </p>
            </div>
            <Server className="w-5 h-5 text-slate-400" />
          </div>

          <form onSubmit={handleSaveSettings} className="mt-6 space-y-6 text-xs">
            {/* Automatic Trigger Toggles */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="font-semibold text-slate-800 text-sm">Automazioni di Notifica Presenze</div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.enableAutoWarningEmail}
                  onChange={e => setSettingsForm({ ...settingsForm, enableAutoWarningEmail: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-slate-900">Allerta Automatica Soglia Minima (&lt;80%)</div>
                  <div className="text-[11px] text-slate-500">
                    Spedisce automaticamente una diffida formale allo studente quando la frequenza scende sotto l'80%.
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.enableAutoPreSessionReminder}
                  onChange={e => setSettingsForm({ ...settingsForm, enableAutoPreSessionReminder: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-slate-900">Promemoria Pre-Lezione con Codice OTP</div>
                  <div className="text-[11px] text-slate-500">
                    Invia promemoria via email 1 ora prima dell'inizio della sessione streaming.
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.enableAutoReportEmail}
                  onChange={e => setSettingsForm({ ...settingsForm, enableAutoReportEmail: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-slate-900">Ricevuta Digitale di Check-in</div>
                  <div className="text-[11px] text-slate-500">
                    Invia allo studente un'email di conferma con timestamp e codice di transazione al check-in.
                  </div>
                </div>
              </label>
            </div>

            {/* SMTP Gateway Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Host SMTP Server</label>
                <input
                  type="text"
                  value={settingsForm.smtpHost}
                  onChange={e => setSettingsForm({ ...settingsForm, smtpHost: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Porta SMTP</label>
                <input
                  type="number"
                  value={settingsForm.smtpPort}
                  onChange={e => setSettingsForm({ ...settingsForm, smtpPort: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome Mittente</label>
                <input
                  type="text"
                  value={settingsForm.senderName}
                  onChange={e => setSettingsForm({ ...settingsForm, senderName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Indirizzo Email Mittente</label>
                <input
                  type="email"
                  value={settingsForm.senderEmail}
                  onChange={e => setSettingsForm({ ...settingsForm, senderEmail: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Webhook URL Notifiche Esterne</label>
              <input
                type="url"
                value={settingsForm.webhookUrl}
                onChange={e => setSettingsForm({ ...settingsForm, webhookUrl: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono"
              />
              <span className="text-[11px] text-slate-400">
                Invia payload JSON in tempo reale a Slack, Discord o endpoint CRM aziendale.
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Salva Impostazioni Notifiche</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Email HTML Preview Modal */}
      {selectedEmailPreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden border border-slate-200 shadow-2xl">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900">Anteprima Email Inviata</span>
                <div className="text-[11px] text-slate-500">
                  A: {selectedEmailPreview.recipientName} ({selectedEmailPreview.recipientEmail})
                </div>
              </div>
              <button
                onClick={() => setSelectedEmailPreview(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 bg-slate-100 max-h-[70vh] overflow-y-auto">
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
                <div className="text-xs text-slate-500 border-b border-slate-100 pb-3 mb-4 space-y-1">
                  <div><strong>Oggetto:</strong> {selectedEmailPreview.subject}</div>
                  <div><strong>Data invio:</strong> {new Date(selectedEmailPreview.sentAt).toLocaleString('it-IT')}</div>
                </div>
                <div
                  className="text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedEmailPreview.bodyHtml }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedEmailPreview(null)}
                className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
