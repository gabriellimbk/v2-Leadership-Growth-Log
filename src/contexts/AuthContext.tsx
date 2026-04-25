import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut } from 'firebase/auth';
import { Session } from '@supabase/supabase-js';
import { auth } from '../firebase';
import { supabase } from '../supabase';

interface AuthContextValue {
  studentUser: FirebaseUser | null;
  teacherSession: Session | null;
  studentLoading: boolean;
  teacherLoading: boolean;
  signOutStudent: () => Promise<void>;
  signOutTeacher: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [studentUser, setStudentUser] = useState<FirebaseUser | null>(null);
  const [teacherSession, setTeacherSession] = useState<Session | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [teacherLoading, setTeacherLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setStudentUser(user);
      setStudentLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setTeacherSession(data.session);
      setTeacherLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTeacherSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      studentUser,
      teacherSession,
      studentLoading,
      teacherLoading,
      signOutStudent: () => firebaseSignOut(auth),
      signOutTeacher: () => supabase.auth.signOut(),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
