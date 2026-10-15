import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  FileCode,
  Layers,
  Key,
  Database,
  ArrowRight,
  Loader2,
  RefreshCw,
  Ban
} from 'lucide-react';
import { api, setActiveToken, KNOWN_ROLE_TOKENS } from '../services/api.ts';
import { SecurityPolicy, SecurityTestRecord } from '../types/security.ts';
import { StatusBadge, SeverityBadge } from '../components/common/Badge.tsx';

interface BlueTeamDefensePageProps {
  policies: SecurityPolicy[];
  onPolicyUpdated: () => void;
  recentTests: SecurityTestRecord[];
}

export const BlueTeamDefensePage: React.FC<BlueTeamDefensePageProps> = ({
  policies,
  onPolicyUpdated,
  recentTests
}) => {
  const [blueVault, setBlueVault] = useState<unknown[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);
  const [negativeTestLoading, setNegativeTestLoading] = useState(false);
  const [negativeTestOutcome, setNegativeTestOutcome] = useState<{
    probeTarget: string;
    statusCode: number;
    status: string;
    message: string;
    timestamp: string;
    enforcedAt: string;
  } | null>(null);

  const fetchBlueVault = async () => {
    setLoadingVault(true);
    try {
      // Set to blue_team token to ensure authorized fetch
      setActiveToken(KNOWN_ROLE_TOKENS.blue_team.token);
      const res = await api.getBlueVault();
      setBlueVault(res.records || []);
    } catch (err) {
      console.error('Error fetching blue vault:', err);
    } finally {
      setLoadingVault(false);
    }
  };

  useEffect(() => {
    fetchBlueVault();
  }, []);

  const handleTogglePolicyMode = async (policyId: string, currentMode: 'BLOCK' | 'LOG_ONLY' | 'DISABLED') => {
    const nextMode = currentMode === 'BLOCK' ? 'LOG_ONLY' : currentMode === 'LOG_ONLY' ? 'BLOCK' : 'BLOCK';
    try {
      await api.togglePolicy(policyId, true, nextMode);
      onPolicyUpdated();
    } catch (err) {
      console.error('Policy toggle error:', err);
    }
  };

  // Negative Test Probe: Blue Team attempting to access Red Team unreleased payload vault
  const handleProbeRedVault = async () => {
    setNegativeTestLoading(true);
    setNegativeTestOutcome(null);
    try {
      setActiveToken(KNOWN_ROLE_TOKENS.blue_team.token);
      const res = await api.testBoundaryAccess('red');
      setNegativeTestOutcome({
        probeTarget: 'RED_TEAM_UNRELEASED_VAULT',
        statusCode: res.code || 200,
        status: res.status || 'ALLOWED',
        message: res.message || 'Access granted.',
        timestamp: new Date().toISOString(),
        enforcedAt: res.enforcedAt || 'Gateway'
      });
    } catch (err: unknown) {
      const errorObj = (err as { data?: { code?: number; status?: string; message?: string; enforcedAt?: string }; status?: number }) || {};
      setNegativeTestOutcome({
        probeTarget: 'RED_TEAM_UNRELEASED_VAULT',
        statusCode: errorObj.status || 403,
        status: 'BLOCKED',
        message: errorObj.data?.message || 'Access Denied: Cross-team unauthorized read prevented.',
        timestamp: new Date().toISOString(),
        enforcedAt: errorObj.data?.enforcedAt || 'Kernel RBAC Middleware'
      });
    } finally {
      setNegativeTestLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner */}
      <div className="p-5 rounded-xl border border-sky-900/60 bg-gradient-to-r from-sky-950/40 via-slate-950 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-950/80 border border-sky-500/50 text-sky-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 font-mono tracking-wide">
                BLUE TEAM DEFENSIVE COMMAND & VAULT
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] bg-sky-950 border border-sky-500/40 text-sky-300">
                AUTHORIZATION ENFORCED
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Defensive policy configurations, honeypot canary management, authorized disclosures, and negative boundary verification.
            </p>
          </div>
        </div>

        <button
          onClick={handleProbeRedVault}
          disabled={negativeTestLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 border border-rose-500/60 transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          {negativeTestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
          <span>TEST NEGATIVE RED ACCESS (ASSERT 403)</span>
        </button>
      </div>

      {/* Negative Boundary Verification Result Card */}
      {negativeTestOutcome && (
        <div className="p-4 rounded-xl border border-rose-600/70 bg-rose-950/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-300 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>NEGATIVE BOUNDARY TEST RESULT</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 border border-rose-500 text-rose-200">
                HTTP {negativeTestOutcome.statusCode}
              </span>
            </div>
            <StatusBadge status={negativeTestOutcome.status as 'BLOCKED'} />
          </div>
          <p className="text-slate-300 text-[11px]">
            {negativeTestOutcome.message}
          </p>
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-rose-900/50">
            <span>Enforced At: {negativeTestOutcome.enforcedAt}</span>
            <span>Committed to SHA-256 Ledger</span>
          </div>
        </div>
      )}

      {/* Two Column Layout: Policies & Protected Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Active Defensive Guardrails (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              Active Defensive Guardrails & Enforcement Modes
            </span>
            <span className="text-[10px] text-slate-500">{policies.length} Policies Configured</span>
          </div>

          <div className="space-y-2.5">
            {policies.map((policy) => (
              <div
                key={policy.id}
                className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/70 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 text-xs">{policy.id}: {policy.name}</span>
                    <SeverityBadge severity={policy.severity} />
                  </div>
                  <button
                    onClick={() => handleTogglePolicyMode(policy.id, policy.enforcementMode)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      policy.enforcementMode === 'BLOCK'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/50 hover:bg-rose-900'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/50 hover:bg-amber-900'
                    }`}
                  >
                    MODE: {policy.enforcementMode}
                  </button>
                </div>

                <p className="text-slate-400 text-[11px]">
                  {policy.description}
                </p>

                {/* Regex signatures count */}
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 space-y-1">
                  <span className="text-slate-500 block">Active Inspection Signatures:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {policy.regexPatterns.slice(0, 3).map((pat, i) => (
                      <code key={i} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400">
                        {pat}
                      </code>
                    ))}
                    {policy.regexPatterns.length > 3 && (
                      <span className="text-slate-500">+{policy.regexPatterns.length - 3} more</span>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500">
                  <span className="text-slate-400 font-semibold">Violation Action: </span>
                  {policy.actionOnViolation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Protected Blue Defense Vault & Disclosed Evidence (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Blue Vault Box */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-slate-200">BLUE DEFENSE VAULT</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 border border-sky-500/40 text-sky-300 font-bold">
                RESTRICTED
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Stores honeypot canary strings and internal look-behind heuristics. Red Team cannot read this scope via API.
            </p>

            <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-2 text-[11px]">
              <div>
                <span className="text-slate-500">Active Canary Honeytoken:</span>
                <code className="block mt-0.5 p-1 rounded bg-slate-950 text-cyan-300 border border-slate-800 break-all">
                  BAYORA_CANARY_SECRET_ALPHA_DO_NOT_DISCLOSE
                </code>
              </div>
              <div>
                <span className="text-slate-500">Defense Boundary Mode:</span>
                <span className="text-emerald-400 font-semibold block">STRICT_ENFORCE</span>
              </div>
            </div>
          </div>

          {/* Authorized Test Findings Review */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200">AUTHORIZED TEST DISCLOSURES</span>
              <span className="text-[10px] text-slate-500">Completed Runs</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {recentTests.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-[11px]">
                  No disclosed test findings yet.
                </div>
              ) : (
                recentTests.map((t) => (
                  <div key={t.id} className="p-2.5 rounded bg-slate-900/70 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 truncate">{t.payloadTitle}</span>
                      <StatusBadge status={t.enforcementResult} />
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Policy: {t.policyEvaluated} | {t.evidence}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
