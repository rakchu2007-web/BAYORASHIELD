import React from 'react';
import {
  FileCode,
  Shield,
  Layers,
  CheckCircle,
  AlertTriangle,
  Info,
  Sliders,
  Terminal
} from 'lucide-react';
import { api } from '../services/api.ts';
import { SecurityPolicy } from '../types/security.ts';
import { SeverityBadge } from '../components/common/Badge.tsx';

interface SecurityPoliciesPageProps {
  policies: SecurityPolicy[];
  onPolicyUpdated: () => void;
}

export const SecurityPoliciesPage: React.FC<SecurityPoliciesPageProps> = ({
  policies,
  onPolicyUpdated
}) => {
  const handleToggleMode = async (policy: SecurityPolicy, newMode: 'BLOCK' | 'LOG_ONLY' | 'DISABLED') => {
    try {
      await api.togglePolicy(policy.id, newMode !== 'DISABLED', newMode);
      onPolicyUpdated();
    } catch (err) {
      console.error('Failed to toggle policy mode:', err);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner */}
      <div className="p-5 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-950 via-[#0a101f] to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-400">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 font-mono tracking-wide">
                FORMAL SECURITY POLICIES & GUARDRAIL SPECIFICATIONS
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 text-slate-300">
                ACTIVE HEURISTICS
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Documented AI safety policies POL-AI-01 through POL-AI-06 governing prompt injection, instruction overrides, cross-tenant isolation, and honeytokens.
            </p>
          </div>
        </div>
      </div>

      {/* Policy Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policies.map((policy) => (
          <div
            key={policy.id}
            className="p-5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3.5 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cyan-300 text-sm">{policy.id}</span>
                  <SeverityBadge severity={policy.severity} />
                </div>

                {/* Mode Selector Buttons */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded border border-slate-800">
                  <button
                    onClick={() => handleToggleMode(policy, 'BLOCK')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      policy.enforcementMode === 'BLOCK'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/50 shadow-sm'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    BLOCK
                  </button>
                  <button
                    onClick={() => handleToggleMode(policy, 'LOG_ONLY')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      policy.enforcementMode === 'LOG_ONLY'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/50 shadow-sm'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    LOG ONLY
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-slate-200 text-xs">{policy.name}</h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">{policy.description}</p>

              {/* Inspection Patterns */}
              <div className="p-3 rounded bg-slate-900/90 border border-slate-800 space-y-1.5">
                <span className="text-slate-500 text-[10px] block font-semibold">
                  Inspection Signatures ({policy.regexPatterns.length} Patterns):
                </span>
                <div className="space-y-1">
                  {policy.regexPatterns.map((pat, i) => (
                    <div key={i} className="flex items-center gap-1 text-[10px]">
                      <Terminal className="w-3 h-3 text-cyan-500 shrink-0" />
                      <code className="text-cyan-300 truncate">{pat}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
              <span className="text-slate-300 font-semibold">Violation Action: </span>
              {policy.actionOnViolation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
