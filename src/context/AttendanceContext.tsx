import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Course,
  CourseSession,
  UserProfile,
  AttendanceRecord,
  AbsenceExcuse,
  EmailNotificationLog,
  StudentReportSummary,
  AttendanceStatus,
} from '../types/attendance';
import {
  INITIAL_COURSES,
  INITIAL_USERS,
  INITIAL_SESSIONS,
  generateInitialAttendance,
  INITIAL_EXCUSES,
  INITIAL_EMAIL_LOGS,
} from '../data/mockData';

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  senderName: string;
  senderEmail: string;
  enableAutoWarningEmail: boolean;
  enableAutoPreSessionReminder: boolean;
  enableAutoReportEmail: boolean;
  webhookUrl: string;
}

interface AttendanceContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  courses: Course[];
  sessions: CourseSession[];
  users: UserProfile[];
  attendanceRecords: AttendanceRecord[];
  excuses: AbsenceExcuse[];
  emailLogs: EmailNotificationLog[];
  emailSettings: EmailSettings;
  updateEmailSettings: (settings: Partial<EmailSettings>) => void;
  
  // Actions
  updateAttendanceStatus: (recordId: string, status: AttendanceStatus, attendedHours?: number, notes?: string) => void;
  batchUpdateAttendance: (sessionId: string, status: AttendanceStatus) => void;
  submitStudentCheckin: (courseId: string, pin: string) => { success: boolean; message: string };
  toggleSessionActive: (courseId: string, pin?: string) => void;
  signAndLockSession: (sessionId: string) => void;
  signSessionByInstructor: (sessionId: string, instructorName?: string) => void;
  signSessionByEducator: (sessionId: string, educatorName?: string, notes?: string) => void;
  submitExcuse: (courseId: string, sessionId: string, reason: string) => void;
  reviewExcuse: (excuseId: string, status: 'approved' | 'rejected', reviewerNotes?: string) => void;
  
  // Anagrafica & Google Sheet / Form Import
  importStudentsFromSheet: (studentsData: Partial<UserProfile>[], courseIdMapping?: Record<string, string>) => { imported: number; updated: number; count: number };
  updateStudentProfile: (studentId: string, updates: Partial<UserProfile>) => void;
  deleteStudent: (studentId: string) => void;
  addNewCourse: (course: Course) => void;
  
  // Email dispatching
  sendNotificationEmail: (
    recipientEmail: string,
    recipientName: string,
    courseTitle: string,
    subject: string,
    type: EmailNotificationLog['type'],
    bodyHtml: string
  ) => void;
  triggerThresholdWarnings: (courseId?: string) => number;
  triggerPreSessionReminders: (courseId: string) => number;
  triggerWeeklyReports: (courseId?: string) => number;
  
  // Reporting
  getStudentReport: (studentId: string, courseId: string) => StudentReportSummary | null;
  getAllReportsForCourse: (courseId: string) => StudentReportSummary[];
  getAllReportsForStudent: (studentId: string) => StudentReportSummary[];
  
  // Reset
  resetToDefaultData: () => void;
}

const STORAGE_KEY_PREFIX = 'presenzelive_v1_';

const defaultEmailSettings: EmailSettings = {
  smtpHost: 'mail.smtp-accademia.net',
  smtpPort: 587,
  senderName: 'PresenzeLive - Sistema Didattico',
  senderEmail: 'notifiche-presenze@accademiaonline.it',
  enableAutoWarningEmail: true,
  enableAutoPreSessionReminder: true,
  enableAutoReportEmail: true,
  webhookUrl: 'https://api.accademiaonline.it/v1/webhooks/attendance-events',
};

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}courses`);
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}users`);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}current_user`);
    if (saved) {
      return JSON.parse(saved);
    }
    // Default to the first instructor (Prof. Marco Rossi) or admin
    return INITIAL_USERS[1];
  });

  const [sessions, setSessions] = useState<CourseSession[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}sessions`);
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}attendance`);
    return saved ? JSON.parse(saved) : generateInitialAttendance();
  });

  const [excuses, setExcuses] = useState<AbsenceExcuse[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}excuses`);
    return saved ? JSON.parse(saved) : INITIAL_EXCUSES;
  });

  const [emailLogs, setEmailLogs] = useState<EmailNotificationLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}email_logs`);
    return saved ? JSON.parse(saved) : INITIAL_EMAIL_LOGS;
  });

  const [emailSettings, setEmailSettings] = useState<EmailSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}email_settings`);
    return saved ? JSON.parse(saved) : defaultEmailSettings;
  });

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}courses`, JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}current_user`, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}sessions`, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}attendance`, JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}excuses`, JSON.stringify(excuses));
  }, [excuses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}email_logs`, JSON.stringify(emailLogs));
  }, [emailLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}email_settings`, JSON.stringify(emailSettings));
  }, [emailSettings]);

  const updateEmailSettings = (settings: Partial<EmailSettings>) => {
    setEmailSettings(prev => ({ ...prev, ...settings }));
  };

  const updateAttendanceStatus = (
    recordId: string,
    status: AttendanceStatus,
    attendedHours?: number,
    notes?: string
  ) => {
    setAttendanceRecords(prev =>
      prev.map(rec => {
        if (rec.id === recordId) {
          const session = sessions.find(s => s.id === rec.sessionId);
          const maxHours = session ? session.hours : 2;
          let newHours = attendedHours !== undefined ? attendedHours : rec.attendedHours;
          if (attendedHours === undefined) {
            if (status === 'present' || status === 'excused') newHours = maxHours;
            else if (status === 'late') newHours = Math.max(0.5, maxHours - 0.5);
            else if (status === 'absent') newHours = 0;
          }
          return {
            ...rec,
            status,
            attendedHours: newHours,
            notes: notes !== undefined ? notes : rec.notes,
            updatedAt: new Date().toISOString(),
          };
        }
        return rec;
      })
    );
  };

  const batchUpdateAttendance = (sessionId: string, status: AttendanceStatus) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    const maxHours = session.hours;

    setAttendanceRecords(prev =>
      prev.map(rec => {
        if (rec.sessionId === sessionId) {
          let newHours = maxHours;
          if (status === 'absent') newHours = 0;
          if (status === 'late') newHours = Math.max(0.5, maxHours - 0.5);
          return {
            ...rec,
            status,
            attendedHours: newHours,
            checkinTime: status === 'present' || status === 'late' ? '18:30:00' : undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return rec;
      })
    );
  };

  const submitStudentCheckin = (courseId: string, pin: string): { success: boolean; message: string } => {
    const course = courses.find(c => c.id === courseId);
    if (!course) {
      return { success: false, message: 'Corso non trovato.' };
    }

    if (!course.isSessionActive) {
      return { success: false, message: 'La sessione non è attualmente attiva. Attendi che il docente apra il registro.' };
    }

    if (course.activeSessionPin !== pin.trim()) {
      return { success: false, message: 'Codice PIN errato. Verifica il codice mostrato a schermo dal docente.' };
    }

    // Find the active session for this course
    const activeSession = sessions.find(s => s.courseId === courseId && !s.isCompleted);
    if (!activeSession) {
      return { success: false, message: 'Nessuna sessione aperta disponibile per questo corso.' };
    }

    // Look for existing record or create one
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    // Check if late (e.g. > 15 mins after session start)
    const [startH, startM] = activeSession.startTime.split(':').map(Number);
    const sessionStartMinutes = startH * 60 + startM;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isLate = currentMinutes - sessionStartMinutes > 15;

    const existingRecord = attendanceRecords.find(
      r => r.sessionId === activeSession.id && r.studentId === currentUser.id
    );

    if (existingRecord) {
      if (existingRecord.status === 'present' || existingRecord.status === 'late') {
        return { success: true, message: `Hai già registrato la tua presenza alle ore ${existingRecord.checkinTime}.` };
      }

      setAttendanceRecords(prev =>
        prev.map(r => {
          if (r.id === existingRecord.id) {
            return {
              ...r,
              status: isLate ? 'late' : 'present',
              checkinTime: timeString,
              attendedHours: isLate ? Math.max(0.5, activeSession.hours - 0.5) : activeSession.hours,
              verifiedByPin: true,
              deviceFingerprint: `${navigator.userAgent.slice(0, 40)} (WebRTC validato)`,
              ipAddress: '93.45.112.84',
              updatedAt: now.toISOString(),
            };
          }
          return r;
        })
      );
    } else {
      // New record
      const newRecord: AttendanceRecord = {
        id: `att-${activeSession.id}-${currentUser.id}`,
        sessionId: activeSession.id,
        courseId,
        studentId: currentUser.id,
        status: isLate ? 'late' : 'present',
        checkinTime: timeString,
        attendedHours: isLate ? Math.max(0.5, activeSession.hours - 0.5) : activeSession.hours,
        verifiedByPin: true,
        deviceFingerprint: `${navigator.userAgent.slice(0, 40)} (WebRTC validato)`,
        ipAddress: '93.45.112.84',
        updatedAt: now.toISOString(),
      };
      setAttendanceRecords(prev => [...prev, newRecord]);
    }

    // Auto send confirmation email if enabled
    if (emailSettings.enableAutoReportEmail) {
      sendNotificationEmail(
        currentUser.email,
        currentUser.name,
        course.title,
        `✅ Check-in Confermato: ${course.title}`,
        'checkin_confirmed',
        `<p>Gentile <strong>${currentUser.name}</strong>,</p><p>La tua presenza alla sessione di <strong>${course.title}</strong> è stata registrata alle <strong>${timeString}</strong> con PIN convalidato.</p>`
      );
    }

    return {
      success: true,
      message: `Presenza convalidata con successo alle ore ${timeString}! Stato: ${isLate ? 'In ritardo' : 'Presente'}.`,
    };
  };

  const toggleSessionActive = (courseId: string, customPin?: string) => {
    setCourses(prev =>
      prev.map(c => {
        if (c.id === courseId) {
          const newStatus = !c.isSessionActive;
          const newPin = newStatus ? customPin || String(Math.floor(1000 + Math.random() * 9000)) : c.activeSessionPin;
          return {
            ...c,
            isSessionActive: newStatus,
            activeSessionPin: newPin,
          };
        }
        return c;
      })
    );
  };

  const signAndLockSession = (sessionId: string) => {
    const hash = 'SHA256-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const timestamp = new Date().toISOString();

    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            isCompleted: true,
            signedByInstructor: true,
            instructorSignatureTimestamp: timestamp,
            instructorVerificationHash: hash,
            signedByEducator: true,
            educatorSignatureTimestamp: timestamp,
            educatorVerificationHash: 'SHA256-EDU-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            signatureTimestamp: timestamp,
            verificationHash: hash,
          };
        }
        return s;
      })
    );

    // Turn off active session in course if matched
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCourses(prev =>
        prev.map(c => {
          if (c.id === session.courseId) {
            return { ...c, isSessionActive: false };
          }
          return c;
        })
      );
    }
  };

  const signSessionByInstructor = (sessionId: string, instructorName?: string) => {
    const hash = 'SHA256-DOC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = new Date().toISOString();

    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          const isNowCompleted = s.signedByEducator || false;
          return {
            ...s,
            signedByInstructor: true,
            instructorName: instructorName || currentUser.name,
            instructorSignatureTimestamp: timestamp,
            instructorVerificationHash: hash,
            verificationHash: s.verificationHash || hash,
            isCompleted: isNowCompleted ? true : s.isCompleted,
          };
        }
        return s;
      })
    );
  };

  const signSessionByEducator = (sessionId: string, educatorName?: string, notes?: string) => {
    const hash = 'SHA256-EDU-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = new Date().toISOString();

    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          const isNowCompleted = s.signedByInstructor || false;
          return {
            ...s,
            signedByEducator: true,
            educatorName: educatorName || currentUser.name,
            educatorSignatureTimestamp: timestamp,
            educatorVerificationHash: hash,
            educatorNotes: notes !== undefined ? notes : s.educatorNotes,
            isCompleted: isNowCompleted ? true : s.isCompleted,
          };
        }
        return s;
      })
    );
  };

  const importStudentsFromSheet = (
    studentsData: Partial<UserProfile>[],
    courseIdMapping?: Record<string, string>
  ): { imported: number; updated: number; count: number } => {
    let imported = 0;
    let updated = 0;

    setUsers(prevUsers => {
      const updatedUsers = [...prevUsers];

      studentsData.forEach(newMinor => {
        if (!newMinor.name || newMinor.name.trim() === '') return;

        // Check if student exists by email, fiscal code, or name match
        const existingIdx = updatedUsers.findIndex(u => {
          if (newMinor.email && u.email && u.email.toLowerCase() === newMinor.email.toLowerCase()) return true;
          if (newMinor.fiscalCode && u.fiscalCode && u.fiscalCode.toUpperCase() === newMinor.fiscalCode.toUpperCase()) return true;
          return u.name.trim().toLowerCase() === newMinor.name!.trim().toLowerCase();
        });

        const targetCourses = (newMinor.enrolledCourseIds || []).map(cid =>
          courseIdMapping && courseIdMapping[cid] ? courseIdMapping[cid] : cid
        );

        if (existingIdx >= 0) {
          // Merge details
          const current = updatedUsers[existingIdx];
          const mergedCourses = Array.from(new Set([...current.enrolledCourseIds, ...targetCourses]));
          updatedUsers[existingIdx] = {
            ...current,
            guardianName: newMinor.guardianName || current.guardianName,
            guardianPhone: newMinor.guardianPhone || current.guardianPhone,
            guardianEmail: newMinor.guardianEmail || current.guardianEmail,
            birthDate: newMinor.birthDate || current.birthDate,
            age: newMinor.age || current.age,
            fiscalCode: newMinor.fiscalCode || current.fiscalCode,
            emergencyContact: newMinor.emergencyContact || current.emergencyContact,
            authorizedPickup: newMinor.authorizedPickup || current.authorizedPickup,
            selfDismissalAuthorized: newMinor.selfDismissalAuthorized !== undefined ? newMinor.selfDismissalAuthorized : current.selfDismissalAuthorized,
            allergiesNotes: newMinor.allergiesNotes || current.allergiesNotes,
            enrolledCourseIds: mergedCourses,
            importedFromGoogle: true,
          };
          updated++;
        } else {
          // Add new minor
          const newId = `student-gf-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const genNumber = `MIN-2026-${String(updatedUsers.filter(u => u.role === 'student').length + 1).padStart(3, '0')}`;
          
          const createdMinor: UserProfile = {
            id: newId,
            name: newMinor.name,
            email: newMinor.email || `${newMinor.name.toLowerCase().replace(/\s+/g, '.')}@minori.it`,
            role: 'student',
            studentNumber: genNumber,
            birthDate: newMinor.birthDate,
            age: newMinor.age,
            fiscalCode: newMinor.fiscalCode,
            guardianName: newMinor.guardianName,
            guardianPhone: newMinor.guardianPhone,
            guardianEmail: newMinor.guardianEmail,
            emergencyContact: newMinor.emergencyContact,
            authorizedPickup: newMinor.authorizedPickup,
            selfDismissalAuthorized: newMinor.selfDismissalAuthorized || false,
            allergiesNotes: newMinor.allergiesNotes,
            enrolledCourseIds: targetCourses.length > 0 ? targetCourses : [courses[0]?.id || 'course-1'],
            importedFromGoogle: true,
            registrationTimestamp: new Date().toISOString(),
          };

          updatedUsers.push(createdMinor);
          imported++;
        }
      });

      return updatedUsers;
    });

    return { imported, updated, count: imported + updated };
  };

  const updateStudentProfile = (studentId: string, updates: Partial<UserProfile>) => {
    setUsers(prev => prev.map(u => (u.id === studentId ? { ...u, ...updates } : u)));
  };

  const deleteStudent = (studentId: string) => {
    setUsers(prev => prev.filter(u => u.id !== studentId));
    setAttendanceRecords(prev => prev.filter(r => r.studentId !== studentId));
  };

  const addNewCourse = (course: Course) => {
    setCourses(prev => [...prev, course]);
  };

  const submitExcuse = (courseId: string, sessionId: string, reason: string) => {
    const session = sessions.find(s => s.id === sessionId);
    const newExcuse: AbsenceExcuse = {
      id: `exc-${Date.now()}`,
      studentId: currentUser.id,
      studentName: currentUser.name,
      courseId,
      sessionId,
      sessionDate: session ? session.date : new Date().toISOString().split('T')[0],
      reason,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    setExcuses(prev => [newExcuse, ...prev]);
  };

  const reviewExcuse = (excuseId: string, status: 'approved' | 'rejected', reviewerNotes?: string) => {
    const excuse = excuses.find(e => e.id === excuseId);
    if (!excuse) return;

    setExcuses(prev =>
      prev.map(e => {
        if (e.id === excuseId) {
          return {
            ...e,
            status,
            reviewedBy: currentUser.name,
            reviewerNotes: reviewerNotes || (status === 'approved' ? 'Giustificazione approvata' : 'Documentazione non sufficiente'),
          };
        }
        return e;
      })
    );

    // If approved, update attendance record to 'excused'
    if (status === 'approved') {
      const record = attendanceRecords.find(
        r => r.sessionId === excuse.sessionId && r.studentId === excuse.studentId
      );
      if (record) {
        const session = sessions.find(s => s.id === excuse.sessionId);
        updateAttendanceStatus(record.id, 'excused', session ? session.hours : 2, `Giustificazione approvata: ${excuse.reason}`);
      }
    }

    // Send notification email to student
    const student = users.find(u => u.id === excuse.studentId);
    const course = courses.find(c => c.id === excuse.courseId);
    if (student && course) {
      sendNotificationEmail(
        student.email,
        student.name,
        course.title,
        `Esito Giustificativo Assenza: ${status === 'approved' ? 'APPROVATO ✅' : 'RESPINTO ❌'}`,
        'excuse_status',
        `<p>Gentile <strong>${student.name}</strong>,</p><p>La tua richiesta di giustificazione per la lezione del <strong>${excuse.sessionDate}</strong> del corso <strong>${course.title}</strong> è stata valutata come: <strong>${status.toUpperCase()}</strong>.</p><p>Note docente: ${reviewerNotes || 'Nessuna nota aggiuntiva'}</p>`
      );
    }
  };

  const sendNotificationEmail = (
    recipientEmail: string,
    recipientName: string,
    courseTitle: string,
    subject: string,
    type: EmailNotificationLog['type'],
    bodyHtml: string
  ) => {
    const newLog: EmailNotificationLog = {
      id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipientEmail,
      recipientName,
      courseTitle,
      subject,
      type,
      bodyHtml,
      sentAt: new Date().toISOString(),
      status: 'delivered',
    };
    setEmailLogs(prev => [newLog, ...prev]);
  };

  // Trigger threshold warnings for students with < 80% attendance
  const triggerThresholdWarnings = (targetCourseId?: string): number => {
    const targetCourses = targetCourseId ? courses.filter(c => c.id === targetCourseId) : courses;
    let count = 0;

    targetCourses.forEach(course => {
      const reports = getAllReportsForCourse(course.id);
      reports.forEach(rep => {
        if (rep.statusCategory === 'danger' || rep.statusCategory === 'warning') {
          const bodyHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #b91c1c; margin-top: 0;">⚠️ Allerta Presenze: Soglia Minima a Rischio</h2>
              <p>Gentile <strong>${rep.studentName}</strong> (Matricola: ${rep.studentNumber}),</p>
              <p>Ti informiamo che il tuo tasso di frequenza per il corso <strong>${course.title}</strong> è pari al <strong>${rep.attendancePercent.toFixed(1)}%</strong>, al di sotto della soglia minima richiesta del <strong>${course.minimumAttendancePercent}%</strong> per l'ammissione all'esame e il rilascio dell'attestato ufficiale.</p>
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 14px; border-radius: 6px; margin: 16px 0;">
                <p style="margin: 0; font-size: 14px; color: #991b1b;">
                  • Ore completate: <strong>${rep.totalHoursAttended}h</strong> su ${rep.totalHoursCourse}h previste.<br/>
                  • Sessioni assente: <strong>${rep.absentCount}</strong>.<br/>
                  • Sessioni giustificate: <strong>${rep.excusedCount}</strong>.
                </p>
              </div>
              <p style="font-size: 14px; color: #475569;">Ti ricordiamo di regolarizzare la tua posizione o inoltrare tempestivamente i certificati giustificativi dalla piattaforma.</p>
              <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 24px;">PresenzeLive Cloud Dispatcher • Notifica automatica certificata</p>
            </div>
          `;
          sendNotificationEmail(
            rep.studentEmail,
            rep.studentName,
            course.title,
            `⚠️ Allerta Presenze: Percentuale al ${rep.attendancePercent.toFixed(1)}% (${course.code})`,
            'threshold_warning',
            bodyHtml
          );
          count++;
        }
      });
    });

    return count;
  };

  const triggerPreSessionReminders = (courseId: string): number => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return 0;
    const students = users.filter(u => u.role === 'student' && u.enrolledCourseIds.includes(courseId));

    students.forEach(student => {
      const pinCode = course.activeSessionPin || '3910';
      const bodyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">📅 Promemoria Sessione Online Imminente</h2>
          <p>Gentile <strong>${student.name}</strong>,</p>
          <p>Ti ricordiamo che la prossima lezione del corso <strong>${course.title}</strong> con <strong>${course.instructorName}</strong> è programmata per oggi:</p>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: 6px; margin: 16px 0;">
            <p style="margin: 0; font-size: 14px; color: #166534;">
              <strong>Orario:</strong> ${course.schedule}<br/>
              <strong>Codice Check-in rapido:</strong> <span style="font-family: monospace; font-size: 18px; font-weight: bold; color: #15803d; letter-spacing: 2px;">${pinCode}</span>
            </p>
          </div>
          <p style="font-size: 13px; color: #475569;">Connettiti puntualmente e registra la presenza dalla tua dashboard personale.</p>
        </div>
      `;
      sendNotificationEmail(
        student.email,
        student.name,
        course.title,
        `📅 Promemoria Lezione Live Oggi: ${course.title}`,
        'session_reminder',
        bodyHtml
      );
    });

    return students.length;
  };

  const triggerWeeklyReports = (targetCourseId?: string): number => {
    const targetCourses = targetCourseId ? courses.filter(c => c.id === targetCourseId) : courses;
    let count = 0;

    targetCourses.forEach(course => {
      const reports = getAllReportsForCourse(course.id);
      reports.forEach(rep => {
        const bodyHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0f172a; margin-top: 0;">📊 Report Riepilogativo Presenze</h2>
            <p>Gentile <strong>${rep.studentName}</strong>,</p>
            <p>Ecco il riepilogo automatico aggiornato della tua frequenza per il corso <strong>${course.title}</strong>:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Percentuale Presenze:</td><td style="padding: 8px 0; font-weight: bold; text-align: right; color: ${rep.attendancePercent >= 80 ? '#16a34a' : '#dc2626'};">${rep.attendancePercent.toFixed(1)}%</td></tr>
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Ore Svolte:</td><td style="padding: 8px 0; text-align: right;">${rep.totalHoursAttended}h / ${rep.totalHoursCourse}h</td></tr>
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Lezioni Presente:</td><td style="padding: 8px 0; text-align: right;">${rep.presentCount}</td></tr>
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Lezioni in Ritardo:</td><td style="padding: 8px 0; text-align: right;">${rep.lateCount}</td></tr>
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Lezioni Assente:</td><td style="padding: 8px 0; text-align: right; color: #dc2626;">${rep.absentCount}</td></tr>
              <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Idoneità Attestato:</td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: ${rep.isEligibleForCertificate ? '#16a34a' : '#b45309'};">${rep.isEligibleForCertificate ? 'AMMESSO (>=80%)' : 'NON IDONEO'}</td></tr>
            </table>
            <p style="font-size: 13px; color: #64748b;">Consulta la dashboard per scaricare l'attestato formale con firma digitale.</p>
          </div>
        `;
        sendNotificationEmail(
          rep.studentEmail,
          rep.studentName,
          course.title,
          `📊 Report Settimanale Presenze: ${course.code}`,
          'weekly_report',
          bodyHtml
        );
        count++;
      });
    });

    return count;
  };

  const getStudentReport = (studentId: string, courseId: string): StudentReportSummary | null => {
    const student = users.find(u => u.id === studentId);
    const course = courses.find(c => c.id === courseId);
    if (!student || !course) return null;

    const courseSessions = sessions.filter(s => s.courseId === courseId);
    const completedSessions = courseSessions.filter(s => s.isCompleted);

    let attendedHours = 0;
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let excusedCount = 0;

    completedSessions.forEach(session => {
      const record = attendanceRecords.find(
        r => r.sessionId === session.id && r.studentId === studentId
      );
      if (record) {
        attendedHours += record.attendedHours;
        if (record.status === 'present') presentCount++;
        else if (record.status === 'late') lateCount++;
        else if (record.status === 'absent') absentCount++;
        else if (record.status === 'excused') excusedCount++;
      } else {
        // default absent if no record found
        absentCount++;
      }
    });

    const totalHoursDelivered = completedSessions.reduce((acc, s) => acc + s.hours, 0);
    const attendancePercent = totalHoursDelivered > 0 ? (attendedHours / totalHoursDelivered) * 100 : 100;

    let statusCategory: 'safe' | 'warning' | 'danger' = 'safe';
    if (attendancePercent < 70) statusCategory = 'danger';
    else if (attendancePercent < 80) statusCategory = 'warning';

    const isEligibleForCertificate = attendancePercent >= course.minimumAttendancePercent;

    return {
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      studentNumber: student.studentNumber || 'MIN-2026-N/A',
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      guardianEmail: student.guardianEmail,
      age: student.age,
      courseId: course.id,
      courseTitle: course.title,
      totalSessionsCompleted: completedSessions.length,
      totalSessionsCourse: course.totalSessions,
      totalHoursCourse: course.totalHours,
      totalHoursAttended: attendedHours,
      attendancePercent,
      presentCount,
      lateCount,
      absentCount,
      excusedCount,
      isEligibleForCertificate,
      statusCategory,
    };
  };

  const getAllReportsForCourse = (courseId: string): StudentReportSummary[] => {
    const courseStudents = users.filter(
      u => u.role === 'student' && u.enrolledCourseIds.includes(courseId)
    );
    return courseStudents
      .map(s => getStudentReport(s.id, courseId))
      .filter((r): r is StudentReportSummary => r !== null);
  };

  const getAllReportsForStudent = (studentId: string): StudentReportSummary[] => {
    const student = users.find(u => u.id === studentId);
    if (!student) return [];
    return student.enrolledCourseIds
      .map(cId => getStudentReport(studentId, cId))
      .filter((r): r is StudentReportSummary => r !== null);
  };

  const resetToDefaultData = () => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}courses`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}users`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}current_user`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}sessions`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}attendance`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}excuses`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}email_logs`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}email_settings`);

    setCourses(INITIAL_COURSES);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]); // Default to Beatrice Mantovani (Admin)
    setSessions(INITIAL_SESSIONS);
    setAttendanceRecords(generateInitialAttendance());
    setExcuses(INITIAL_EXCUSES);
    setEmailLogs(INITIAL_EMAIL_LOGS);
    setEmailSettings(defaultEmailSettings);
  };

  return (
    <AttendanceContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        courses,
        sessions,
        users,
        attendanceRecords,
        excuses,
        emailLogs,
        emailSettings,
        updateEmailSettings,
        updateAttendanceStatus,
        batchUpdateAttendance,
        submitStudentCheckin,
        toggleSessionActive,
        signAndLockSession,
        signSessionByInstructor,
        signSessionByEducator,
        submitExcuse,
        reviewExcuse,
        importStudentsFromSheet,
        updateStudentProfile,
        deleteStudent,
        addNewCourse,
        sendNotificationEmail,
        triggerThresholdWarnings,
        triggerPreSessionReminders,
        triggerWeeklyReports,
        getStudentReport,
        getAllReportsForCourse,
        getAllReportsForStudent,
        resetToDefaultData,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
