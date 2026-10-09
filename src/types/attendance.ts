export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

export type UserRole = 'instructor' | 'educator' | 'student' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  enrolledCourseIds: string[]; // courses student is enrolled in or instructor/educator teaches
  studentNumber?: string; // e.g. MIN-2026-084
  
  // Specific fields for Minors (Corsi per Minori)
  birthDate?: string; // YYYY-MM-DD
  age?: number; // e.g. 11
  fiscalCode?: string; // Codice Fiscale minore
  guardianName?: string; // Nome e Cognome Genitore/Tutore Legale
  guardianPhone?: string; // Recapito telefonico urgenze
  guardianEmail?: string; // Email per notifiche assenze e comunicazioni
  emergencyContact?: string; // Secondo recapito di emergenza
  authorizedPickup?: string; // Deleghe al ritiro (es. "Nonna Maria Bianchi, Zio Luca")
  selfDismissalAuthorized?: boolean; // Autorizzazione uscita autonoma (per minori >= 14 anni)
  allergiesNotes?: string; // Note sanitarie, allergie, intolleranze o DSA/BES
  importedFromGoogle?: boolean; // Flag se importato da Google Form/Sheets
  registrationTimestamp?: string; // Timestamp di compilazione del form
}

export interface Course {
  id: string;
  title: string;
  code: string;
  partnerEntity?: string; // Ente / Associazione partner che cura il laboratorio
  instructorName: string;
  instructorEmail: string;
  educatorName?: string; // Educatore / Tutor di sostegno minori assegnato
  educatorEmail?: string;
  totalHours: number;
  totalSessions: number;
  minimumAttendancePercent: number; // default 80%
  schedule: string; // e.g. "Lun - Mer 16:30 - 18:30"
  description: string;
  category: string;
  level: 'Base' | 'Intermedio' | 'Avanzato';
  targetAge?: string; // Fascia d'età minori (es. "8-11 anni", "12-14 anni", "14-17 anni")
  venue?: string; // Sede territoriale (es. "Casa della Cultura", "Civico Trame", ecc.)
  themeColor?: string; // Colore identificativo visual del laboratorio
  iconType?: string;
  activeSessionPin?: string;
  isSessionActive?: boolean;
}

export interface CourseSession {
  id: string;
  courseId: string;
  sessionNumber: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  topic: string;
  hours: number;
  isCompleted: boolean;
  
  // Firme ufficiali operatori presenti (i minori NON firmano)
  instructorName?: string;
  signedByInstructor?: boolean;
  instructorSignatureTimestamp?: string;
  instructorVerificationHash?: string;
  
  educatorName?: string;
  educatorId?: string;
  signedByEducator?: boolean;
  educatorSignatureTimestamp?: string;
  educatorVerificationHash?: string;
  educatorNotes?: string; // Diario di bordo socio-educativo sul gruppo minori
  
  // Backward compatibility / aggregate signature
  checkinCode?: string;
  activeSessionPin?: string;
  signatureTimestamp?: string;
  verificationHash?: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  courseId: string;
  studentId: string;
  status: AttendanceStatus;
  checkinTime?: string; // HH:mm:ss
  attendedHours: number;
  notes?: string;
  verifiedByPin?: boolean;
  deviceFingerprint?: string;
  ipAddress?: string;
  updatedAt: string;
  validatedByEducator?: boolean;
  validatedByInstructor?: boolean;
}

export interface AbsenceExcuse {
  id: string;
  studentId: string;
  studentName: string;
  guardianName?: string;
  courseId: string;
  sessionId: string;
  sessionDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: string;
  reviewerNotes?: string;
}

export interface EmailNotificationLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  courseTitle: string;
  subject: string;
  type: 'threshold_warning' | 'session_reminder' | 'weekly_report' | 'checkin_confirmed' | 'excuse_status';
  bodyHtml: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed';
}

export interface StudentReportSummary {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentNumber: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  age?: number;
  courseId: string;
  courseTitle: string;
  totalSessionsCompleted: number;
  totalSessionsCourse: number;
  totalHoursCourse: number;
  totalHoursAttended: number;
  attendancePercent: number; // e.g. 85.5
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  isEligibleForCertificate: boolean;
  statusCategory: 'safe' | 'warning' | 'danger'; // safe >= 80%, warning 70-79%, danger < 70%
}
