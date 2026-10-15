import React, { useState, useEffect } from 'react';
import {
  History,
  Play,
  Pause,
  RotateCcw,
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Layers,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { SecurityTestRecord, TestEvent } from '../types/security.ts';
import { StatusBadge } from '../components/common/Badge.tsx';

interface AttackReplayPageProps {
  testHistory: SecurityTestRecord[];
}

export const AttackReplayPage: React.FC<AttackReplayPageProps> = ({ testHistory }) => {
  const [selectedTestId, setSelectedTestId] = useState<string>(testHistory[0]?.id || '');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const selectedTest = testHistory.find((t) => t.id === selectedTestId) || testHistory[0];
  const events: TestEvent[] = selectedTest?.events || [];

  // Playback timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= events.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, events.length]);

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setIsPlaying(true);
  };

  const handleExportReport = () => {
    if (!selectedTest) return;
    const report = {
      reportType: 'BAYORASHIELD_ATTACK_REPLAY_AUDIT_REPORT',
      exportedAt: new Date().toISOString(),
      testRecord: selectedTest,
      timelineEvents: events
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bayorashield-test-replay-${selectedTest.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!selectedTest) {
    return (
      <div className="p-12 text-center font-mono text-slate-500 text-xs">
        No completed test executions available to replay. Execute a test in Red Team Lab first.
      </div>
    );
  }

  const activeEvent = events[currentStepIndex] || events[0];

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner */}
      <div className="p-5 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-950 via-[#0a0f1d] to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 font-mono tracking-wide">
                VISUAL ATTACK REPLAY & EVENT SCRUBBER
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 text-slate-300">
                FRAME-BY-FRAME
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Inspect multi-stage request lifecycles from initial ingress, RBAC auth, pre-execution filters, model inference, to SHA-256 audit commitment.
            </p>
          </div>
        </div>

        {/* Test Selector & Export */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTestId}
            onChange={(e) => {
              setSelectedTestId(e.target.value);
              setCurrentStepIndex(0);
              setIsPlaying(false);
            }}
            className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 text-xs focus:outline-none cursor-pointer max-w-[200px] truncate"
          >
            {testHistory.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id}: {t.payloadTitle}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Replay Controls & Timeline Scrubber */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20 active:scale-95"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause Replay' : 'Play Timeline'}</span>
            </button>
            <button
              onClick={handleRestart}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>
          </div>

          <div className="text-slate-400 text-[11px]">
            Step {currentStepIndex + 1} of {events.length}
          </div>
        </div>

        {/* Step Track Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {events.map((ev, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isPast = idx < currentStepIndex;
            return (
              <button
                key={idx}
                onClick={() => {
                  setCurrentStepIndex(idx);
                  setIsPlaying(false);
                }}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isCurrent
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950'
                    : isPast
                    ? 'bg-slate-900 border-slate-800 text-slate-300'
                    : 'bg-slate-950 border-slate-900 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold">STEP {ev.step || idx + 1}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    ev.status === 'blocked' ? 'bg-rose-500' : ev.status === 'passed' ? 'bg-emerald-500' : 'bg-cyan-500'
                  }`} />
                </div>
                <div className="text-[11px] font-semibold truncate mt-1">{ev.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{ev.component}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Event Detail Inspector */}
      {activeEvent && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Active Event Box (7 cols) */}
          <div className="lg:col-span-7 p-5 rounded-xl border border-slate-800 bg-slate-950/90 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200 text-sm">{activeEvent.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  activeEvent.status === 'blocked'
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                    : activeEvent.status === 'passed'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                    : 'bg-slate-900 text-slate-300 border border-slate-800'
                }`}>
                  {activeEvent.status.toUpperCase()}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">Component: {activeEvent.component}</span>
            </div>

            <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-slate-400 font-semibold block">Execution Step Details:</span>
              <p className="text-slate-200 text-xs leading-relaxed">{activeEvent.details}</p>
            </div>

            <div className="text-[10px] text-slate-500 flex items-center justify-between">
              <span>Timestamp: {activeEvent.timestamp}</span>
              <span>Sequence Position: {activeEvent.step}</span>
            </div>
          </div>

          {/* Test Metadata & Raw Payload (5 cols) */}
          <div className="lg:col-span-5 p-5 rounded-xl border border-slate-800 bg-slate-950/90 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200">ATTACHED PAYLOAD & EVIDENCE</span>
              <StatusBadge status={selectedTest.enforcementResult} />
            </div>

            <div>
              <span className="text-slate-500 text-[10px] block">Test Title:</span>
              <span className="text-slate-200 font-semibold">{selectedTest.payloadTitle}</span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] block">Submitted Payload:</span>
              <div className="p-2.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[11px] max-h-28 overflow-y-auto">
                {selectedTest.inputPayload}
              </div>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] block">Final Verdict & Evidence:</span>
              <p className="text-slate-300 text-[11px]">{selectedTest.evidence}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
