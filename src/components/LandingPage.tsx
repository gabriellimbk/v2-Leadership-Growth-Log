import { motion } from 'motion/react';
import { GraduationCap, Briefcase, Sparkles } from 'lucide-react';
import { ViewMode } from '../types';

interface LandingPageProps {
  onSelect: (view: ViewMode) => void;
}

export default function LandingPage({ onSelect }: LandingPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] p-6 bg-[#fcfcfc]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-12 text-center"
      >
        <div className="flex justify-center mb-8">
           <div className="w-24 h-24 bg-[#004d33] rounded-full flex items-center justify-center p-2 shadow-2xl border-4 border-white">
              <img 
                src="https://img.icons8.com/ios-filled/100/ffffff/griffin.png" 
                alt="Griffin Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
           </div>
        </div>
        <h2 className="text-5xl font-black text-[#1a1a1a] tracking-tight uppercase leading-none mb-4">
          RAFFLES <br />
          <span className="text-[#004d33]">LEADERSHIP</span> <br />
          PROGRAMME
        </h2>
        <p className="max-w-md mx-auto text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
          The Official Growth & Reflection Module for Student Leaders.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        <button
          onClick={() => onSelect('student')}
          className="group relative flex flex-col items-center p-8 bg-white border border-slate-200 rounded-md transition-all hover:border-[#004d33] hover:shadow-xl text-center shadow-sm"
        >
          <div className="w-12 h-12 bg-slate-50 rounded flex items-center justify-center mb-6 text-slate-400 group-hover:bg-[#004d33] group-hover:text-white transition-all shadow-sm border border-slate-100">
            <GraduationCap size={20} />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-widest mb-2 text-slate-800">Student Entry</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase leading-tight tracking-tight px-4">Access your leadership log & review mentor assessment.</p>
        </button>

        <button
          onClick={() => onSelect('teacher')}
          className="group relative flex flex-col items-center p-8 bg-[#1a1a1a] text-white rounded-md transition-all hover:bg-[#004d33] hover:shadow-xl text-center"
        >
          <div className="w-12 h-12 bg-white/5 rounded flex items-center justify-center mb-6 text-white group-hover:bg-white group-hover:text-[#004d33] transition-all shadow-sm">
            <Briefcase size={20} />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-widest mb-2">Mentor Access</h3>
          <p className="text-white/40 font-bold uppercase text-[9px] leading-tight tracking-tight px-4">Manage student submissions & deploy pedagogical updates.</p>
          <div className="absolute top-2 right-2 flex gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
          </div>
        </button>
      </div>
      
    </div>
  );
}
