import React from 'react';
import {
  LayoutDashboard,
  Flame,
  ShieldCheck,
  SplitSquareVertical,
  Cpu,
  History,
  FileCheck2,
  TrendingDown,
  FileCode,
  Settings,
  CircleDot
} from 'lucide-react';
import { Role } from '../../types/security.ts';

export type NavPage =
  | 'overview'
  | 'red_lab'
  | 'blue_defense'
  | 'isolation'
  | 'target_model'
  | 'attack_replay'
  | 'audit_forensics'
  | 'risk_analytics'
  | 'policies'
  | 'settings';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  currentRole: Role;
  auditValid: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  currentRole,
  auditValid
}) => {
  const navItems: Array<{
    id: NavPage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    tag?: string;
    badgeColor?: string;
  }> = [
    { id: 'overview', label: 'Security Overview', icon: LayoutDashboard },
    { id: 'red_lab', label: 'Red Team Lab', icon: Flame, tag: 'Adversarial' },
    { id: 'blue_defense', label: 'Blue Team Defense', icon: ShieldCheck, tag: 'Guards' },
    { id: 'isolation', label: 'Isolation Center', icon: SplitSquareVertical, tag: 'RBAC' },
    { id: 'target_model', label: 'Target Model Testing', icon: Cpu },
    { id: 'attack_replay', label: 'Attack Replay', icon: History },
    {
      id: 'audit_forensics',
      label: 'Audit & Forensics',
      icon: FileCheck2,
      tag: auditValid ? 'SHA-256' : 'TAMPERED',
      badgeColor: auditValid ? 'text-cyan-400 bg-cyan-950/80 border-cyan-500/40' : 'text-rose-400 bg-rose-950 border-rose-500 animate-pulse'
    },
    { id: 'risk_analytics', label: 'Risk Analytics', icon: TrendingDown },
    { id: 'policies', label: 'Security Policies', icon: FileCode },
    { id: 'settings', label: 'System & Automated Tests', icon: Settings, tag: '10 Suites' }
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800/80 bg-[#07090e]/80 flex flex-col justify-between p-3 select-none">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
          Command Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-mono transition-all ${
                isActive
                  ? 'bg-slate-800/90 text-cyan-300 border border-slate-700/80 font-semibold shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.tag && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${
                    item.badgeColor || 'text-slate-400 bg-slate-900 border-slate-800'
                  }`}
                >
                  {item.tag}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer System Telemetry */}
      <div className="p-3 rounded border border-slate-800/80 bg-slate-950/60 space-y-2 font-mono text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">GATEWAY:</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CircleDot className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
            ENFORCING
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">LEDGER:</span>
          <span className={`font-semibold ${auditValid ? 'text-cyan-400' : 'text-rose-400'}`}>
            {auditValid ? 'HASH-CHAIN VALID' : 'ALERT: TAMPERED'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">ACTIVE ROLE:</span>
          <span className="text-slate-300 uppercase font-semibold">
            {currentRole.replace('_', ' ')}
          </span>
        </div>
      </div>
    </aside>
  );
};
