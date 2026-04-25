import { useState } from 'react';
import { supabase } from '../supabase';
import { motion } from 'motion/react';
import { Briefcase } from 'lucide-react';

export default function TeacherLogin() {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase(),
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setStep('otp');
    } catch (err: any) {
      // "shouldCreateUser: false" throws if email not found; give a clearer message
      if (err.message?.toLowerCase().includes('signups not allowed')) {
        setError('This email is not registered as a mentor. Contact your administrator.');
      } else {
        setError(err.message ?? 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase(),
        token: otp,
        type: 'email',
      });
      if (error) throw error;
      // Session is set automatically; AuthContext picks it up
    } catch (err: any) {
      setError(err.message ?? 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-6 bg-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white border border-slate-200 rounded-md p-8 shadow-sm"
      >
        <div className="mb-6 text-center">
          <div className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="text-white" size={18} />
          </div>
          <h2 className="text-sm font-black uppercase tracking-tight text-slate-800 italic">
            Mentor <span className="text-[#004d33]">Access</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            {step === 'email'
              ? 'Enter your email to receive a one-time code'
              : `6-digit code sent to ${email}`}
          </p>
        </div>

        {step === 'email' ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-600">Teacher Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="teacher@ri.edu.sg"
                onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                className="text-[11px] border border-slate-200 rounded p-2 px-3 w-full bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#004d33] transition-all outline-none"
              />
            </div>
            {error && (
              <p className="text-[10px] text-red-600 font-bold bg-red-50 border border-red-100 rounded p-2">
                {error}
              </p>
            )}
            <button
              onClick={handleSendOTP}
              disabled={loading || !email}
              className="w-full py-2.5 bg-[#004d33] text-white rounded font-bold text-[10px] uppercase tracking-widest shadow-md hover:bg-[#003d29] active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-600">6-Digit Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                onKeyDown={e => e.key === 'Enter' && otp.length === 6 && handleVerifyOTP()}
                className="text-center text-2xl font-black tracking-[0.5em] border border-slate-200 rounded p-3 w-full bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#004d33] transition-all outline-none"
              />
            </div>
            {error && (
              <p className="text-[10px] text-red-600 font-bold bg-red-50 border border-red-100 rounded p-2">
                {error}
              </p>
            )}
            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className="w-full py-2.5 bg-[#004d33] text-white rounded font-bold text-[10px] uppercase tracking-widest shadow-md hover:bg-[#003d29] active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              {loading ? 'Verifying...' : 'Verify & Access'}
            </button>
            <button
              onClick={() => { setStep('email'); setOtp(''); setError(''); }}
              className="w-full text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-all"
            >
              ← Back
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
