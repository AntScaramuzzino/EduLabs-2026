import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { UserProfile } from '../types/attendance';
import { 
  FileSpreadsheet, 
  Upload, 
  Link as LinkIcon, 
  ClipboardPaste, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  X, 
  Sparkles,
  Users,
  Info
} from 'lucide-react';

interface GoogleImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (count: number) => void;
}

type ImportSourceTab = 'link' | 'paste' | 'file' | 'demo';

interface ParsedMinorRow {
  fullName: string;
  birthDate?: string;
  age?: number;
  fiscalCode?: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  emergencyContact?: string;
  authorizedPickup?: string;
  selfDismissalAuthorized?: boolean;
  allergiesNotes?: string;
  rawCourseName?: string;
  matchedCourseId?: string;
  status: 'valid' | 'warning' | 'error';
  errorMessage?: string;
}

export const GoogleImportModal: React.FC<GoogleImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { courses, importStudentsFromSheet, addNewCourse } = useAttendance();

  const [activeSourceTab, setActiveSourceTab] = useState<ImportSourceTab>('demo');
  const [sheetUrl, setSheetUrl] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedMinorRow[]>([]);
  const [defaultCourseId, setDefaultCourseId] = useState<string>(courses[0]?.id || 'course-1');
  const [importSummary, setImportSummary] = useState<{ imported: number; updated: number } | null>(null);

  if (!isOpen) return null;

  // Helper to calculate age from YYYY-MM-DD
  const calculateAge = (birthDateStr?: string): number | undefined => {
    if (!birthDateStr) return undefined;
    const parts = birthDateStr.split(/[-/]/);
    if (parts.length < 3) return undefined;
    let year = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1;
    let day = parseInt(parts[2], 10);
    // If format is DD/MM/YYYY
    if (parts[0].length <= 2 && parts[2].length === 4) {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      year = parseInt(parts[2], 10);
    }
    const bDate = new Date(year, month, day);
    if (isNaN(bDate.getTime())) return undefined;
    const diffMs = Date.now() - bDate.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  // Helper: CSV / TSV string parser supporting quotes
  const parseDelimitedText = (text: string): string[][] => {
    const lines = text.trim().split(/\r\n|\n|\r/);
    if (lines.length === 0) return [];
    
    // Determine delimiter: tab or comma or semicolon
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

    return lines.map(line => {
      const row: string[] = [];
      let inQuotes = false;
      let curr = '';

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          row.push(curr.trim().replace(/^["']|["']$/g, ''));
          curr = '';
        } else {
          curr += char;
        }
      }
      row.push(curr.trim().replace(/^["']|["']$/g, ''));
      return row;
    });
  };

  // Process rows with smart header detection
  const processRawRows = (rows: string[][]) => {
    if (rows.length < 2) {
      setParsingError('Il file o il testo incollato non contiene dati sufficienti (richiesta riga di intestazione + almeno una riga di dati).');
      return;
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());

    // Find column indexes
    const findIdx = (keywords: string[]): number => {
      return headers.findIndex(h => keywords.some(k => h.includes(k)));
    };

    const nameIdx = findIdx(['nome minore', 'allievo', 'minore', 'alunno', 'partecipante']);
    const surnameIdx = findIdx(['cognome minore', 'cognome']);
    const fullCombinedNameIdx = findIdx(['nome e cognome', 'nominativo']);
    const birthIdx = findIdx(['nascita', 'data di nascita', 'data nascita', 'nato il', 'età', 'eta']);
    const cfIdx = findIdx(['codice fiscale', 'c.f.', 'cf']);
    const guardianIdx = findIdx(['genitore', 'tutore', 'madre', 'padre', 'esercente', 'famiglia']);
    const phoneIdx = findIdx(['telefono', 'cellulare', 'recapito', 'tel', 'mobile', 'whatsapp']);
    const emailIdx = findIdx(['email', 'posta', 'e-mail']);
    const emergencyIdx = findIdx(['emergenza', 'secondo recapito', 'soccorso']);
    const pickupIdx = findIdx(['delega', 'ritiro', 'autorizzati', 'ritirare']);
    const exitIdx = findIdx(['uscita autonoma', 'autonomo', 'rientro da solo']);
    const allergiesIdx = findIdx(['allergie', 'note sanitarie', 'salute', 'dsa', 'intolleranze', 'patologie']);
    const courseIdx = findIdx(['corso', 'laboratorio', 'attività', 'modulo', 'workshop']);

    const parsed: ParsedMinorRow[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.length === 0 || row.every(cell => cell.trim() === '')) continue;

      let fullName = '';
      if (nameIdx >= 0 && surnameIdx >= 0 && surnameIdx !== nameIdx) {
        fullName = `${row[nameIdx] || ''} ${row[surnameIdx] || ''}`.trim();
      } else if (fullCombinedNameIdx >= 0) {
        fullName = row[fullCombinedNameIdx] || '';
      } else if (nameIdx >= 0) {
        fullName = row[nameIdx] || '';
      } else {
        // Fallback to first column
        fullName = row[0] || `Minore ${r}`;
      }

      const birthRaw = birthIdx >= 0 ? row[birthIdx] : '';
      const calcAgeVal = calculateAge(birthRaw);

      const guardianName = guardianIdx >= 0 ? row[guardianIdx] : 'Genitore / Tutore non spec.';
      const guardianPhone = phoneIdx >= 0 ? row[phoneIdx] : 'N/D';
      const guardianEmail = emailIdx >= 0 ? row[emailIdx] : '';
      const fiscalCode = cfIdx >= 0 ? row[cfIdx] : undefined;
      const emergencyContact = emergencyIdx >= 0 ? row[emergencyIdx] : undefined;
      const authorizedPickup = pickupIdx >= 0 ? row[pickupIdx] : undefined;
      const selfDismissalRaw = exitIdx >= 0 ? row[exitIdx]?.toLowerCase() : '';
      const selfDismissalAuthorized = selfDismissalRaw.includes('si') || selfDismissalRaw.includes('sì') || selfDismissalRaw.includes('autonoma') || selfDismissalRaw.includes('yes');
      const allergiesNotes = allergiesIdx >= 0 ? row[allergiesIdx] : undefined;
      const rawCourseName = courseIdx >= 0 ? row[courseIdx] : '';

      // Match course
      let matchedCourseId: string | undefined = undefined;
      if (rawCourseName) {
        const found = courses.find(c => 
          c.title.toLowerCase().includes(rawCourseName.toLowerCase()) || 
          rawCourseName.toLowerCase().includes(c.title.toLowerCase()) ||
          c.code.toLowerCase().includes(rawCourseName.toLowerCase())
        );
        if (found) matchedCourseId = found.id;
      }
      if (!matchedCourseId) matchedCourseId = defaultCourseId;

      let status: 'valid' | 'warning' | 'error' = 'valid';
      let errorMessage: string | undefined = undefined;

      if (!fullName || fullName.length < 2) {
        status = 'error';
        errorMessage = 'Nome minore mancante';
      } else if (!guardianPhone || guardianPhone === 'N/D') {
        status = 'warning';
        errorMessage = 'Recapito telefonico genitore mancante';
      }

      parsed.push({
        fullName,
        birthDate: birthRaw,
        age: calcAgeVal || 11,
        fiscalCode,
        guardianName,
        guardianPhone,
        guardianEmail,
        emergencyContact,
        authorizedPickup,
        selfDismissalAuthorized,
        allergiesNotes,
        rawCourseName,
        matchedCourseId,
        status,
        errorMessage,
      });
    }

    setParsedRows(parsed);
    setParsingError(null);
  };

  // Convert Google Sheet URL to CSV URL and fetch
  const handleFetchGoogleSheet = async () => {
    if (!sheetUrl.trim()) {
      setParsingError('Inserisci un URL valido di un foglio Google o del modulo Google Form.');
      return;
    }

    setIsLoading(true);
    setParsingError(null);

    try {
      // Standardize Google Sheet URL to export=csv
      let exportUrl = sheetUrl.trim();
      const match = exportUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        const docId = match[1];
        // Check gid parameter if present
        const gidMatch = exportUrl.match(/[#&?]gid=([0-9]+)/);
        const gid = gidMatch ? gidMatch[1] : '0';
        exportUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`;
      }

      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error(`Impossibile scaricare il foglio (HTTP ${response.status}). Assicurati che il foglio sia condiviso con "Chiunque abbia il link può visualizzare" oppure usa la scheda "Copia & Incolla" o "Carica CSV".`);
      }

      const text = await response.text();
      const rows = parseDelimitedText(text);
      processRawRows(rows);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setParsingError(
        `${message} Suggerimento: Se il foglio Google è privato o protetto da policy aziendali, scaricalo come CSV da Google Sheets ("File > Scarica > Valori separati da virgola") e caricalo qui sopra, oppure incolla direttamente le celle!`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle direct paste
  const handleProcessPastedText = () => {
    if (!pasteContent.trim()) {
      setParsingError('Incolla i dati copiati da Google Sheets o Excel nella casella di testo.');
      return;
    }
    const rows = parseDelimitedText(pasteContent);
    processRawRows(rows);
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const rows = parseDelimitedText(content);
        processRawRows(rows);
      }
    };
    reader.onerror = () => {
      setParsingError('Errore nella lettura del file CSV.');
    };
    reader.readAsText(file);
  };

  // Load sample dataset representing a realistic Google Form responses sheet
  const handleLoadDemoDataset = () => {
    const demoCSV = `Informazioni cronologiche,Nome Minore,Cognome Minore,Data di Nascita,Codice Fiscale Minore,Nome Genitore o Tutore,Telefono Genitore Urgenze,Email Genitore,Contatto di Emergenza,Delega al Ritiro,Uscita Autonoma Minore,Allergie o Note Sanitarie,Corso Assegnato
2026-09-01 10:15:30,Matteo,De Angelis,2015-06-12,DNGMTT15H12H501K,Silvia De Angelis (Madre),+39 347 1234567,silvia.deangelis@famiglia.it,Padre Paolo: 338 7654321,Genitori e Nonna Clara,No,Nessuna allergia,Laboratorio Robotica & Coding Junior
2026-09-01 11:22:10,Aurora,Barone,2016-03-25,BRNRRA16C65F205P,Gianluca Barone (Padre),+39 339 9876543,g.barone@email.it,Zia Marta: 340 1122334,Solo genitori,No,Intolleranza grave a glutine (celiaca),Laboratorio Robotica & Coding Junior
2026-09-01 14:05:40,Federico,Marchetti,2013-11-19,MRCFDR13S19H501U,Elena Marchetti (Madre),+39 348 5566778,elena.marchetti@gmail.com,Padre Luca: 335 8899001,Uscita autonoma,Sì,Nessuna,Game Design & Animazione con Scratch
2026-09-01 16:30:15,Chiara,Santoro,2014-08-04,SNTCHR14M44F839J,Marco Santoro (Padre),+39 333 4455667,m.santoro@tutori.it,Nonna Teresa: 349 2233445,Zia Francesca,No,Allergia lieve alle graminacee,Cittadinanza Digitale & Navigazione Sicura
2026-09-02 09:12:00,Gabriele,Russo,2012-05-30,RSSGRL12E30H501M,Daniela Russo (Madre),+39 340 6677889,daniela.russo@famiglia.it,Zio Roberto: 338 9900112,Uscita autonoma,Sì,Porta inalatore per asma da sforzo,FabLab Ragazzi: Modellazione 3D e Making
2026-09-02 12:45:18,Beatrice,Gallo,2015-10-14,GLLBTC15R54F205W,Vincenzo Gallo (Padre),+39 335 7788990,vincenzo.gallo@email.it,Madre Anna: 347 3344556,Genitori e nonni,No,Nessuna,Laboratorio Robotica & Coding Junior
2026-09-02 15:20:00,Samuele,Piras,2013-02-08,PRSSML13B08H501B,Alessia Piras (Madre),+39 348 2233445,a.piras@famiglia.it,Padre Giorgio: 339 6677889,Solo madre,No,Allergia alla frutta secca (arachidi),Game Design & Animazione con Scratch
2026-09-02 18:00:22,Martina,Lombardi,2011-07-21,LMBMTN11L61F839L,Claudio Lombardi (Padre),+39 349 8899001,c.lombardi@gmail.com,Madre Sonia: 334 1122334,Uscita autonoma,Sì,Nessuna,Storytelling & Web Radio Giovani`;

    const rows = parseDelimitedText(demoCSV);
    processRawRows(rows);
  };

  // Download official CSV template
  const handleDownloadTemplate = () => {
    const templateContent = `Informazioni cronologiche,Nome Minore,Cognome Minore,Data di Nascita (AAAA-MM-GG),Codice Fiscale Minore,Nome Genitore o Tutore,Telefono Genitore Urgenze,Email Genitore,Contatto di Emergenza,Delega al Ritiro,Uscita Autonoma (SI/NO),Allergie o Note Sanitarie,Corso Assegnato
2026-09-01 10:00:00,NomeEsempio,CognomeEsempio,2015-05-15,XXXXXX15X15XXXXX,Mario Rossi (Padre),+39 347 1234567,genitore@email.it,Nonna Maria: 333 1122334,Solo genitori,NO,Nessuna allergia,Laboratorio Robotica & Coding Junior`;

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_anagrafica_minori_google_sheets.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Commit import to context
  const handleConfirmImport = () => {
    const validRows = parsedRows.filter(r => r.status !== 'error');
    if (validRows.length === 0) {
      setParsingError('Nessun record valido selezionato per l\'importazione.');
      return;
    }

    const studentsToImport: Partial<UserProfile>[] = validRows.map(row => ({
      name: row.fullName,
      email: row.guardianEmail || `${row.fullName.toLowerCase().replace(/\s+/g, '.')}@minori.it`,
      birthDate: row.birthDate,
      age: row.age,
      fiscalCode: row.fiscalCode,
      guardianName: row.guardianName,
      guardianPhone: row.guardianPhone,
      guardianEmail: row.guardianEmail,
      emergencyContact: row.emergencyContact,
      authorizedPickup: row.authorizedPickup,
      selfDismissalAuthorized: row.selfDismissalAuthorized,
      allergiesNotes: row.allergiesNotes,
      enrolledCourseIds: [row.matchedCourseId || defaultCourseId],
      importedFromGoogle: true,
    }));

    const result = importStudentsFromSheet(studentsToImport);
    setImportSummary({ imported: result.imported, updated: result.updated });
    
    if (onSuccess) {
      onSuccess(result.count);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden max-h-[94vh] sm:max-h-[90vh] flex flex-col my-0 sm:my-8 animate-in slide-in-from-bottom-4 duration-200">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Importa Anagrafica Minori (Google Sheets / Forms)
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Sincronizza anagrafica, recapiti emergenze genitori e deleghe al ritiro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
          {/* Source Tabs (horizontally scrollable on mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-200 pb-2.5 overflow-x-auto no-scrollbar whitespace-nowrap">
            <button
              onClick={() => setActiveSourceTab('demo')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                activeSourceTab === 'demo'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dati Demo Google Form (1-Click)</span>
            </button>
            <button
              onClick={() => setActiveSourceTab('link')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                activeSourceTab === 'link'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Link Foglio Google Sheets</span>
            </button>
            <button
              onClick={() => setActiveSourceTab('paste')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                activeSourceTab === 'paste'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Copia & Incolla Colonne</span>
            </button>
            <button
              onClick={() => setActiveSourceTab('file')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                activeSourceTab === 'file'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Carica CSV / TSV</span>
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="ml-auto px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer shrink-0"
              title="Scarica file modello con colonne compatibili con Google Form"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Template CSV</span>
            </button>
          </div>

          {/* Active Tab View */}
          {activeSourceTab === 'demo' && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-blue-950">
                    Prova immediata con Foglio Risposte Google Form Minori
                  </h3>
                  <p className="text-xs text-blue-800 mt-1">
                    Carica istantaneamente 8 risposte di un modulo Google con dati reali di minori, numeri di telefono genitori per emergenze, deleghe al ritiro e preferenze corsi.
                  </p>
                </div>
              </div>
              <button
                onClick={handleLoadDemoDataset}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                <span>Carica 8 Iscrizioni di Esempio dal Google Form</span>
              </button>
            </div>
          )}

          {activeSourceTab === 'link' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL del Foglio Google Sheets (Foglio Risposte Google Form)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={e => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleFetchGoogleSheet}
                    disabled={isLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isLoading ? 'Connessione...' : 'Importa dal Link'}
                  </button>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  Come condividere il foglio Google:
                </div>
                <p>1. Su Google Sheets, clicca su <strong>Condividi</strong> in alto a destra.</p>
                <p>2. Imposta l'accesso generale su <strong>"Chiunque abbia il link può visualizzare"</strong> e incolla il link qui sopra.</p>
                <p>3. In alternativa, puoi usare la scheda <em>"Copia & Incolla Colonne"</em> selezionando le celle e premendo Ctrl+C / Ctrl+V!</p>
              </div>
            </div>
          )}

          {activeSourceTab === 'paste' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Incolla qui i dati selezionati da Google Sheets o Excel (Ctrl+V)
                </label>
                <textarea
                  rows={6}
                  value={pasteContent}
                  onChange={e => setPasteContent(e.target.value)}
                  placeholder={`Nome Minore\tCognome Minore\tData Nascita\tGenitore\tTelefono Urgenze\tEmail\tCorso\nMatteo\tRossi\t2015-05-12\tMario Rossi\t3471234567\tmario@email.it\tRobotica`}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleProcessPastedText}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Analizza Testo Incollato
              </button>
            </div>
          )}

          {activeSourceTab === 'file' && (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50/50 transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <label className="inline-block px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors">
                <span>Seleziona File CSV esportato dal Google Form</span>
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-slate-500 mt-2">
                Supporta file .csv delimitati da virgola, punto e virgola o tabulazione
              </p>
            </div>
          )}

          {/* Error notice */}
          {parsingError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-lg text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{parsingError}</span>
            </div>
          )}

          {/* Summary notice if already imported */}
          {importSummary && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Importazione completata con successo!</strong> Aggiunti {importSummary.imported} nuovi minori e aggiornati {importSummary.updated} iscritti.
                </span>
              </div>
              <button
                onClick={onClose}
                className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          )}

          {/* Parsed Rows Preview Table */}
          {parsedRows.length > 0 && !importSummary && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Anteprima Anagrafica Rilevata ({parsedRows.length} minori)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verifica i dati estratti dal modulo prima di confermare l'iscrizione
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">Corso di default:</span>
                  <select
                    value={defaultCourseId}
                    onChange={e => setDefaultCourseId(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-medium"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Minore & Età</th>
                      <th className="py-2.5 px-3">Genitore / Tutore</th>
                      <th className="py-2.5 px-3">Recapito Emergenze</th>
                      <th className="py-2.5 px-3">Uscita & Ritiro</th>
                      <th className="py-2.5 px-3">Corso Assegnato</th>
                      <th className="py-2.5 px-3">Stato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => {
                      const matchedCourse = courses.find(c => c.id === (row.matchedCourseId || defaultCourseId));

                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{row.fullName}</div>
                            <div className="text-[11px] text-slate-500">
                              {row.age ? `${row.age} anni` : 'Età N/D'}
                              {row.fiscalCode ? ` · ${row.fiscalCode}` : ''}
                            </div>
                            {row.allergiesNotes && (
                              <div className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded inline-block mt-0.5 font-medium">
                                ⚠️ {row.allergiesNotes}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-800">{row.guardianName}</div>
                            <div className="text-[11px] text-slate-500">{row.guardianEmail || 'Email non indicata'}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-mono text-slate-900 font-semibold">{row.guardianPhone}</div>
                            {row.emergencyContact && (
                              <div className="text-[10px] text-slate-500">{row.emergencyContact}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {row.selfDismissalAuthorized ? (
                              <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Uscita Autonoma
                              </span>
                            ) : (
                              <span className="inline-block text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                {row.authorizedPickup ? `Delega: ${row.authorizedPickup.slice(0, 24)}...` : 'Ritiro Genitore'}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-slate-800">
                              {matchedCourse?.code || 'CORSO'}
                            </span>
                            <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                              {matchedCourse?.title || row.rawCourseName || 'Corso Base'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            {row.status === 'valid' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Valido
                              </span>
                            ) : row.status === 'warning' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium" title={row.errorMessage}>
                                <AlertCircle className="w-3.5 h-3.5" />
                                Avviso
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-medium" title={row.errorMessage}>
                                <AlertCircle className="w-3.5 h-3.5" />
                                Errore
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {parsedRows.length > 0 && !importSummary && (
              <span>Pronti per l'importazione: <strong>{parsedRows.filter(r => r.status !== 'error').length}</strong> minori</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50"
            >
              Annulla
            </button>
            {parsedRows.length > 0 && !importSummary && (
              <button
                onClick={handleConfirmImport}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Conferma e Salva Iscrizioni nel Registro</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
