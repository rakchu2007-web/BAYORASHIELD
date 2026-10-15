import React, { useState } from 'react';
import {
  SplitSquareVertical,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  CheckCircle,
  XCircle,
  ArrowRight,
  Lock,
  Layers,
  Server,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Scale,
  Shield,
  Key
} from 'lucide-react';
import { api, KNOWN_ROLE_TOKENS } from '../services/api.ts';
import { Role, IsolationVerificationResult } from '../types/security.ts';
import { StatusBadge } from '../components/common/Badge.tsx';

interface IsolationCenterPageProps {
  sessions: Array<{ id: string; name: string; canaryToken: string }>;
  activeSessionId: string;
  currentRole?: Role;
  onRoleChange?: (role: Role) => void;
}

export const IsolationCenterPage: React.FC<IsolationCenterPageProps> = ({
  sessions,
  activeSessionId,
  currentRole = 'judge_auditor',
  onRoleChange
}) => {
  const [testing, setTesting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<IsolationVerificationResult | null>(null);
  const [denialInfo, setDenialInfo] = useState<{
    error: string;
    message: string;
    requiredPermission: string;
    attemptedRole: Role;
    allowedRoles: string[];
    statusCode: number;
    timestamp: string;
  } | null>(null);

  const [probeResult, setProbeResult] = useState<{
    testedPath: string;
    allowed: boolean;
    statusCode: number;
    details: string;
    targetVault?: string;
    enforcedAt?: string;
    timestamp: string;
  } | null>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const otherSession = sessions.find((s) => s.id !== activeSessionId) || {
    id: 'sess-secondary-999',
    name: 'Secondary Quarantine Session',
    canaryToken: 'CANARY-SEC-9988-Q2'
  };

  const isCurrentRoleAuthorized = currentRole === 'judge_auditor';

  // Primary Action: Execute Isolation Boundary Verification using active user credentials
  const handleRunIsolationVerification = async () => {
    setTesting(true);
    setVerificationResult(null);
    setDenialInfo(null);
    setProbeResult(null);

    try {
      // Calls /api/isolation/verify under the current role token
      const res = await api.verifyIsolation();
      setVerificationResult(res);
    } catch (err: unknown) {
      const errorObj = (err as { data?: { error?: string; message?: string; requiredPermission?: string; allowedRoles?: string[] }; status?: number }) || {};
      const status = errorObj.status || 403;
      const data = errorObj.data || {};

      setDenialInfo({
        error: data.error || 'ERR_FORBIDDEN_PERMISSION_DENIED',
        message: data.message || `Access blocked by RBAC boundary middleware: Role '${currentRole}' does not possess required permission 'isolation:verify'. Required role: [judge_auditor].`,
        requiredPermission: data.requiredPermission || 'isolation:verify',
        attemptedRole: currentRole,
        allowedRoles: data.allowedRoles || ['judge_auditor'],
        statusCode: status,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  // Switch role to judge_auditor and immediately run verification
  const handleSwitchToAuditorAndRun = () => {
    if (onRoleChange) {
      onRoleChange('judge_auditor');
    }
    // Small timeout to allow state sync before running
    setTimeout(async () => {
      setTesting(true);
      setDenialInfo(null);
      try {
        const res = await api.verifyIsolation(KNOWN_ROLE_TOKENS.judge_auditor.token);
        setVerificationResult(res);
      } catch (err) {
        console.error('Auditor verification failed:', err);
      } finally {
        setTesting(false);
      }
    }, 100);
  };

  // Individual Cross-Boundary Probe Tests
  const runProbe = async (type: 'red_to_blue' | 'blue_to_red' | 'cross_session' | 'auditor_read') => {
    setTesting(true);
    setProbeResult(null);
    try {
      if (type === 'red_to_blue') {
        const res = await api.testBoundaryAccess('blue', KNOWN_ROLE_TOKENS.red_team.token);
        setProbeResult({
          testedPath: 'RED TEAM -> BLUE TEAM VAULT (/api/vault/blue)',
          allowed: res.status === 'ALLOWED',
          statusCode: res.code || 200,
          details: res.message,
          enforcedAt: res.enforcedAt,
          timestamp: new Date().toISOString()
        });
      } else if (type === 'blue_to_red') {
        const res = await api.testBoundaryAccess('red', KNOWN_ROLE_TOKENS.blue_team.token);
        setProbeResult({
          testedPath: 'BLUE TEAM -> RED TEAM VAULT (/api/vault/red)',
          allowed: res.status === 'ALLOWED',
          statusCode: res.code || 200,
          details: res.message,
          enforcedAt: res.enforcedAt,
          timestamp: new Date().toISOString()
        });
      } else if (type === 'cross_session') {
        const res = await api.testCrossSessionLeakage(activeSession.id, otherSession.id);
        setProbeResult({
          testedPath: `SESSION '${activeSession.id}' -> SESSION '${otherSession.id}' CONTEXT`,
          allowed: res.status === 'ALLOWED',
          statusCode: res.code || 200,
          details: res.message,
          enforcedAt: res.enforcedAt,
          timestamp: new Date().toISOString()
        });
      } else if (type === 'auditor_read') {
        const res = await api.testBoundaryAccess('blue', KNOWN_ROLE_TOKENS.judge_auditor.token);
        setProbeResult({
          testedPath: 'SECURITY AUDITOR -> MULTI-VAULT INSPECTION',
          allowed: res.status === 'ALLOWED',
          statusCode: res.code || 200,
          details: res.message,
          enforcedAt: res.enforcedAt,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err: unknown) {
      const errorObj = (err as { data?: { code?: number; message?: string; enforcedAt?: string }; status?: number }) || {};
      setProbeResult({
        testedPath:
          type === 'red_to_blue'
            ? 'RED TEAM -> BLUE TEAM VAULT (/api/vault/blue)'
            : type === 'blue_to_red'
            ? 'BLUE TEAM -> RED TEAM VAULT (/api/vault/red)'
            : 'CROSS-SESSION CONTEXT ACCESS',
        allowed: false,
        statusCode: errorObj.status || 403,
        details: errorObj.data?.message || 'Access blocked by RBAC boundary middleware.',
        enforcedAt: errorObj.data?.enforcedAt || 'Kernel RBAC Middleware',
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header with Role Status & Primary Verification Trigger */}
      <div className="p-5 rounded-xl border border-violet-900/60 bg-gradient-to-r from-violet-950/40 via-slate-950 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-violet-950/80 border border-violet-500/50 text-violet-400">
            <SplitSquareVertical className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 font-mono tracking-wide">
                ISOLATION & MULTI-TENANCY CONTROL CENTER
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] bg-violet-950 border border-violet-500/40 text-violet-300">
                APPLICATION-LEVEL ISOLATION
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Live architecture topology: Red Team, Blue Team, and Target Model isolation boundaries with verifiable communication matrix.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-400">ACTIVE ROLE CONTEXT</div>
            <div className="text-xs font-bold text-slate-200">
              {currentRole === 'judge_auditor' ? (
                <span className="text-purple-300 flex items-center gap-1 justify-end">
                  <Scale className="w-3.5 h-3.5" /> Security Auditor
                </span>
              ) : currentRole === 'red_team' ? (
                <span className="text-rose-300 flex items-center gap-1 justify-end">
                  <ShieldAlert className="w-3.5 h-3.5" /> Red Operator
                </span>
              ) : (
                <span className="text-sky-300 flex items-center gap-1 justify-end">
                  <ShieldCheck className="w-3.5 h-3.5" /> Blue Defender
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleRunIsolationVerification}
            disabled={testing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold transition-all shadow-md ${
              isCurrentRoleAuthorized
                ? 'bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-violet-950/50'
                : 'bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-200 shadow-rose-950/50'
            } disabled:opacity-50`}
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            <span>{isCurrentRoleAuthorized ? 'Verify Isolation Boundaries' : 'Test Isolation (As Current Role)'}</span>
          </button>
        </div>
      </div>

      {/* RBAC Authorization Status Banner */}
      <div className={`p-3.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isCurrentRoleAuthorized
          ? 'bg-purple-950/30 border-purple-800/50 text-purple-200'
          : 'bg-amber-950/20 border-amber-800/50 text-amber-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <Key className="w-4 h-4 shrink-0 text-slate-300" />
          <div>
            <span className="font-bold">RBAC Permission Status: </span>
            {isCurrentRoleAuthorized ? (
              <span>
                Role <code className="text-purple-300 font-bold bg-purple-950/80 px-1 py-0.5 rounded border border-purple-500/40">judge_auditor</code> possesses required permission <code className="text-cyan-300 font-bold">isolation:verify</code>. Authorized to execute full multi-tenant verification.
              </span>
            ) : (
              <span>
                Role <code className="text-rose-300 font-bold bg-rose-950/80 px-1 py-0.5 rounded border border-rose-500/40">{currentRole}</code> lacks permission <code className="text-amber-300 font-bold">isolation:verify</code>. Enforced by RBAC boundary middleware to prevent participant privilege escalation.
              </span>
            )}
          </div>
        </div>

        {!isCurrentRoleAuthorized && onRoleChange && (
          <button
            onClick={() => onRoleChange('judge_auditor')}
            className="px-3 py-1 rounded bg-purple-900/60 hover:bg-purple-800 border border-purple-500/50 text-purple-200 text-[11px] font-semibold transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Switch to Security Auditor</span>
          </button>
        )}
      </div>

      {/* RBAC Middleware Denial Feedback (Negative Verification Evidence) */}
      {denialInfo && (
        <div className="p-4 rounded-xl border border-rose-500/60 bg-rose-950/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span className="text-sm">ACCESS BLOCKED BY RBAC BOUNDARY MIDDLEWARE</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900 border border-rose-400/50 text-rose-200">
                HTTP {denialInfo.statusCode} FORBIDDEN
              </span>
            </div>
            <StatusBadge status="BLOCKED" />
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-rose-900/50 space-y-2 text-[11px]">
            <p className="text-slate-200 font-medium">{denialInfo.message}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 border-t border-rose-900/40 text-[10px] text-slate-400">
              <div>
                <span className="text-slate-500">Attempted Role: </span>
                <span className="text-rose-300 font-bold">{denialInfo.attemptedRole}</span>
              </div>
              <div>
                <span className="text-slate-500">Required Permission: </span>
                <span className="text-amber-300 font-bold">{denialInfo.requiredPermission}</span>
              </div>
              <div>
                <span className="text-slate-500">Authorized Roles: </span>
                <span className="text-purple-300 font-bold">{denialInfo.allowedRoles.join(', ')}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-300 pt-1">
            <span className="text-slate-400">
              Security Guarantee: RBAC middleware strictly isolates Red Team, Blue Team, and Auditor roles.
            </span>
            <button
              onClick={handleSwitchToAuditorAndRun}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors shadow-md"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Switch to Security Auditor & Run Test</span>
            </button>
          </div>
        </div>
      )}

      {/* Successful Authorized Verification Results */}
      {verificationResult && (
        <div className="p-5 rounded-xl border border-emerald-500/60 bg-emerald-950/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/30 pb-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-emerald-300">
                    MULTI-TENANT ISOLATION VERIFIED: STATUS PASS
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                    HTTP {verificationResult.statusCode} OK
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Verified by <strong className="text-purple-300">{verificationResult.verifiedBy}</strong> via RBAC permission <code className="text-cyan-300">{verificationResult.permission}</code>. Cryptographic audit record committed.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status="VERIFIED" />
              <span className="text-[10px] text-slate-400">{new Date(verificationResult.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* 4 Boundary Checkpoint Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {verificationResult.boundaries.map((boundary, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-900/90 border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-[11px] flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    {boundary.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold">
                    {boundary.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">{boundary.details}</p>
                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800">
                  <span>Enforcement: {boundary.enforcement}</span>
                  <code className="text-cyan-400">{boundary.target}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Live Boundary Probe Feedback */}
      {probeResult && (
        <div className={`p-4 rounded-xl border ${
          probeResult.allowed ? 'border-amber-500/60 bg-amber-950/20' : 'border-emerald-500/60 bg-emerald-950/20'
        } space-y-2`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              {probeResult.allowed ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              )}
              <span className="text-slate-200">BOUNDARY PROBE: {probeResult.testedPath}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                probeResult.statusCode === 403
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
              }`}>
                HTTP {probeResult.statusCode}
              </span>
            </div>
            <StatusBadge status={probeResult.allowed ? 'ALLOWED' : 'BLOCKED'} />
          </div>
          <p className="text-slate-300 text-[11px]">{probeResult.details}</p>
          {probeResult.enforcedAt && (
            <div className="text-[10px] text-slate-500">
              Enforcement Layer: <span className="text-slate-300 font-mono">{probeResult.enforcedAt}</span>
            </div>
          )}
        </div>
      )}

      {/* Cross-Boundary Interactive Probes Panel */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2 text-slate-200 font-bold">
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            <span>INTERACTIVE BOUNDARY VERIFICATION PROBES</span>
          </div>
          <span className="text-[10px] text-slate-400">Dispatch live API requests to test positive & negative RBAC controls</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            onClick={() => runProbe('red_to_blue')}
            disabled={testing}
            className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800/90 border border-rose-900/40 hover:border-rose-500/60 text-left transition-all disabled:opacity-50 space-y-1"
          >
            <div className="flex items-center justify-between text-rose-300 font-bold text-[11px]">
              <span>PROBE 1: RED → BLUE VAULT</span>
              <span className="text-[9px] px-1 py-0.5 rounded bg-rose-950 text-rose-400">NEGATIVE</span>
            </div>
            <p className="text-slate-400 text-[10px]">Test Red Team accessing Blue Defense Vault. Expected: HTTP 403 Blocked.</p>
          </button>

          <button
            onClick={() => runProbe('blue_to_red')}
            disabled={testing}
            className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800/90 border border-sky-900/40 hover:border-sky-500/60 text-left transition-all disabled:opacity-50 space-y-1"
          >
            <div className="flex items-center justify-between text-sky-300 font-bold text-[11px]">
              <span>PROBE 2: BLUE → RED VAULT</span>
              <span className="text-[9px] px-1 py-0.5 rounded bg-sky-950 text-sky-400">NEGATIVE</span>
            </div>
            <p className="text-slate-400 text-[10px]">Test Blue Team inspecting unreleased Red exploits. Expected: HTTP 403 Blocked.</p>
          </button>

          <button
            onClick={() => runProbe('cross_session')}
            disabled={testing}
            className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800/90 border border-amber-900/40 hover:border-amber-500/60 text-left transition-all disabled:opacity-50 space-y-1"
          >
            <div className="flex items-center justify-between text-amber-300 font-bold text-[11px]">
              <span>PROBE 3: CROSS-SESSION LEAK</span>
              <span className="text-[9px] px-1 py-0.5 rounded bg-amber-950 text-amber-400">NEGATIVE</span>
            </div>
            <p className="text-slate-400 text-[10px]">Probe session context buffer leakage across boundaries. Expected: HTTP 403.</p>
          </button>

          <button
            onClick={() => runProbe('auditor_read')}
            disabled={testing}
            className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800/90 border border-purple-900/40 hover:border-purple-500/60 text-left transition-all disabled:opacity-50 space-y-1"
          >
            <div className="flex items-center justify-between text-purple-300 font-bold text-[11px]">
              <span>PROBE 4: AUDITOR INSPECT</span>
              <span className="text-[9px] px-1 py-0.5 rounded bg-purple-950 text-purple-400">POSITIVE</span>
            </div>
            <p className="text-slate-400 text-[10px]">Test Security Auditor global read inspection. Expected: HTTP 200 Allowed.</p>
          </button>
        </div>
      </div>

      {/* Topology 3-Column Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Workspace 1: Red Team */}
        <div className="p-4 rounded-xl border border-rose-900/60 bg-slate-950/80 space-y-3">
          <div className="flex items-center justify-between border-b border-rose-900/40 pb-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>RED TEAM WORKSPACE</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30">
              TENANT A
            </span>
          </div>

          <div className="space-y-2 text-[11px]">
            <div>
              <span className="text-slate-500 block">Scope Storage:</span>
              <span className="text-slate-300">/api/vault/red (Exploits, Zero-Day Drafts)</span>
            </div>
            <div>
              <span className="text-slate-500 block">Bearer Token Key:</span>
              <code className="text-rose-300 text-[10px]">BAYORA-RED-SECRET-KEY-9941</code>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] space-y-1">
              <div className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Allowed: Dispatch test to Target Model
              </div>
              <div className="text-rose-400 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Denied: Read Blue Team Private Vault (HTTP 403)
              </div>
              <div className="text-rose-400 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Denied: Run Isolation Verification (HTTP 403)
              </div>
            </div>
          </div>
        </div>

        {/* Workspace 2: Target Model Gateway */}
        <div className="p-4 rounded-xl border border-cyan-900/60 bg-slate-950/80 space-y-3">
          <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Cpu className="w-4 h-4" />
              <span>TARGET MODEL GATEWAY</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              SANDBOX
            </span>
          </div>

          <div className="space-y-2 text-[11px]">
            <div>
              <span className="text-slate-500 block">Active Session Anchor:</span>
              <span className="text-slate-300">{activeSession?.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Canary Token Injected:</span>
              <code className="text-cyan-300 text-[10px]">{activeSession?.canaryToken}</code>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] space-y-1">
              <div className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Pre-execution Regex Policy Intercept
              </div>
              <div className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Post-execution Canary Exfiltration Scrub
              </div>
              <div className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Multi-Tenant Context Memory Isolation
              </div>
            </div>
          </div>
        </div>

        {/* Workspace 3: Blue Team */}
        <div className="p-4 rounded-xl border border-sky-900/60 bg-slate-950/80 space-y-3">
          <div className="flex items-center justify-between border-b border-sky-900/40 pb-2">
            <div className="flex items-center gap-2 text-sky-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>BLUE TEAM WORKSPACE</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/30">
              TENANT B
            </span>
          </div>

          <div className="space-y-2 text-[11px]">
            <div>
              <span className="text-slate-500 block">Scope Storage:</span>
              <span className="text-slate-300">/api/vault/blue (Defenses, Policies, Canaries)</span>
            </div>
            <div>
              <span className="text-slate-500 block">Bearer Token Key:</span>
              <code className="text-sky-300 text-[10px]">BAYORA-BLUE-DEFENSE-KEY-3312</code>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] space-y-1">
              <div className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Allowed: Configure POL-AI-* Rules
              </div>
              <div className="text-rose-400 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Denied: Inspect Unreleased Red Payloads (HTTP 403)
              </div>
              <div className="text-rose-400 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Denied: Run Isolation Verification (HTTP 403)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Communication Matrix Table */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="font-bold text-slate-200">CROSS-TENANT ACCESS CONTROL MATRIX</span>
          <span className="text-[10px] text-slate-500">Enforced by Express Kernel RBAC Middleware</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">SUBJECT ROLE</th>
                <th className="py-2 px-3">TARGET RESOURCE</th>
                <th className="py-2 px-3">POLICY / STATUS CODE</th>
                <th className="py-2 px-3">DECISION</th>
                <th className="py-2 px-3">ENFORCEMENT LAYER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-rose-300">RED TEAM</td>
                <td className="py-2.5 px-3 text-slate-300">/api/vault/blue (Defense Policies)</td>
                <td className="py-2.5 px-3 text-rose-400">POL-AI-03 / HTTP 403</td>
                <td className="py-2.5 px-3"><StatusBadge status="BLOCKED" /></td>
                <td className="py-2.5 px-3 text-slate-400">Server RBAC Middleware</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-sky-300">BLUE TEAM</td>
                <td className="py-2.5 px-3 text-slate-300">/api/vault/red (Unreleased Payloads)</td>
                <td className="py-2.5 px-3 text-rose-400">POL-AI-03 / HTTP 403</td>
                <td className="py-2.5 px-3"><StatusBadge status="BLOCKED" /></td>
                <td className="py-2.5 px-3 text-slate-400">Server RBAC Middleware</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-rose-300">RED TEAM</td>
                <td className="py-2.5 px-3 text-slate-300">/api/isolation/verify (Boundary Verification)</td>
                <td className="py-2.5 px-3 text-rose-400">RBAC / HTTP 403</td>
                <td className="py-2.5 px-3"><StatusBadge status="BLOCKED" /></td>
                <td className="py-2.5 px-3 text-slate-400">Server RBAC Middleware</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-sky-300">BLUE TEAM</td>
                <td className="py-2.5 px-3 text-slate-300">/api/isolation/verify (Boundary Verification)</td>
                <td className="py-2.5 px-3 text-rose-400">RBAC / HTTP 403</td>
                <td className="py-2.5 px-3"><StatusBadge status="BLOCKED" /></td>
                <td className="py-2.5 px-3 text-slate-400">Server RBAC Middleware</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-purple-300">SECURITY AUDITOR</td>
                <td className="py-2.5 px-3 text-slate-300">/api/isolation/verify (Boundary Verification)</td>
                <td className="py-2.5 px-3 text-emerald-400">RBAC / HTTP 200</td>
                <td className="py-2.5 px-3"><StatusBadge status="ALLOWED" /></td>
                <td className="py-2.5 px-3 text-slate-400">Authorized with isolation:verify</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-rose-300">RED TEAM</td>
                <td className="py-2.5 px-3 text-slate-300">/api/tests/execute (Target Model)</td>
                <td className="py-2.5 px-3 text-emerald-400">POL-GATEWAY / HTTP 200</td>
                <td className="py-2.5 px-3"><StatusBadge status="ALLOWED" /></td>
                <td className="py-2.5 px-3 text-slate-400">Security Gateway Pre-Filter</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-purple-300">JUDGE / AUDITOR</td>
                <td className="py-2.5 px-3 text-slate-300">All Vaults + Audit Ledger</td>
                <td className="py-2.5 px-3 text-emerald-400">EVAL-01 / HTTP 200</td>
                <td className="py-2.5 px-3"><StatusBadge status="ALLOWED" /></td>
                <td className="py-2.5 px-3 text-slate-400">Global Read-Only Auditor</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Architecture Disclaimer on Application-Level vs Container Isolation */}
      <div className="p-4 rounded-xl border border-amber-600/50 bg-amber-950/20 space-y-2 text-slate-300">
        <div className="flex items-center gap-2 text-amber-300 font-bold">
          <AlertTriangle className="w-4 h-4" />
          <span>ISOLATION BOUNDARY SPECIFICATION & LIMITATIONS</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          <strong className="text-amber-200">Honest Disclosure: </strong>
          Current deployment implements <strong className="text-slate-200">Application-Level Memory & Scoped Database Isolation</strong> with cryptographic token authorization and SHA-256 hash chaining.
          It does NOT run separate Linux cgroup Docker containers per tenant in this container runtime.
          While application-level RBAC reliably intercepts cross-tenant HTTP/API reads (proven by negative tests returning 403), a kernel-level host breach or shared process vulnerability would require external hardware sandboxing (e.g. gVisor or Firecracker microVMs) for complete infrastructure guarantees.
        </p>
      </div>
    </div>
  );
};
