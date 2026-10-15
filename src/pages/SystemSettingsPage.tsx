import React, { useState } from 'react';
import {
  Settings,
  Play,
  CheckCircle2,
  XCircle,
  FileText,
  Shield,
  AlertTriangle,
  Terminal,
  Loader2,
  Copy,
  Check,
  Server,
  Layers,
  Key
} from 'lucide-react';
import { api, KNOWN_ROLE_TOKENS } from '../services/api.ts';
import { AutomatedTestResult } from '../types/security.ts';
import { StatusBadge } from '../components/common/Badge.tsx';

export const SystemSettingsPage: React.FC = () => {
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<AutomatedTestResult[]>([]);
  const [summary, setSummary] = useState<{ total: number; passed: number; failed: number; passPercentage: number } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleRunAllTests = async () => {
    setRunningTests(true);
    try {
      const res = await api.runAutomatedTests();
      setTestResults(res.results);
      setSummary(res.summary);
    } catch (err) {
      console.error('Failed to run automated tests:', err);
    } finally {
      setRunningTests(false);
    }
  };

  const copyToken = (key: string, token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner */}
      <div className="p-5 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-950 via-[#0c1120] to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 font-mono tracking-wide">
                SYSTEM SETTINGS & 10-SUITE AUTOMATED SECURITY RUNNER
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 text-slate-300">
                VERIFIABLE SUITE
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Execute live regression tests verifying negative access control, cross-session barriers, SHA-256 chain integrity, and tampering detection.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunAllTests}
          disabled={runningTests}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
        >
          {runningTests ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{runningTests ? 'Executing 10 Test Suites...' : 'Run 10-Suite Automated Tests'}</span>
        </button>
      </div>

      {/* Test Execution Summary Box */}
      {summary && (
        <div className={`p-4 rounded-xl border ${
          summary.failed === 0 ? 'border-emerald-500/60 bg-emerald-950/20' : 'border-rose-500/60 bg-rose-950/20'
        } flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {summary.failed === 0 ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-400" />
            )}
            <div>
              <span className="font-bold text-slate-100 text-sm">
                AUTOMATED SUITE EXECUTION COMPLETE ({summary.passed}/{summary.total} PASSED)
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All 10 security assertions executed against live Express endpoints. Never mocked.
              </p>
            </div>
          </div>
          <span className={`text-lg font-extrabold px-3 py-1 rounded border ${
            summary.failed === 0
              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
              : 'bg-rose-950 text-rose-300 border-rose-500/50'
          }`}>
            {summary.passPercentage}% PASS
          </span>
        </div>
      )}

      {/* Automated Test Results Table */}
      {testResults.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden space-y-2">
          <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/50 font-bold text-slate-200">
            TEST SUITE RESULTS ({testResults.length} TEST CASES)
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">SUITE ID</th>
                  <th className="py-2.5 px-3">NAME & DESCRIPTION</th>
                  <th className="py-2.5 px-3">STATUS CODE</th>
                  <th className="py-2.5 px-3">ASSERTION</th>
                  <th className="py-2.5 px-3">VERDICT</th>
                  <th className="py-2.5 px-3">DURATION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {testResults.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-3 font-semibold text-slate-300">{t.id}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200">{t.name}</div>
                      <div className="text-[10px] text-slate-400">{t.description}</div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        t.statusCode === 403 || t.statusCode === 401
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        HTTP {t.statusCode}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[10px] text-slate-400 max-w-xs truncate" title={t.assertion}>
                      {t.assertion}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={t.passed ? 'PASS' : 'FAIL'} />
                    </td>
                    <td className="py-3 px-3 text-[10px] text-slate-400">{t.durationMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RBAC Token Reference Box */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3">
        <div className="flex items-center gap-2 text-cyan-400 font-bold border-b border-slate-800 pb-2">
          <Key className="w-4 h-4" />
          <span>ROLE-BASED AUTHORIZATION TOKENS REFERENCE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(KNOWN_ROLE_TOKENS).map(([role, data]) => (
            <div key={role} className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-bold uppercase">{role.replace('_', ' ')}</span>
                <span className="text-[10px] text-slate-500">{data.title}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-950 border border-slate-800">
                <code className="text-cyan-300 text-[10px] truncate max-w-[170px]">{data.token}</code>
                <button onClick={() => copyToken(role, data.token)} className="hover:text-cyan-400">
                  {copiedKey === role ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture Documentation & Threat Model */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Architecture Spec */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2.5">
          <div className="flex items-center gap-2 text-violet-400 font-bold border-b border-slate-800 pb-2">
            <Server className="w-4 h-4" />
            <span>SYSTEM ARCHITECTURE SUMMARY</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-200">Frontend: </strong>React 19, TypeScript, Tailwind CSS, modular SOC components, zero external telemetry.<br />
            <strong className="text-slate-200">Backend: </strong>Node.js Express + TSX full-stack gateway running Vite middleware in dev.<br />
            <strong className="text-slate-200">Authorization: </strong>Server-side Bearer token extraction and tenant scope boundary enforcement.<br />
            <strong className="text-slate-200">Target Model: </strong>Multi-adapter layer supporting Gemini 2.5 Flash and deterministic sandboxed evaluation with synthetic canary traps.<br />
            <strong className="text-slate-200">Ledger: </strong>Canonical SHA-256 hash chaining with genesis anchor and verification algorithm.
          </p>
        </div>

        {/* Threat Model */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2.5">
          <div className="flex items-center gap-2 text-rose-400 font-bold border-b border-slate-800 pb-2">
            <Shield className="w-4 h-4" />
            <span>THREAT MODEL (STRIDE / ADVERSARIAL AI)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-200">Tampering: </strong>Mitigated via canonical SHA-256 ledger. Any retro-modified event breaks hash links.<br />
            <strong className="text-slate-200">Information Disclosure: </strong>Canary tokens in system prompts scrubbed by post-execution guard.<br />
            <strong className="text-slate-200">Elevation of Privilege: </strong>Express middleware verifies token roles independently of client claims.<br />
            <strong className="text-slate-200">Adversarial Inversion: </strong>Multi-stage regex and semantic checks drop known jailbreaks before model tokenization.
          </p>
        </div>
      </div>
    </div>
  );
};
