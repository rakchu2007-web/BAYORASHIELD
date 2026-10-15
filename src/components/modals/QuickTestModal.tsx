import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Zap,
  ShieldAlert,
  AlertCircle,
  Loader2,
  CheckCircle,
  Clock,
  History,
  FileCheck2,
  Cpu,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { RED_TEAM_PRESETS } from '../../data/presets.ts';
import { RedTeamPayloadPreset, SecurityTestRecord, TestCategory } from '../../types/security.ts';
import { StatusBadge } from '../common/Badge.tsx';

interface QuickTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSessionId: string;
  onTestCompleted: (record: SecurityTestRecord) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const QuickTestModal: React.FC<QuickTestModalProps> = ({
  isOpen,
  onClose,
  activeSessionId,
  onTestCompleted,
  onNavigateToTab
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(RED_TEAM_PRESETS[0].id);
  const [customTitle, setCustomTitle] = useState<string>(RED_TEAM_PRESETS[0].name);
  const [customPayload, setCustomPayload] = useState<string>(RED_TEAM_PRESETS[0].payload);
  const [category, setCategory] = useState<TestCategory>(RED_TEAM_PRESETS[0].category);
  const [modelAdapter, setModelAdapter] = useState<'gemini' | 'deterministic_sandboxed'>('deterministic_sandboxed');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [result, setResult] = useState<SecurityTestRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ title?: string; payload?: string }>({});

  const resultContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result && resultContainerRef.current) {
      resultContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [result]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: RedTeamPayloadPreset) => {
    setSelectedPresetId(preset.id);
    setCustomTitle(preset.name);
    setCustomPayload(preset.payload);
    setCategory(preset.category);
    setResult(null);
    setError(null);
    setValidationErrors({});
  };

  const validate = (): boolean => {
    const errors: { title?: string; payload?: string } = {};
    if (!customTitle.trim()) {
      errors.title = 'Scenario title cannot be empty.';
    }
    if (!customPayload.trim()) {
      errors.payload = 'Test payload cannot be empty. Please enter an adversarial prompt.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRun = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    setLoadingStage('Validating scenario and tenant session...');
    setError(null);
    setResult(null);

    const stageTimer1 = setTimeout(() => {
      setLoadingStage('Evaluating input through Pre-Execution Security Gateway...');
    }, 250);

    const stageTimer2 = setTimeout(() => {
      setLoadingStage('Running target model adapter & canary exfiltration scan...');
    }, 550);

    try {
      const res = await api.executeTest({
        sessionId: activeSessionId || 'sess-alpha-882',
        category,
        title: customTitle.trim(),
        payload: customPayload.trim(),
        modelAdapter
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setLoadingStage('Committing record to SHA-256 cryptographic audit ledger...');

      setResult(res);
      onTestCompleted(res);
    } catch (err: unknown) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(`Execution Failed: ${errMsg}`);
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-xl border border-slate-700/80 bg-[#090c14] shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="font-bold text-slate-100 text-sm tracking-wide">DISPATCH SECURITY TEST</span>
              <span className="text-[10px] text-slate-400 block">
                Session: <strong className="text-cyan-300">{activeSessionId}</strong> | Real Enforcement Gateway
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Preset Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400 text-[11px] font-semibold uppercase">
                Select Adversarial Test Scenario Preset
              </label>
              <span className="text-[10px] text-slate-500">{RED_TEAM_PRESETS.length} Presets Available</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1.5 bg-slate-950 rounded-lg border border-slate-800">
              {RED_TEAM_PRESETS.map((p) => {
                const isSelected = selectedPresetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`text-left p-2 rounded transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 text-cyan-300 border border-cyan-500/60 shadow-sm'
                        : 'hover:bg-slate-900 text-slate-400 border border-transparent'
                    }`}
                  >
                    <div className="font-semibold text-[11px] truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
                      <span className="truncate">{p.targetPolicy}</span>
                      <span className="uppercase text-[9px] px-1 rounded bg-slate-900 border border-slate-800">
                        {p.expectedOutcome}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Scenario Title</label>
              <input
                type="text"
                value={customTitle}
                disabled={loading}
                onChange={(e) => {
                  setCustomTitle(e.target.value);
                  if (validationErrors.title) setValidationErrors((prev) => ({ ...prev, title: undefined }));
                }}
                className={`w-full bg-slate-950 border rounded px-2.5 py-1.5 text-slate-200 focus:outline-none transition-colors ${
                  validationErrors.title ? 'border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-cyan-500'
                }`}
              />
              {validationErrors.title && (
                <span className="text-rose-400 text-[10px] mt-0.5 block">{validationErrors.title}</span>
              )}
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Threat Category</label>
              <select
                value={category}
                disabled={loading}
                onChange={(e) => setCategory(e.target.value as TestCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="direct_prompt_injection">Direct Prompt Injection</option>
                <option value="instruction_override">Instruction Override</option>
                <option value="unauthorized_access">Unauthorized Access</option>
                <option value="cross_session_leakage">Cross-Session Context Leakage</option>
                <option value="restricted_team_info">Restricted Team Info Exfiltration</option>
                <option value="untrusted_document_instructions">Untrusted Document Directives</option>
              </select>
            </div>
          </div>

          {/* Model Adapter */}
          <div>
            <label className="text-slate-400 text-[11px] block mb-1 font-semibold">Target Model Adapter</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
              <label
                className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${
                  modelAdapter === 'deterministic_sandboxed'
                    ? 'border-purple-500/50 bg-purple-950/20 text-purple-200'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="adapter"
                  className="mt-0.5"
                  disabled={loading}
                  checked={modelAdapter === 'deterministic_sandboxed'}
                  onChange={() => setModelAdapter('deterministic_sandboxed')}
                />
                <div>
                  <span className="font-semibold block text-[11px]">Deterministic Sandboxed Adapter</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                    Safe reproducible simulation with synthetic canary detection. (Clearly labeled as simulated).
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${
                  modelAdapter === 'gemini'
                    ? 'border-cyan-500/50 bg-cyan-950/20 text-cyan-200'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="adapter"
                  className="mt-0.5"
                  disabled={loading}
                  checked={modelAdapter === 'gemini'}
                  onChange={() => setModelAdapter('gemini')}
                />
                <div>
                  <span className="font-semibold block text-[11px]">Gemini 2.5 Flash</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                    Live target model inference via @google/genai SDK.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Payload */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400 text-[11px]">Adversarial Prompt Payload</label>
              <span className="text-[10px] text-slate-500">{customPayload.length} chars</span>
            </div>
            <textarea
              rows={3}
              value={customPayload}
              disabled={loading}
              onChange={(e) => {
                setCustomPayload(e.target.value);
                if (validationErrors.payload) setValidationErrors((prev) => ({ ...prev, payload: undefined }));
              }}
              placeholder="Enter adversarial prompt or select a preset above..."
              className={`w-full bg-slate-950 border rounded p-2.5 text-slate-200 font-mono text-xs focus:outline-none resize-none transition-colors ${
                validationErrors.payload ? 'border-rose-500 bg-rose-950/20' : 'border-slate-800 focus:border-cyan-500'
              }`}
            />
            {validationErrors.payload && (
              <span className="text-rose-400 text-[10px] mt-0.5 block">{validationErrors.payload}</span>
            )}
          </div>

          {/* Loading Indicator Card */}
          {loading && (
            <div className="p-4 rounded-xl border border-cyan-500/40 bg-cyan-950/30 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
              <div>
                <span className="font-bold text-slate-200 text-xs block">DISPATCHING TEST TO GATEWAY...</span>
                <span className="text-cyan-300 text-[11px] animate-pulse">{loadingStage || 'Processing...'}</span>
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500 text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-xs">Test Execution Error</span>
                <p className="text-[11px] text-rose-300 mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Execution Result Card */}
          {result && (
            <div
              ref={resultContainerRef}
              className="p-4 rounded-xl border border-slate-700 bg-slate-950/90 space-y-3 shadow-lg"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-bold text-xs">ACTUAL TEST RESULT:</span>
                  <StatusBadge status={result.enforcementResult} />
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>{new Date(result.timestamp).toLocaleTimeString()} ({result.durationMs}ms)</span>
                </div>
              </div>

              {/* Simulated vs Live Labeling (Requirement #8) */}
              {result.isSimulated || modelAdapter === 'deterministic_sandboxed' ? (
                <div className="px-2.5 py-1.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300 flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    SIMULATED ADAPTER: Deterministic Sandboxed Model
                  </span>
                  <span className="text-purple-400/80">Offline Reproducible</span>
                </div>
              ) : (
                <div className="px-2.5 py-1.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    LIVE LLM ADAPTER: Gemini 2.5 Flash
                  </span>
                  <span className="text-cyan-400/80">Live Inference</span>
                </div>
              )}

              {/* Disposition Details */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Policy Evaluated:</span>
                  <span className="font-bold text-cyan-300 truncate block">{result.policyEvaluated}</span>
                </div>

                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Detection Signature:</span>
                  <span className={result.detectionResult ? 'font-bold text-amber-400 block' : 'font-bold text-emerald-400 block'}>
                    {result.detectionResult ? 'ADVERSARIAL DETECTED' : 'CLEAN / SAFE'}
                  </span>
                </div>
              </div>

              {/* Evidence Text */}
              <div>
                <span className="text-slate-400 text-[10px] font-semibold block mb-0.5">Verified Evidence:</span>
                <div className="p-2.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[11px] leading-relaxed">
                  {result.evidence}
                </div>
              </div>

              {/* Model Output (if available) */}
              {result.modelResponse && (
                <div>
                  <span className="text-slate-400 text-[10px] font-semibold block mb-0.5">Model Response:</span>
                  <div className="p-2.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[11px] whitespace-pre-wrap max-h-28 overflow-y-auto">
                    {result.modelResponse}
                  </div>
                </div>
              )}

              {/* Residual Risk */}
              <div className="text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800 flex items-center justify-between">
                <span><strong className="text-amber-400">Residual Risk:</strong> {result.residualRisk}</span>
                <span className="text-slate-500">Committed to SHA-256 Ledger</span>
              </div>

              {/* Deep Links to Attack Replay and Audit Forensics (Requirement #5) */}
              {onNavigateToTab && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Added to Replay & Audit
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigateToTab('attack_replay')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 text-[10px] transition-colors"
                    >
                      <History className="w-3 h-3" />
                      <span>View in Replay</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateToTab('audit_forensics')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 text-[10px] transition-colors"
                    >
                      <FileCheck2 className="w-3 h-3" />
                      <span>Inspect in Audit</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Dispatch Test button */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800 bg-slate-950">
          <span className="text-[10px] text-slate-500">
            {result ? 'Test executed & logged.' : 'Ready to evaluate.'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleRun}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold disabled:opacity-50 transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Dispatch Test</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
