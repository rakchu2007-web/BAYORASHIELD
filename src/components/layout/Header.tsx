import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Scale,
  Key,
  Copy,
  Check,
  Zap,
  PlayCircle,
  Terminal,
  Activity
} from 'lucide-react';
import { Role } from '../../types/security.ts';
import { KNOWN_ROLE_TOKENS, setActiveToken } from '../../services/api.ts';

interface HeaderProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  activeSessionId: string;
  sessions: Array<{ id: string; name: string }>;
  onSessionChange: (id: string) => void;
  onOpenQuickTest: () => void;
  onOpenJudgeDemo: () => void;
  systemStatus: 'ONLINE' | 'DEGRADED';
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  activeSessionId,
  sessions,
  onSessionChange,
  onOpenQuickTest,
  onOpenJudgeDemo,
  systemStatus
}) => {
  const [copied, setCopied] = useState(false);
  const activeRoleData = KNOWN_ROLE_TOKENS[currentRole];

  const handleCopyToken = () => {
    navigator.clipboard.writeText(activeRoleData.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectRole = (newRole: Role) => {
    setActiveToken(KNOWN_ROLE_TOKENS[newRole].token);
    onRoleChange(newRole);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#07090e]/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600/30 via-slate-900 to-cyan-500/20 border border-cyan-500/30 shadow-lg shadow-cyan-950/40">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-widest text-slate-100 font-mono">BAYORASHIELD</span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                HACK IN HILLS '26
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono tracking-tight hidden sm:block">
              Attack the AI. Protect the Intelligence. Prove the Security.
            </p>
          </div>
        </div>

        {/* Center: Role Switcher & Authorization Context */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => handleSelectRole('red_team')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
              currentRole === 'red_team'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 shadow-sm shadow-rose-950/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>RED TEAM</span>
          </button>

          <button
            onClick={() => handleSelectRole('blue_team')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
              currentRole === 'blue_team'
                ? 'bg-sky-950/80 text-sky-300 border border-sky-500/60 shadow-sm shadow-sky-950/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>BLUE TEAM</span>
          </button>

          <button
            onClick={() => handleSelectRole('judge_auditor')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
              currentRole === 'judge_auditor'
                ? 'bg-purple-950/80 text-purple-300 border border-purple-500/60 shadow-sm shadow-purple-950/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-purple-400" />
            <span>JUDGE / AUDITOR</span>
          </button>
        </div>

        {/* Right Actions: Session, Token Copy, Test Runner, Judge Guided Mode */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Session Dropdown */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800 text-xs font-mono">
            <span className="text-slate-500 text-[11px]">SESS:</span>
            <select
              value={activeSessionId}
              onChange={(e) => onSessionChange(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer max-w-[130px] truncate"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Active Token Copy Button */}
          <button
            onClick={handleCopyToken}
            title={`Bearer Token: ${activeRoleData.token}`}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
          >
            <Key className="w-3 h-3 text-cyan-400" />
            <span className="max-w-[110px] truncate">{activeRoleData.token.split('-')[1]}...</span>
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>

          {/* Run Security Test Button */}
          <button
            onClick={onOpenQuickTest}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20 active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>RUN TEST</span>
          </button>

          {/* Judge Guided Demo Mode */}
          <button
            onClick={onOpenJudgeDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-900/30 transition-all active:scale-95"
          >
            <PlayCircle className="w-3.5 h-3.5 text-violet-200" />
            <span className="hidden sm:inline">JUDGE DEMO</span>
          </button>
        </div>
      </div>
    </header>
  );
};
