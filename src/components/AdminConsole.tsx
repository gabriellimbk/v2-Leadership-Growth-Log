import { useState } from 'react';
import { AlertTriangle, Inbox, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FormConfig, TeacherEntry } from '../types';
import { isAdminTeacherEmail } from '../auth/adminAccess';
import TeacherConsole from './TeacherConsole';
import TeacherLogin from './TeacherLogin';
import AdminTeacherManagement from './AdminTeacherManagement';

interface AdminConsoleProps {
  config: FormConfig;
  onConfigUpdate: (config: FormConfig) => void;
  teachers: TeacherEntry[];
  onTeachersUpdate: (teachers: TeacherEntry[]) => void;
}

type AdminTab = 'submissions' | 'teachers';

export default function AdminConsole({ config, onConfigUpdate, teachers, onTeachersUpdate }: AdminConsoleProps) {
  const { teacherSession, teacherLoading } = useAuth();
  const [tab, setTab] = useState<AdminTab>('submissions');

  if (teacherLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100">
        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (!teacherSession) {
    return <TeacherLogin />;
  }

  if (!isAdminTeacherEmail(teacherSession.user.email)) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-slate-100">
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-md p-8 shadow-sm text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-500" size={18} />
          </div>
          <h2 className="text-sm font-black uppercase text-slate-800">Admin Access Required</h2>
          <p className="text-[11px] text-slate-500 leading-relaxed mt-2">
            This console is only available to approved administrator accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-2">
        <div className="flex bg-slate-100 rounded p-1">
          <button
            onClick={() => setTab('submissions')}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded transition-all flex items-center gap-2 ${
              tab === 'submissions' ? 'bg-[#004d33] text-white shadow-sm' : 'text-slate-500 hover:text-[#004d33]'
            }`}
          >
            <Inbox size={11} /> Submissions
          </button>
          <button
            onClick={() => setTab('teachers')}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded transition-all flex items-center gap-2 ${
              tab === 'teachers' ? 'bg-[#004d33] text-white shadow-sm' : 'text-slate-500 hover:text-[#004d33]'
            }`}
          >
            <Users size={11} /> Teachers
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === 'submissions' ? (
          <TeacherConsole
            config={config}
            onConfigUpdate={onConfigUpdate}
            teachers={teachers}
            mode="admin"
          />
        ) : (
          <AdminTeacherManagement
            teachers={teachers}
            onTeachersUpdate={onTeachersUpdate}
          />
        )}
      </div>
    </div>
  );
}
