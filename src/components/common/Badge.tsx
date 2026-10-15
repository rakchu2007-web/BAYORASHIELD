import React from 'react';
import { EnforcementResult, Severity } from '../../types/security.ts';

interface StatusBadgeProps {
  status: EnforcementResult | 'PASS' | 'FAIL' | 'ACTIVE' | 'ISOLATED' | 'VERIFIED' | 'TAMPERED';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'BLOCKED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-rose-950/70 border border-rose-500/50 text-rose-300 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
          BLOCKED
        </span>
      );
    case 'DETECTED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-amber-950/70 border border-amber-500/50 text-amber-300 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          DETECTED (LOG)
        </span>
      );
    case 'ALLOWED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          ALLOWED
        </span>
      );
    case 'FAILED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-red-950/80 border border-red-500 text-red-200 animate-pulse ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          FAILURE (LEAK)
        </span>
      );
    case 'SIMULATED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-purple-950/70 border border-purple-500/50 text-purple-300 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          SIMULATED
        </span>
      );
    case 'VERIFIED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-cyan-950/70 border border-cyan-500/50 text-cyan-300 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          VERIFIED
        </span>
      );
    case 'TAMPERED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-rose-950/90 border border-rose-500 text-rose-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          TAMPERED
        </span>
      );
    case 'PASS':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-bold ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          PASS
        </span>
      );
    case 'FAIL':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-rose-950/90 border border-rose-500 text-rose-200 font-bold animate-pulse ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          FAIL
        </span>
      );
    case 'ACTIVE':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          ACTIVE
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-300 ${className}`}>
          {status}
        </span>
      );
  }
};

export const SeverityBadge: React.FC<{ severity: Severity }> = ({ severity }) => {
  switch (severity) {
    case 'CRITICAL':
      return (
        <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-rose-950/80 border border-rose-500/60 text-rose-300 tracking-wider">
          CRITICAL
        </span>
      );
    case 'HIGH':
      return (
        <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-950/80 border border-amber-500/60 text-amber-300 tracking-wider">
          HIGH
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-yellow-950/70 border border-yellow-500/40 text-yellow-300 tracking-wider">
          MEDIUM
        </span>
      );
    case 'LOW':
      return (
        <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-blue-950/70 border border-blue-500/40 text-blue-300 tracking-wider">
          LOW
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-slate-800 border border-slate-700 text-slate-400 tracking-wider">
          INFO
        </span>
      );
  }
};
