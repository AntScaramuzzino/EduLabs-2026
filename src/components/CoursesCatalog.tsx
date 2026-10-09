import React from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Radio, 
  ChevronRight, 
  Mail, 
  Award,
  KeyRound,
  ShieldCheck,
  HeartHandshake,
  MapPin,
  Sparkles,
  Cpu,
  Gamepad2,
  Palette,
  Brain,
  Activity,
  Compass
} from 'lucide-react';
import { DEFAULT_PROJECT_CONFIG } from '../data/projectConfig';

interface CoursesCatalogProps {
  onSelectCourseRegister: (courseId: string) => void;
  onSelectCourseReports: (courseId: string) => void;
}

export const CoursesCatalog: React.FC<CoursesCatalogProps> = ({
  onSelectCourseRegister,
  onSelectCourseReports,
}) => {
  const { courses, sessions, users } = useAttendance();

  const totalHoursAll = courses.reduce((acc, c) => acc + c.totalHours, 0);

  const getLabIcon = (iconType?: string) => {
    switch (iconType) {
      case 'cpu': return <Cpu className="w-4 h-4 text-teal-600" />;
      case 'gamepad': return <Gamepad2 className="w-4 h-4 text-indigo-600" />;
      case 'palette': return <Palette className="w-4 h-4 text-orange-600" />;
      case 'brain': return <Brain className="w-4 h-4 text-purple-600" />;
      case 'activity': return <Activity className="w-4 h-4 text-green-600" />;
      case 'sparkles': return <Sparkles className="w-4 h-4 text-amber-600" />;
      case 'compass': return <Compass className="w-4 h-4 text-rose-600" />;
      default: return <BookOpen className="w-4 h-4 text-sky-600" />;
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
        {/* Decorative corner element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-100/60 via-amber-100/30 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap text-xs font-bold uppercase tracking-wider">
              <span className="bg-teal-100 text-teal-900 px-2 py-0.5 rounded-full border border-teal-200">
                EduLabs 2026
              </span>
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-extrabold">
                La città che educa
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5 tracking-tight">
              Gli 8 Laboratori Territoriali per Minori (5-17 anni)
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Centro Educativo Diffuso promosso da <strong>InRete Cooperativa Sociale ETS</strong> con il partenariato degli Enti del Terzo Settore di Lamezia Terme. Finanziato dal Comune di Lamezia Terme con il Fondo per le politiche della famiglia.
            </p>
          </div>
          <div className="text-xs text-teal-950 bg-teal-50 border border-teal-200 px-3.5 py-2.5 rounded-xl font-mono self-start md:self-auto shrink-0 shadow-2xs">
            Monte ore totale: <strong className="text-teal-900">{totalHoursAll} ore</strong> · Target: <strong>{DEFAULT_PROJECT_CONFIG.targetMinori} minori</strong>
          </div>
        </div>
      </div>

      {/* Official Visual Identity & Social Announcement Card */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-amber-950 rounded-2xl p-4 sm:p-5 text-white shadow-xs border border-teal-800/50 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 border-2 border-amber-400/80 shadow-md relative group">
          <img 
            src="/edulabs_banner.jpg" 
            alt="EduLabs 2026 Locandina Ufficiale" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Graceful fallback if image path is not loaded
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap text-[11px] font-bold text-amber-300">
            <span>Grafica & Identità Visiva Ufficiale</span>
            <span>·</span>
            <span>Campagna Territoriale Lamezia Terme</span>
          </div>
          <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5 text-white">
            "EduLabs 2026 – La città che educa"
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
            8 laboratori per scoprire, creare, muoversi e imparare insieme a Lamezia Terme. Rilevazione presenze ufficiale ad uso dell'Amministrazione, dei Formatori e degli Educatori d'aula.
          </p>
          <div className="mt-3 flex items-center justify-center sm:justify-start gap-3 flex-wrap">
            <a 
              href="https://www.instagram.com/p/Dd_ir0nF2sk/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs inline-flex items-center gap-1.5 transition-all"
            >
              <span>Vedi Post Instagram Ufficiale</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
            <span className="text-[11px] text-slate-400 font-mono">
              @coopinrete · @arcilameziavibo_aps · @asc_lamezia · @aleph_arte · @an.giu.li · @aps_lucky_friends · @tramefestival
            </span>
          </div>
        </div>
      </div>

      {/* Grid of the 8 workshops with brand color themes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {courses.map((course) => {
          const courseSessions = sessions.filter(s => s.courseId === course.id);
          const completedCount = courseSessions.filter(s => s.isCompleted).length;
          const enrolledStudents = users.filter(
            u => u.role === 'student' && u.enrolledCourseIds.includes(course.id)
          );

          return (
            <div
              key={course.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-teal-400 transition-all shadow-2xs flex flex-col justify-between space-y-3.5 relative overflow-hidden group"
            >
              {/* Top colored accent line */}
              <div 
                className="absolute top-0 left-0 right-0 h-1" 
                style={{ backgroundColor: course.themeColor || '#0d9488' }}
              />

              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span 
                      className="font-mono text-[11px] font-bold px-2 py-0.5 rounded border"
                      style={{ 
                        color: course.themeColor || '#0d9488',
                        backgroundColor: `${course.themeColor || '#0d9488'}10`,
                        borderColor: `${course.themeColor || '#0d9488'}30`
                      }}
                    >
                      {course.code}
                    </span>
                    <span className="text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full font-semibold">
                      {course.targetAge || 'Minori'}
                    </span>
                  </div>

                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                    Livello {course.level}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-slate-50 border border-slate-200 shrink-0">
                      {getLabIcon(course.iconType)}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-teal-800 transition-colors">
                      {course.title}
                    </h3>
                  </div>

                  {course.partnerEntity && (
                    <div className="text-xs font-semibold text-teal-800 mt-1.5 flex items-center gap-1">
                      <HeartHandshake className="w-3.5 h-3.5 shrink-0 text-teal-600" />
                      <span>a cura di <strong className="text-slate-800">{course.partnerEntity}</strong></span>
                    </div>
                  )}

                  {course.venue && (
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{course.venue}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* Details Strip */}
                <div className="grid grid-cols-2 gap-2 py-2.5 border-y border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{course.totalHours}h ({course.totalSessions} lezioni)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{enrolledStudents.length} minori iscritti</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{course.schedule}</span>
                  </div>
                </div>

                {/* Assigned Staff */}
                <div className="text-xs space-y-0.5 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div>
                    Docente/Formatore: <strong className="text-slate-900">{course.instructorName}</strong>
                  </div>
                  <div className="text-teal-800 font-medium">
                    Educatore: {course.educatorName || "Dott.ssa Sara D'Amico"}
                  </div>
                </div>
              </div>

              {/* Course Action Bar */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectCourseReports(course.id)}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                >
                  Report & Statistiche
                </button>
                <button
                  onClick={() => onSelectCourseRegister(course.id)}
                  className="flex-1 py-2 px-3 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Registro Presenze</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
