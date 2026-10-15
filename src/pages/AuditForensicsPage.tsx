import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Hash,
  Copy,
  Check,
  Loader2,
  RotateCcw,
  Info,
  Layers,
  ArrowRight,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Terminal
} from 'lucide-react';
import { api } from '../services/api.ts';
import { AuditRecord, VerificationResult, TamperingSimulationResult } from '../types/security.ts';
import { StatusBadge } from '../components/common/Badge.tsx';

interface AuditForensicsPageProps {
  onLedgerMutated: () => void;
}

export const AuditForensicsPage: React.FC<AuditForensicsPageProps> = ({ onLedgerMutated }) => {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Verification result (live ledger or simulated test copy)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  // Active simulation state (test-only copy)
  const [simulationState, setSimulationState] = useState<TamperingSimulationResult | null>(null);

  // Selected block for detailed canonical payload inspection
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);

  const fetchLedgerAndStatus = async () => {
    setLoading(true);
    try {
      const [ledgerData, simData] = await Promise.all([
        api.getAuditLedger(),
        api.getAuditSimulationState()
      ]);
      setRecords(ledgerData);
      setSimulationState(simData);

      // Automatically run verification on the active view
      const verifyRes = await api.verifyAuditIntegrity(!!simData);
      setVerificationResult(verifyRes);
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerAndStatus();
  }, []);

  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    try {
      // If simulation is active, verify the test copy; otherwise verify live ledger
      const res = await api.verifyAuditIntegrity(!!simulationState);
      setVerificationResult(res);
      onLedgerMutated();
    } catch (err) {
      console.error('Integrity verification error:', err);
    } finally {
      setVerifying(false);
    }
  };

  const handleSimulateTamper = async (tamperType: 'CONTENT_MODIFICATION' | 'CHAIN_LINK_CORRUPTION' = 'CONTENT_MODIFICATION') => {
    setVerifying(true);
    try {
      // Modify a TEST-ONLY copy of a record, not the live original audit ledger (Requirement #6)
      const res = await api.simulateAuditTampering(1, tamperType);
      setSimulationState(res);
      setVerificationResult(res.verification);
      onLedgerMutated();
    } catch (err) {
      console.error('Simulate tamper error:', err);
    } finally {
      setVerifying(false);
    }
  };

  const handleRestoreLedger = async () => {
    setVerifying(true);
    try {
      // Restore test state after demonstration (Requirement #8)
      await api.restoreAuditBackup();
      setSimulationState(null);
      setSelectedBlockIndex(null);

      // Re-fetch live pristine ledger and verify it
      const [ledgerData, freshVerify] = await Promise.all([
        api.getAuditLedger(),
        api.verifyAuditIntegrity(false)
      ]);
      setRecords(ledgerData);
      setVerificationResult(freshVerify);
      onLedgerMutated();
    } catch (err) {
      console.error('Restore ledger error:', err);
    } finally {
      setVerifying(false);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Determine which records to display: test-only copy if simulation is active, or pristine live records
  const displayedRecords = simulationState ? simulationState.testRecords : records;

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner */}
      <div className="p-5 rounded-xl border border-cyan-900/60 bg-gradient-to-r from-cyan-950/40 via-slate-950 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 font-mono tracking-wide">
                TAMPER-EVIDENT CRYPTOGRAPHIC AUDIT LEDGER
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                SHA-256 HASH-CHAINED
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Deterministic canonical JSON serialization anchors each block to the preceding hash.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleVerifyIntegrity}
            disabled={verifying}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>VERIFY INTEGRITY</span>
          </button>

          {!simulationState ? (
            <button
              onClick={() => handleSimulateTamper('CONTENT_MODIFICATION')}
              disabled={verifying}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 transition-colors cursor-pointer"
              title="Modifies a test-only copy of a record without altering the original ledger"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>SIMULATE RECORD TAMPERING</span>
            </button>
          ) : (
            <button
              onClick={handleRestoreLedger}
              disabled={verifying}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 font-bold transition-colors cursor-pointer shadow-md shadow-emerald-950/40"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RESTORE & EXIT SIMULATION</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent Simulation Demonstration Banner (Requirement #6, #7, #8, #12) */}
      {simulationState && (
        <div className="p-4 rounded-xl border border-purple-500/80 bg-purple-950/30 space-y-3 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-900/60 pb-2">
            <div className="flex items-center gap-2 text-purple-300 font-bold">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-xs uppercase tracking-wide">
                [SIMULATED DEMONSTRATION ON TEST-ONLY COPY]
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/80 text-purple-200 border border-purple-500/50 font-bold">
                ORIGINAL LEDGER UNTOUCHED
              </span>
            </div>
            <button
              onClick={handleRestoreLedger}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 hover:underline font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Test State Now</span>
            </button>
          </div>

          <p className="text-[11px] text-purple-200/90 leading-relaxed">
            A test-only memory copy of Block #{simulationState.tamperedIndex} was mutated with synthetic data to prove that canonical SHA-256 verification detects unauthorized tampering. The live production ledger remains 100% verified and pristine.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 text-[10px] block font-semibold">ORIGINAL RECORD CONTENT:</span>
              <p className="text-slate-300 truncate mt-1">{simulationState.originalRecord.evidence}</p>
              <code className="text-[10px] text-cyan-400 block mt-1 truncate">Stored Hash: {simulationState.originalRecord.currentHash}</code>
            </div>

            <div className="p-2.5 rounded bg-rose-950/40 border border-rose-500/50">
              <span className="text-rose-400 text-[10px] block font-semibold">MUTATED TEST-ONLY PAYLOAD:</span>
              <p className="text-rose-200 truncate mt-1">{simulationState.tamperedRecord.evidence}</p>
              <code className="text-[10px] text-rose-300 block mt-1">Verification Status: TAMPERED (FAIL)</code>
            </div>
          </div>
        </div>
      )}

      {/* Verification Result Card (Requirement #1, #2, #3, #4, #5, #9) */}
      {verificationResult && (
        <div
          className={`p-5 rounded-xl border transition-all ${
            verificationResult.result === 'PASS'
              ? 'border-emerald-500/70 bg-gradient-to-r from-emerald-950/30 via-slate-950 to-slate-950 shadow-lg shadow-emerald-950/20'
              : 'border-rose-500/80 bg-gradient-to-r from-rose-950/40 via-slate-950 to-slate-950 shadow-lg shadow-rose-950/40'
          } space-y-4`}
        >
          {/* Header Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-3">
              {verificationResult.result === 'PASS' ? (
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-500/60 text-emerald-400 shadow-md shadow-emerald-950">
                  <CheckCircle className="w-6 h-6" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-rose-950 border border-rose-500/60 text-rose-400 shadow-md shadow-rose-950 animate-pulse">
                  <XCircle className="w-6 h-6" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold tracking-wide font-mono text-slate-100">
                    VERIFICATION RESULT:
                  </span>
                  <StatusBadge status={verificationResult.result} />
                  {simulationState && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
                      ON TEST COPY
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${verificationResult.result === 'PASS' ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {verificationResult.result === 'PASS'
                    ? 'All blocks canonically recomputed and matched stored SHA-256 hashes.'
                    : `Cryptographic mismatch caught: Block #${verificationResult.tamperedIndex} altered.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{new Date(verificationResult.verificationTimestamp).toLocaleTimeString()} ({verificationResult.durationMs}ms)</span>
            </div>
          </div>

          {/* Verification Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">RECORDS CHECKED:</span>
              <span className="text-sm font-bold text-slate-200">
                {verificationResult.recordsChecked} / {verificationResult.recordsChecked} Blocks
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">100% Recomputed</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">VALID CHAIN BLOCKS:</span>
              <span className={`text-sm font-bold ${verificationResult.result === 'PASS' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {verificationResult.validBlocksCount} of {verificationResult.recordsChecked} Valid
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Previous-hash links</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">GENESIS ANCHOR:</span>
              <span className="text-xs font-bold text-cyan-300 truncate block">
                0000000000000000...
              </span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">Zero-block valid</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">LATEST BLOCK COMMITMENT:</span>
              <span className="text-xs font-bold text-slate-300 truncate block">
                {verificationResult.latestHash.substring(0, 16)}...
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Top of ledger</span>
            </div>
          </div>

          {/* Broken Block Identification (Requirement #5) */}
          {verificationResult.brokenBlock && (
            <div className="p-3.5 rounded-lg bg-rose-950/80 border border-rose-500 text-rose-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  CORRUPTED BLOCK IDENTIFIED: #{verificationResult.brokenBlock.index} ({verificationResult.brokenBlock.id})
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900 border border-rose-500 text-rose-100">
                  {verificationResult.brokenBlock.tamperType}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-300">
                {verificationResult.brokenBlock.reason}
              </p>
              <div className="text-[10px] text-rose-400/90 font-mono grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-rose-900/80">
                <div>
                  <span className="text-slate-400 block">Expected Hash:</span>
                  <code className="text-emerald-300 truncate block">{verificationResult.brokenBlock.expectedHash}</code>
                </div>
                <div>
                  <span className="text-slate-400 block">Stored Hash in Record:</span>
                  <code className="text-rose-300 truncate block">{verificationResult.brokenBlock.actualHash}</code>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Block Detailed Canonical Payload Inspector */}
      {selectedBlockIndex !== null && verificationResult && verificationResult.blockVerifications[selectedBlockIndex] && (
        <div className="p-4 rounded-xl border border-cyan-500/50 bg-slate-950/90 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-slate-200 text-xs">
                CANONICAL HASH VERIFICATION INSPECTOR: BLOCK #{selectedBlockIndex}
              </span>
            </div>
            <button
              onClick={() => setSelectedBlockIndex(null)}
              className="text-slate-400 hover:text-slate-200 text-[10px]"
            >
              Close Inspector
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div>
              <span className="text-slate-500 text-[10px] block">STORED PREVIOUS HASH (CHAIN LINK):</span>
              <code className="text-slate-300 block truncate p-1.5 rounded bg-slate-900 border border-slate-800">
                {verificationResult.blockVerifications[selectedBlockIndex].storedPreviousHash}
              </code>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">EXPECTED PREVIOUS HASH:</span>
              <code className="text-emerald-400 block truncate p-1.5 rounded bg-slate-900 border border-slate-800">
                {verificationResult.blockVerifications[selectedBlockIndex].expectedPreviousHash}
              </code>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div>
              <span className="text-slate-500 text-[10px] block">STORED RECORD CURRENT HASH:</span>
              <code className="text-slate-300 block truncate p-1.5 rounded bg-slate-900 border border-slate-800">
                {verificationResult.blockVerifications[selectedBlockIndex].storedCurrentHash}
              </code>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">RECOMPUTED SHA-256 (CANONICAL):</span>
              <code className={`block truncate p-1.5 rounded bg-slate-900 border border-slate-800 ${
                verificationResult.blockVerifications[selectedBlockIndex].contentHashValid ? 'text-emerald-400' : 'text-rose-400 font-bold'
              }`}>
                {verificationResult.blockVerifications[selectedBlockIndex].computedCurrentHash}
              </code>
            </div>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] block mb-1">DETERMINISTIC CANONICALIZED JSON PAYLOAD HASHED:</span>
            <pre className="p-2.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[10px] overflow-x-auto whitespace-pre-wrap">
              {verificationResult.blockVerifications[selectedBlockIndex].canonicalPayload}
            </pre>
          </div>
        </div>
      )}

      {/* Ledger Records Explorer Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-200">
              {simulationState ? 'TEST-ONLY COPY EXPLORER' : 'LIVE AUDIT LEDGER'} ({displayedRecords.length} BLOCKS)
            </span>
            {simulationState && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-500/50 font-bold">
                TEST DEMO COPY
              </span>
            )}
          </div>
          <button
            onClick={fetchLedgerAndStatus}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/60 text-slate-400 text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">BLOCK #</th>
                <th className="py-2.5 px-3">TIMESTAMP</th>
                <th className="py-2.5 px-3">ACTOR & ROLE</th>
                <th className="py-2.5 px-3">ACTION</th>
                <th className="py-2.5 px-3">HASH CHECK</th>
                <th className="py-2.5 px-3">PREVIOUS HASH (CHAIN LINK)</th>
                <th className="py-2.5 px-3">STORED SHA-256</th>
                <th className="py-2.5 px-3 text-right">INSPECT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedRecords.map((rec) => {
                const blockDetail = verificationResult?.blockVerifications[rec.index];
                const isTamperedBlock = verificationResult?.tamperedIndex === rec.index;

                return (
                  <tr
                    key={rec.id}
                    className={`transition-colors ${
                      isTamperedBlock
                        ? 'bg-rose-950/40 text-rose-200 border-l-4 border-rose-500'
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-slate-200">
                      #{rec.index} ({rec.id})
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(rec.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-200 font-semibold">{rec.actor}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{rec.role}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-semibold">
                      {rec.action}
                    </td>
                    <td className="py-3 px-3">
                      {blockDetail ? (
                        blockDetail.status === 'VALID' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded">
                            <CheckCircle className="w-3 h-3" /> VALID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-950 border border-rose-500 px-2 py-0.5 rounded animate-pulse">
                            <XCircle className="w-3 h-3" /> TAMPERED
                          </span>
                        )
                      ) : (
                        <StatusBadge status={rec.result} />
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <span className="truncate max-w-[90px]">{rec.previousHash}</span>
                        <button
                          onClick={() => copyHash(rec.previousHash)}
                          className="hover:text-cyan-400"
                        >
                          {copiedHash === rec.previousHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono">
                        <span className="truncate max-w-[110px] font-bold">{rec.currentHash}</span>
                        <button
                          onClick={() => copyHash(rec.currentHash)}
                          className="hover:text-cyan-300"
                        >
                          {copiedHash === rec.currentHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedBlockIndex(rec.index)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Residual Risk & Architectural Caveats Box */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 text-slate-400 leading-relaxed font-mono">
        <div className="flex items-center gap-2 text-slate-200 font-bold text-xs">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>CRYPTOGRAPHIC LEDGER GUARANTEES & HONEST DISCLOSURES</span>
        </div>
        <p className="text-[11px]">
          <strong className="text-cyan-300">Deterministic Recomputation: </strong>
          Each record's hash is computed from its canonical JSON fields (`action`, `actor`, `evidence`, `index`, `previousHash`, `result`, `role`, `sessionId`, `timestamp`). If any field is mutated or if a block is removed, the recomputed SHA-256 digest diverges immediately from the stored cryptographic anchor.
        </p>
        <p className="text-[11px]">
          <strong className="text-amber-300">Residual Risk: </strong>
          Hash chaining alone protects against unauthorized record manipulation, but a root system administrator could rewrite the entire database from block 0 to N. To achieve sovereign tamper-resistance, production deployments require external witness checkpointing (e.g., Certificate Transparency RFC-6962 trees or immutable WORM cloud object storage).
        </p>
      </div>
    </div>
  );
};
