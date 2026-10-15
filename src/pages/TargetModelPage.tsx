import React, { useState } from 'react';
import {
  Cpu,
  Zap,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Loader2,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api.ts';
import { SecurityTestRecord, TestCategory } from '../types/security.ts';
import { StatusBadge } from '../components/common/Badge.tsx';

interface TargetModelPageProps {
  activeSessionId: string;
  onTestExecuted: (record: SecurityTestRecord) => void;
}

export const TargetModelPage: React.FC<TargetModelPageProps> = ({
  activeSessionId,
  onTestExecuted
}) => {
  const [prompt, setPrompt] = useState('Explain the difference between input sanitization and output token guardrails.');
  const [category, setCategory] = useState<TestCategory>('direct_prompt_injection');
  const [adapter, setAdapter] = useState<'deterministic_sandboxed' | 'gemini'>('deterministic_sandboxed');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<SecurityTestRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!prompt.trim()) {
      setError('Prompt cannot be empty.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.executeTest({
        sessionId: activeSessionId,
        category,
        title: `Target Model Evaluation (${category})`,
        payload: prompt.trim(),
        modelAdapter: adapter
      });
      setTestResult(res);
      onTestExecuted(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Model Test Failed: ${msg}`);
      console.error('Target model test error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner */}
      <div className="p-5 rounded-xl border border-cyan-900/60 bg-gradient-to-r from-cyan-950/40 via-slate-950 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 font-mono tracking-wide">
                TARGET MODEL SAFETY & EVALUATION BENCH
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                MULTI-STAGE INTERCEPT
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Submit adversarial or baseline prompts to inspect target model behavior, pre-execution filters, and post-generation canary leak inspection.
            </p>
          </div>
        </div>
      </div>

      {/* Input Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200">PROMPT SUBMISSION</span>
              <span className="text-[10px] text-slate-500">Target Session: {activeSessionId}</span>
            </div>

            {/* Category */}
            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Evaluation Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TestCategory)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="direct_prompt_injection">Direct Prompt Injection</option>
                <option value="instruction_override">Instruction Override</option>
                <option value="unauthorized_access">Unauthorized Access</option>
                <option value="cross_session_leakage">Cross-Session Context Leakage</option>
                <option value="restricted_team_info">Restricted Team Info Exfiltration</option>
                <option value="untrusted_document_instructions">Untrusted Document Instructions</option>
              </select>
            </div>

            {/* Adapter Selector */}
            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Model Adapter</label>
              <div className="space-y-1.5 p-2.5 rounded bg-slate-900 border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="adapter"
                    checked={adapter === 'deterministic_sandboxed'}
                    onChange={() => setAdapter('deterministic_sandboxed')}
                  />
                  <span>Deterministic Sandboxed Adapter (Reproducible offline evaluation)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="adapter"
                    checked={adapter === 'gemini'}
                    onChange={() => setAdapter('gemini')}
                  />
                  <span>Gemini 2.5 Flash (via @google/genai SDK)</span>
                </label>
              </div>
            </div>

            {/* Prompt Text */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-400 text-[11px]">Prompt Input</label>
                <span className="text-[10px] text-slate-500">{prompt.length} chars</span>
              </div>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded bg-rose-950/80 border border-rose-500 text-rose-200 text-xs">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleTest}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                <span>{loading ? 'Evaluating Pipeline...' : 'Submit to Model Pipeline'}</span>
              </button>
            </div>
          </div>

          {/* Evaluation Criteria & Known Limitations */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-200 font-bold text-xs">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>EVALUATION CRITERIA & LIMITATIONS</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
              <li>Keyword and regex filters stop known heuristic jailbreak templates, but cannot guarantee protection against zero-shot semantic evasion without multi-agent verification.</li>
              <li>Post-generation output inspection scans for synthetic honeytokens (<code className="text-cyan-300">BAYORA_CANARY_*</code>) to prove whether context boundaries were penetrated.</li>
              <li>A non-detection is NOT proof of safety; tests marked <strong className="text-emerald-400">ALLOWED</strong> simply passed current operational policies.</li>
            </ul>
          </div>
        </div>

        {/* Response & Safety Evaluation Inspector */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200">SAFETY EVALUATION OUTPUT</span>
              {testResult && <StatusBadge status={testResult.enforcementResult} />}
            </div>

            {testResult ? (
              <div className="space-y-3">
                {/* Simulated vs Live Label */}
                {testResult.isSimulated || adapter === 'deterministic_sandboxed' ? (
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
                <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Policy Evaluated:</span>
                    <span className="text-cyan-400 font-bold">{testResult.policyEvaluated}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Detection Result:</span>
                    <span className={testResult.detectionResult ? 'text-amber-400' : 'text-emerald-400 font-bold'}>
                      {testResult.detectionResult ? 'ADVERSARIAL MATCH' : 'PASSED (CLEAN)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Gateway Action:</span>
                    <span className="text-rose-400 font-bold">{testResult.enforcementResult}</span>
                  </div>
                </div>

                {/* Model Text Output */}
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Target Model Raw Output:</span>
                  <div className="p-3 rounded bg-slate-900 text-slate-200 border border-slate-800 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                    {testResult.modelResponse || '[Request was blocked by upstream gateway prior to model invocation]'}
                  </div>
                </div>

                {/* Evidence */}
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Evidence & Verification:</span>
                  <div className="p-2.5 rounded bg-slate-900/70 text-slate-300 border border-slate-800 text-[11px]">
                    {testResult.evidence}
                  </div>
                </div>

                {/* Residual Risk */}
                <div className="text-[11px] text-slate-400 bg-slate-900/40 p-2.5 rounded border border-slate-800">
                  <span className="text-amber-400 font-semibold">Residual Risk: </span>
                  {testResult.residualRisk}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <p>No model evaluation executed in this session view yet.</p>
                <p className="text-[10px]">Submit a prompt on the left to inspect the multi-tier security pipeline.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
