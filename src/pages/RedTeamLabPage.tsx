import React, { useState } from 'react';
import {
  Flame,
  Zap,
  Play,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Info,
  Terminal,
  ShieldAlert,
  Loader2,
  FileCode2,
  Copy
} from 'lucide-react';
import { RED_TEAM_PRESETS } from '../data/presets.ts';
import { api } from '../services/api.ts';
import { RedTeamPayloadPreset, SecurityTestRecord, TestCategory } from '../types/security.ts';
import { SeverityBadge, StatusBadge } from '../components/common/Badge.tsx';

interface RedTeamLabPageProps {
  activeSessionId: string;
  sessions: Array<{ id: string; name: string }>;
  onSelectSession: (id: string) => void;
  onTestExecuted: (record: SecurityTestRecord) => void;
  onNavigateToReplay: () => void;
}

export const RedTeamLabPage: React.FC<RedTeamLabPageProps> = ({
  activeSessionId,
  sessions,
  onSelectSession,
  onTestExecuted,
  onNavigateToReplay
}) => {
  const [selectedPreset, setSelectedPreset] = useState<RedTeamPayloadPreset>(RED_TEAM_PRESETS[0]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [payloadTitle, setPayloadTitle] = useState(RED_TEAM_PRESETS[0].name);
  const [payloadText, setPayloadText] = useState(RED_TEAM_PRESETS[0].payload);
  const [modelAdapter, setModelAdapter] = useState<'gemini' | 'deterministic_sandboxed'>('deterministic_sandboxed');
  const [executing, setExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<SecurityTestRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const filteredPresets = activeCategory === 'all'
    ? RED_TEAM_PRESETS
    : RED_TEAM_PRESETS.filter((p) => p.category === activeCategory);

  const handleSelectPreset = (preset: RedTeamPayloadPreset) => {
    setSelectedPreset(preset);
    setPayloadTitle(preset.name);
    setPayloadText(preset.payload);
    setError(null);
    setValidationError(null);
  };

  const handleExecute = async () => {
    if (!payloadText.trim()) {
      setValidationError('Payload cannot be empty. Please enter an adversarial prompt or pick a preset.');
      return;
    }
    setValidationError(null);
    setError(null);
    setExecuting(true);
    setLastResult(null);
    try {
      const res = await api.executeTest({
        sessionId: activeSessionId,
        category: selectedPreset.category,
        title: payloadTitle.trim() || 'Custom Adversarial Test',
        payload: payloadText.trim(),
        modelAdapter
      });
      setLastResult(res);
      onTestExecuted(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Execution Failed: ${msg}`);
      console.error('Test execution error:', err);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border border-rose-900/60 bg-gradient-to-r from-rose-950/40 via-slate-950 to-slate-950 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 font-mono tracking-wide">
                RED TEAM ADVERSARIAL TESTING LAB
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 border border-rose-500/40 text-rose-300">
                ACTIVE WEAPONIZATION BENCH
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Execute controlled prompt injections, unauthorized vault queries, canary exfiltration probes, and document directives.
            </p>
          </div>
        </div>

        {/* Session Selector */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
          <span className="text-slate-500 text-[11px]">TARGET SESSION:</span>
          <select
            value={activeSessionId}
            onChange={(e) => onSelectSession(e.target.value)}
            className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer max-w-[180px] truncate"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Lab Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Preset Scenarios (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              Adversarial Scenarios (6 Vectors)
            </span>
            <span className="text-[10px] text-slate-500">{filteredPresets.length} Presets Available</span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'direct_prompt_injection', label: 'Direct Injection' },
              { id: 'instruction_override', label: 'Instruction Override' },
              { id: 'unauthorized_access', label: 'Unauthorized Access' },
              { id: 'cross_session_leakage', label: 'Cross-Session' },
              { id: 'restricted_team_info', label: 'Restricted Info' },
              { id: 'untrusted_document_instructions', label: 'Document Injection' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/60 font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Preset Cards List */}
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filteredPresets.map((preset) => {
              const isSelected = selectedPreset.id === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-rose-950/30 border-rose-500/70 shadow-md shadow-rose-950/50'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-xs">{preset.name}</span>
                    <SeverityBadge severity={preset.severity} />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {preset.description}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px]">
                    <span className="text-slate-500 font-mono">Policy: {preset.targetPolicy}</span>
                    <span className="text-rose-400 font-mono">Expected: {preset.expectedOutcome}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Execution Workbench & Lifecycle (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-200 uppercase tracking-wide">
                  Payload Configuration & Model Dispatch
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Session: {activeSessionId}
              </span>
            </div>

            {/* Title */}
            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Scenario Title</label>
              <input
                type="text"
                value={payloadTitle}
                onChange={(e) => setPayloadTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Model Adapter */}
            <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/70 border border-slate-800 text-[11px]">
              <span className="text-slate-400">Target Adapter:</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="modelAdapter"
                    checked={modelAdapter === 'deterministic_sandboxed'}
                    onChange={() => setModelAdapter('deterministic_sandboxed')}
                  />
                  <span>Deterministic Sandboxed</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="modelAdapter"
                    checked={modelAdapter === 'gemini'}
                    onChange={() => setModelAdapter('gemini')}
                  />
                  <span>Gemini 2.5 Flash</span>
                </label>
              </div>
            </div>

            {/* Payload Editor */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-400 text-[11px]">Adversarial Prompt Payload</label>
                <span className="text-[10px] text-slate-500">{payloadText.length} characters</span>
              </div>
              <textarea
                rows={4}
                value={payloadText}
                disabled={executing}
                onChange={(e) => {
                  setPayloadText(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                className={`w-full bg-slate-900 border rounded p-2.5 text-slate-200 font-mono text-xs focus:outline-none resize-none transition-colors ${
                  validationError ? 'border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-rose-500'
                }`}
              />
              {validationError && (
                <span className="text-rose-400 text-[10px] mt-0.5 block">{validationError}</span>
              )}
            </div>

            {error && (
              <div className="p-2.5 rounded bg-rose-950/80 border border-rose-500 text-rose-200 text-xs">
                {error}
              </div>
            )}

            {/* Execute Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-500">
                Safe controlled test payload. Harmless to operating system.
              </span>
              <button
                onClick={handleExecute}
                disabled={executing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-lg shadow-rose-950/60 disabled:opacity-50 cursor-pointer"
              >
                {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                <span>{executing ? 'Evaluating Security Gateway...' : 'Execute Adversarial Test'}</span>
              </button>
            </div>
          </div>

          {/* Test Lifecycle & Result Inspector */}
          {lastResult && (
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/90 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">VERIFIED OUTCOME:</span>
                  <StatusBadge status={lastResult.enforcementResult} />
                </div>
                <div className="text-slate-400 text-[10px]">
                  {new Date(lastResult.timestamp).toLocaleTimeString()} ({lastResult.durationMs}ms)
                </div>
              </div>

              {/* Simulated vs Live Label */}
              {lastResult.isSimulated || modelAdapter === 'deterministic_sandboxed' ? (
                <div className="px-2.5 py-1 rounded bg-purple-950/50 border border-purple-500/40 text-purple-300 text-[10px] flex items-center justify-between font-bold">
                  <span>SIMULATED ADAPTER: Deterministic Sandboxed Model</span>
                  <span className="text-purple-400/70 font-normal">Offline Reproducible</span>
                </div>
              ) : (
                <div className="px-2.5 py-1 rounded bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 text-[10px] flex items-center justify-between font-bold">
                  <span>LIVE LLM ADAPTER: Gemini 2.5 Flash</span>
                  <span className="text-cyan-400/70 font-normal">Real-Time Inference</span>
                </div>
              )}

              {/* Distinction Banner */}
              <div className="p-3 rounded bg-slate-900 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Policy Evaluated:</span>
                  <span className="text-cyan-400 font-bold">{lastResult.policyEvaluated}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Detection Result:</span>
                  <span className={lastResult.detectionResult ? 'text-amber-400' : 'text-emerald-400'}>
                    {lastResult.detectionResult ? 'SIGNATURE DETECTED' : 'CLEAN / NOT DETECTED'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Enforcement Action:</span>
                  <span className="text-rose-400 font-bold">{lastResult.enforcementResult}</span>
                </div>
              </div>

              {/* Evidence Snippet */}
              <div>
                <span className="text-slate-400 font-semibold block mb-1">Verifiable Evidence:</span>
                <div className="p-2.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[11px]">
                  {lastResult.evidence}
                </div>
              </div>

              {/* Model Output (if allowed or simulated) */}
              {lastResult.modelResponse && (
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Model Output:</span>
                  <div className="p-2.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[11px] whitespace-pre-wrap max-h-36 overflow-y-auto">
                    {lastResult.modelResponse}
                  </div>
                </div>
              )}

              {/* Residual Risk */}
              <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded border border-slate-800">
                <span className="text-amber-400 font-semibold">Residual Risk Assessment: </span>
                {lastResult.residualRisk}
              </div>

              {/* Replay CTA */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={onNavigateToReplay}
                  className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 hover:underline text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>View Step-by-Step Attack Replay</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
