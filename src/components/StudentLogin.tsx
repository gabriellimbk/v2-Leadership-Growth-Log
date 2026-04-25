import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '../firebase';
import { motion } from 'motion/react';
import { GraduationCap } from 'lucide-react';

export default function StudentLogin() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const isValidEmail = (e: string) => e.toLowerCase().endsWith('@student.ri.edu.sg');

  const handleSubmit = async () => {
    setError('');
    if (!isValidEmail(email)) {
      setError('Only @student.ri.edu.sg email addresses are permitted.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email.toLowerCase(), password);
        await sendEmailVerification(cred.user);
        setSignupSuccess(true);
      } else {
        await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
      }
    } catch (err: any) {
      const code: string = err.code ?? '';
      const messages: Record<string, string> = {
        'auth/user-not-found': 'No account found. Please sign up first.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
      };
      setError(messages[code] ?? 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (signupSuccess) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-slate-100">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white border border-slate-200 rounded-md p-8 shadow-sm text-center space-y-4"
        >
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <GraduationCap className="text-emerald-600" size={20} />
          </div>
          <h2 className="text-sm font-black uppercase text-slate-800">Account Created</h2>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            A verification email has been sent to <strong>{email}</strong>. Please verify your
            email before signing in.
          </p>
          <button
            onClick={() => { setMode('login'); setSignupSuccess(false); setPassword(''); }}
            className="w-full py-2.5 bg-indigo-600 text-white rounded font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all"
          >
            Go to Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center p-6 bg-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white border border-slate-200 rounded-md p-8 shadow-sm"
      >
        <div className="mb-6 text-center">
          <h2 className="text-sm font-black uppercase tracking-tight text-slate-800 italic">
            Student <span className="text-[#004d33]">{mode === 'login' ? 'Sign In' : 'Sign Up'}</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            {mode === 'login' ? 'Access your leadership log' : 'Register with your RI student email'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-600">Student Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@student.ri.edu.sg"
              className="text-[11px] border border-slate-200 rounded p-2 px-3 w-full bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="text-[11px] border border-slate-200 rounded p-2 px-3 w-full bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
            />
          </div>

          {error && (
            <p className="text-[10px] text-red-600 font-bold bg-red-50 border border-red-100 rounded p-2">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full py-2.5 bg-indigo-600 text-white rounded font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none mt-2"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <div className="text-center pt-2">
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest"
            >
              {mode === 'login' ? 'New student? Sign up →' : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
