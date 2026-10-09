export interface ProjectConfig {
  titoloProgetto: string;
  slogan: string;
  rigaFinanziamento: string;
  cup: string;
  soggettoPromotore: string;
  responsabileProgetto: string;
  legaleRappresentante: string;
  luogoFirma: string;
  sogliaFrequenza: number; // 70% o 80%
  attestatoCriterio: 'SOGLIA' | 'PRESENTI';
  attestatoRitirati: boolean;
  targetMinori: number; // 220 minori diretti attesi
  targetPosti: number; // 310 posti-laboratorio
  targetRiservatiSS: number; // 20 riservati Servizio Sociale
  cartellaDriveId: string;
  formSheetId: string;
  formSheetName: string;
  importaSecondaScelta: boolean;
}

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  titoloProgetto: 'EduLabs 2026',
  slogan: 'La città che educa',
  rigaFinanziamento: 'Finanziato dal Comune di Lamezia Terme – Settore Servizi alla Persona, con risorse del Fondo per le politiche della famiglia (Presidenza del Consiglio dei Ministri) – Avviso attività socio-educative territoriali e Centri con funzione ricreativa ed educativa per i minori',
  cup: 'C89I26000930001',
  soggettoPromotore: 'InRete Società Cooperativa Sociale ETS',
  responsabileProgetto: 'Antonio Scaramuzzino',
  legaleRappresentante: 'Gennaro Di Cello',
  luogoFirma: 'Lamezia Terme',
  sogliaFrequenza: 70, // Soglia minima 70% da avviso pubblico
  attestatoCriterio: 'SOGLIA',
  attestatoRitirati: false,
  targetMinori: 220,
  targetPosti: 310,
  targetRiservatiSS: 20,
  cartellaDriveId: '1TmKaooLDegeanCMOksZtaTP57tLzB215',
  formSheetId: '',
  formSheetName: '',
  importaSecondaScelta: false,
};
