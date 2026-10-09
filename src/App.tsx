/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AttendanceProvider, useAttendance } from './context/AttendanceContext';
import { Header } from './components/Header';
import { AdminDashboard } from './components/AdminDashboard';
import { InstructorDashboard } from './components/InstructorDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { SessionRegister } from './components/SessionRegister';
import { ReportsCenter } from './components/ReportsCenter';
import { EmailCenter } from './components/EmailCenter';
import { CoursesCatalog } from './components/CoursesCatalog';
import { GoogleImportModal } from './components/GoogleImportModal';

type ActiveTab = 'dashboard' | 'sessions' | 'reports' | 'emails' | 'courses';

const MainContent: React.FC = () => {
  const { currentUser } = useAttendance();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedCourseForRegister, setSelectedCourseForRegister] = useState<string | undefined>(undefined);
  const [selectedCourseForReports, setSelectedCourseForReports] = useState<string | undefined>(undefined);
  const [selectedStudentForReports, setSelectedStudentForReports] = useState<string | undefined>(undefined);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleNavigateToSessions = (courseId?: string) => {
    setSelectedCourseForRegister(courseId);
    setActiveTab('sessions');
  };

  const handleNavigateToReports = (courseId?: string, studentId?: string) => {
    setSelectedCourseForReports(courseId);
    setSelectedStudentForReports(studentId);
    setActiveTab('reports');
  };

  const handleNavigateToEmails = () => {
    setActiveTab('emails');
  };

  const handleNavigateToCourses = () => {
    setActiveTab('courses');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenImportModal={() => setIsImportModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-28 md:pb-12">
        {activeTab === 'dashboard' && (
          currentUser.role === 'admin' ? (
            <AdminDashboard
              onNavigateToSessions={handleNavigateToSessions}
              onNavigateToReports={handleNavigateToReports}
              onNavigateToEmails={handleNavigateToEmails}
              onNavigateToCourses={handleNavigateToCourses}
            />
          ) : currentUser.role === 'student' ? (
            <StudentDashboard onNavigateToReports={handleNavigateToReports} />
          ) : (
            <InstructorDashboard
              onNavigateToSessions={handleNavigateToSessions}
              onNavigateToReports={handleNavigateToReports}
              onNavigateToEmails={handleNavigateToEmails}
            />
          )
        )}

        {activeTab === 'sessions' && (
          <SessionRegister
            initialCourseId={selectedCourseForRegister}
            onNavigateToEmails={handleNavigateToEmails}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsCenter
            initialCourseId={selectedCourseForReports}
            initialStudentId={selectedStudentForReports}
          />
        )}

        {activeTab === 'emails' && (
          <EmailCenter />
        )}

        {activeTab === 'courses' && (
          <CoursesCatalog
            onSelectCourseRegister={handleNavigateToSessions}
            onSelectCourseReports={handleNavigateToReports}
          />
        )}
      </main>

      {/* Global Google Sheets / Google Form Import Modal */}
      <GoogleImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <footer className="bg-white border-t border-slate-200 py-6 mt-8 md:mt-12 mb-16 md:mb-0 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">PresenzeLive Minori</span>
            <span>·</span>
            <span>Sistema Certificato di Rilevazione e Documentazione Presenze Corsi Minori</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Soglia Minima Legale 80%</span>
            <span>·</span>
            <span>Firma Congiunta Formatore ed Educatore</span>
            <span>·</span>
            <span>Import Google Sheets & Forms</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AttendanceProvider>
      <MainContent />
    </AttendanceProvider>
  );
}
