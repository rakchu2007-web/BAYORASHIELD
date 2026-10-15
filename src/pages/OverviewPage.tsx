import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  FileCheck2,
  AlertTriangle,
  Zap,
  TrendingDown,
  Activity,
  ArrowUpRight,
  SplitSquareVertical,
  Layers,
  CheckCircle,
  XCircle,
  Play
} from 'lucide-react';
import { StatusBadge } from '../components/common/Badge.tsx';
import { SecurityTestRecord } from '../types/security.ts';

interface OverviewPageProps {
  metrics: {
    totalTests: number;
    threatsDetected: number;
    blockedRequests: number;
    allowedRequests: number;
    detectedRequests: number;
    failedRequests: number;
    policyViolations: number;
    auditVerificationStatus: string;
    tamperedIndex: number | null;
    riskScore: number;
    activeSessionsCount: number;
    activePoliciesCount: number;
  };
  recentTests: SecurityTestRecord[];
  onOpenQuickTest: () => void;
  onOpenJudgeDemo: () => void;
  onNavigateToTab: (tab: string) => void;
  auditValid: boolean;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  metrics,
  recentTests,
  onOpenQuickTest,
  onOpenJudgeDemo,
  onNavigateToTab,
  auditValid
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner with Run Test CTA */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-r from-slate-950 via-[#0a0e1a] to-slate-950 p-6 shadow-xl">
        <div className="absolute right-0 top-0 h-full w-96 bg-gradient-to-l from-cyan-500/10 via-violet-500/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE SOC OPERATIONAL
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                HACK IN HILLS '26 DEFENSE
              </span>
            </div>
            <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-100">
              BAYORASHIELD SECURITY COMMAND
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1 max-w-2xl">
              Real-time multi-tenant boundary enforcement, pre-execution prompt injection defense, target model isolation, and SHA-256 tamper-evident cryptographic audit ledger.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenJudgeDemo}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold bg-violet-600/90 hover:bg-violet-500 text-white border border-violet-400/40 shadow-lg shadow-violet-950/50 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>JUDGE DEMO GAUNTLET</span>
            </button>
            <button
              onClick={onOpenQuickTest}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>RUN SECURITY TEST</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Tests */}
        <div className="p-4 rounded-xl border border-slate-800/90 bg-slate-950/70 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOTAL EXECUTIONS</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-2">
            {metrics.totalTests}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1 flex items-center justify-between">
            <span>Active Sessions: {metrics.activeSessionsCount}</span>
            <span className="text-cyan-400">Derived</span>
          </div>
        </div>

        {/* Threats Detected */}
        <div className="p-4 rounded-xl border border-slate-800/90 bg-slate-950/70 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>THREATS DETECTED</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-2">
            {metrics.threatsDetected}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1 flex items-center justify-between">
            <span>Violations: {metrics.policyViolations}</span>
            <span className="text-amber-400 font-semibold">{metrics.totalTests ? Math.round((metrics.threatsDetected / metrics.totalTests) * 100) : 0}%</span>
          </div>
        </div>

        {/* Requests Blocked by Actual Implemented Controls */}
        <div className="p-4 rounded-xl border border-rose-950/60 bg-rose-950/20 relative overflow-hidden">
          <div className="flex items-center justify-between text-rose-300 text-xs font-mono">
            <span>BLOCKED BY CONTROLS</span>
            <Lock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-300 mt-2">
            {metrics.blockedRequests}
          </div>
          <div className="text-[11px] font-mono text-rose-400/80 mt-1 flex items-center justify-between">
            <span>Hard Enforced at Gateway</span>
            <span className="font-semibold">REAL INTERCEPT</span>
          </div>
        </div>

        {/* Cryptographic Audit Verification Status */}
        <div className={`p-4 rounded-xl border ${auditValid ? 'border-cyan-900/60 bg-cyan-950/20' : 'border-rose-600/80 bg-rose-950/40 animate-pulse'}`}>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className={auditValid ? 'text-cyan-300' : 'text-rose-300'}>AUDIT HASH CHAIN</span>
            <FileCheck2 className={`w-4 h-4 ${auditValid ? 'text-cyan-400' : 'text-rose-400'}`} />
          </div>
          <div className={`text-xl font-bold font-mono mt-2 truncate ${auditValid ? 'text-cyan-300' : 'text-rose-300'}`}>
            {auditValid ? 'VERIFIED (SHA-256)' : 'COMPROMISED'}
          </div>
          <div className="text-[11px] font-mono mt-1 flex items-center justify-between text-slate-400">
            <span>{auditValid ? 'Zero Faults in Chain' : `Tamper Block #${metrics.tamperedIndex}`}</span>
            <button
              onClick={() => onNavigateToTab('audit_forensics')}
              className="text-cyan-400 hover:underline flex items-center"
            >
              Inspect <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Middle Row: Derived Risk Gauge & Isolation Boundary Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Transparent Risk Score Card */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/70 font-mono space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">TRANSPARENT SYSTEM RISK</span>
            </div>
            <span className="text-[10px] text-slate-500">FORMULA-DRIVEN</span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold text-slate-100">{metrics.riskScore}</span>
              <span className="text-sm text-slate-400"> / 100</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded font-bold ${
              metrics.riskScore >= 80
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                : metrics.riskScore >= 50
                ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                : 'bg-rose-950 text-rose-300 border border-rose-500/40'
            }`}>
              {metrics.riskScore >= 80 ? 'LOW RISK' : metrics.riskScore >= 50 ? 'ELEVATED' : 'CRITICAL'}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 ${
                metrics.riskScore >= 80 ? 'bg-emerald-500' : metrics.riskScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${metrics.riskScore}%` }}
            />
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
            <span className="text-cyan-400 font-semibold">Active Scoring Model: </span>
            Score decreases by 35 points per confirmed uncontained failure, 25 points if audit ledger is corrupted, and 5 points per unblocked detection.
          </div>
        </div>

        {/* Isolation Boundaries Health */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/70 font-mono space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <SplitSquareVertical className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold text-slate-200">ISOLATION BOUNDARIES</span>
            </div>
            <button
              onClick={() => onNavigateToTab('isolation')}
              className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
            >
              Control Center <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-slate-900/70 border border-slate-800">
              <span className="text-slate-400">Red Team Vault Scope:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> SECURE (403 Enforced)
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-900/70 border border-slate-800">
              <span className="text-slate-400">Blue Team Policy Vault:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> SECURE (403 Enforced)
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-900/70 border border-slate-800">
              <span className="text-slate-400">Target Model Memory Sandbox:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> CANARY SHIELDED
              </span>
            </div>
          </div>
        </div>

        {/* Enforcement Summary Breakdown */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/70 font-mono space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-200">DISPOSITION BREAKDOWN</span>
            </div>
            <span className="text-[10px] text-slate-500">LIVE RECORDS</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-rose-400">Blocked (Enforced):</span>
              <span className="font-bold text-slate-200">{metrics.blockedRequests}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-400">Detected (Log-Only):</span>
              <span className="font-bold text-slate-200">{metrics.detectedRequests}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-400">Allowed (Compliant):</span>
              <span className="font-bold text-slate-200">{metrics.allowedRequests}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-red-400">Failed (Confirmed Leaks):</span>
              <span className="font-bold text-slate-200">{metrics.failedRequests}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Security Events Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden font-mono">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-slate-200 tracking-wide">
              RECENT VERIFIED SECURITY EVENTS
            </h2>
          </div>
          <button
            onClick={() => onNavigateToTab('audit_forensics')}
            className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
          >
            View Complete Hash-Chained Audit Ledger <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTests.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No test executions recorded yet. Click "Run Security Test" to start.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/40 text-slate-400 text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">TEST ID</th>
                  <th className="py-2.5 px-4 font-semibold">CATEGORY</th>
                  <th className="py-2.5 px-4 font-semibold">ACTOR</th>
                  <th className="py-2.5 px-4 font-semibold">POLICY</th>
                  <th className="py-2.5 px-4 font-semibold">DISPOSITION</th>
                  <th className="py-2.5 px-4 font-semibold">EVIDENCE</th>
                  <th className="py-2.5 px-4 font-semibold">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentTests.slice(0, 6).map((test) => (
                  <tr key={test.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-300">{test.id}</td>
                    <td className="py-3 px-4 text-slate-400">
                      <span className="capitalize">{test.testCategory.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 uppercase text-[11px]">
                      {test.actorRole}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{test.policyEvaluated}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={test.enforcementResult} />
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={test.evidence}>
                      {test.evidence}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onNavigateToTab('attack_replay')}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline"
                      >
                        Replay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
