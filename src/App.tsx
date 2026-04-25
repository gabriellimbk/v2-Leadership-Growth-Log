import { useState, useEffect } from 'react';
import { FormConfig, ViewMode } from './types';
import StudentConsole from './components/StudentConsole';
import TeacherConsole from './components/TeacherConsole';
import LandingPage from './components/LandingPage';
import { storageService } from './services/storageService';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut } from 'lucide-react';

function AppContent() {
  const [view, setView] = useState<ViewMode>('landing');
  const [config, setConfig] = useState<FormConfig | null>(null);
  const { studentUser, teacherSession, signOutStudent, signOutTeacher } = useAuth();

  useEffect(() => {
    storageService.getConfig().then(setConfig);
  }, []);

  const handleSignOut = async () => {
    if (view === 'student') await signOutStudent();
    if (view === 'teacher') await signOutTeacher();
    setView('landing');
  };

  const isAuthed =
    (view === 'student' && !!studentUser) ||
    (view === 'teacher' && !!teacherSession);

  if (!config) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-100 flex flex-col overflow-hidden text-slate-800 font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
            <div className="w-10 h-10 bg-[#004d33] rounded-full flex items-center justify-center p-1.5 shadow-md">
              <img
                src="https://img.icons8.com/ios-filled/100/ffffff/griffin.png"
                alt="Griffin"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-sm font-black tracking-[0.05em] text-[#1a1a1a] uppercase leading-tight">
              RAFFLES <br />
              <span className="text-[#004d33] font-black">LEADERSHIP</span> PROGRAMME
            </h1>
          </div>
          <div className="h-8 w-px bg-slate-200 mx-2"></div>
          <div className="flex bg-slate-100 rounded-md p-1">
            <button
              onClick={() => setView('student')}
              className={`px-4 py-1.5 text-[9px] font-black uppercase rounded transition-all ${view === 'student' ? 'bg-[#004d33] text-white shadow-md' : 'text-slate-500 hover:text-[#004d33]'}`}
            >
              STUDENT
            </button>
            <button
              onClick={() => setView('teacher')}
              className={`px-4 py-1.5 text-[9px] font-black uppercase rounded transition-all ${view === 'teacher' ? 'bg-[#004d33] text-white shadow-md' : 'text-slate-500 hover:text-[#004d33]'}`}
            >
              TEACHER
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight hidden md:block">
            {config.title}
          </div>
          {isAuthed && (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-all"
            >
              <LogOut size={10} /> Sign Out
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div key="landing" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <LandingPage onSelect={setView} />
            </motion.div>
          )}
          {view === 'student' && (
            <motion.div key="student" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <StudentConsole config={config} />
            </motion.div>
          )}
          {view === 'teacher' && (
            <motion.div key="teacher" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <TeacherConsole config={config} onConfigUpdate={setConfig} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="px-6 py-2 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          2026 Raffles Institution Student Leadership Development
        </span>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <span className="text-[9px] font-bold text-slate-400">SYNCED</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
