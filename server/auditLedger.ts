import crypto from 'node:crypto';
import {
  AuditRecord,
  BlockVerificationDetail,
  EnforcementResult,
  Role,
  TamperingSimulationResult,
  VerificationResult
} from '../src/types/security.ts';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Deterministic canonical JSON representation.
 * Keys sorted alphabetically, no insignificant whitespace.
 */
export function canonicalize(obj: Record<string, unknown>): string {
  const sortedKeys = Object.keys(obj).sort();
  const sortedObj: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    sortedObj[key] = obj[key];
  }
  return JSON.stringify(sortedObj);
}

export function computeRecordHash(
  index: number,
  timestamp: string,
  actor: string,
  role: Role,
  action: string,
  sessionId: string,
  result: EnforcementResult,
  evidence: string,
  previousHash: string
): string {
  const canonicalData = canonicalize({
    action,
    actor,
    evidence,
    index,
    previousHash,
    result,
    role,
    sessionId,
    timestamp
  });

  return crypto.createHash('sha256').update(canonicalData).digest('hex');
}

/**
 * Recomputes and verifies the complete SHA-256 hash chain across an array of audit records.
 * Recomputes canonical hash for every block and compares with stored hash.
 * Verifies each previous-hash link.
 */
export function verifyChain(records: AuditRecord[], isSimulatedCopy = false): VerificationResult {
  const startTime = Date.now();
  const blockVerifications: BlockVerificationDetail[] = [];
  let tamperedIndex: number | null = null;
  let brokenBlock: VerificationResult['brokenBlock'] = undefined;
  let validBlocksCount = 0;

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const expectedPrevHash = i === 0 ? GENESIS_HASH : records[i - 1].currentHash;
    const prevHashValid = rec.previousHash === expectedPrevHash;

    const canonicalData = canonicalize({
      action: rec.action,
      actor: rec.actor,
      evidence: rec.evidence,
      index: rec.index,
      previousHash: rec.previousHash,
      result: rec.result,
      role: rec.role,
      sessionId: rec.sessionId,
      timestamp: rec.timestamp
    });

    const computedCurrentHash = crypto.createHash('sha256').update(canonicalData).digest('hex');
    const contentHashValid = rec.currentHash === computedCurrentHash;

    let status: 'VALID' | 'TAMPERED_CONTENT' | 'BROKEN_LINK' = 'VALID';
    let errorDetails: string | undefined = undefined;

    if (!prevHashValid) {
      status = 'BROKEN_LINK';
      errorDetails = `Broken hash chain link: record.previousHash does not match Block #${i - 1} currentHash. Expected ${expectedPrevHash.substring(0, 16)}..., found ${rec.previousHash.substring(0, 16)}...`;
      if (tamperedIndex === null) {
        tamperedIndex = i;
        brokenBlock = {
          index: i,
          id: rec.id,
          expectedHash: expectedPrevHash,
          actualHash: rec.previousHash,
          reason: errorDetails,
          tamperType: 'CHAIN_LINK_CORRUPTION'
        };
      }
    } else if (!contentHashValid) {
      status = 'TAMPERED_CONTENT';
      errorDetails = `Cryptographic payload mismatch: Recomputed SHA-256 (${computedCurrentHash.substring(0, 16)}...) != Stored Hash (${rec.currentHash.substring(0, 16)}...). Canonical payload was modified after hash commitment!`;
      if (tamperedIndex === null) {
        tamperedIndex = i;
        brokenBlock = {
          index: i,
          id: rec.id,
          expectedHash: computedCurrentHash,
          actualHash: rec.currentHash,
          reason: errorDetails,
          tamperType: 'CONTENT_MODIFICATION'
        };
      }
    } else {
      validBlocksCount++;
    }

    blockVerifications.push({
      index: rec.index,
      id: rec.id,
      timestamp: rec.timestamp,
      actor: rec.actor,
      action: rec.action,
      storedPreviousHash: rec.previousHash,
      expectedPreviousHash: expectedPrevHash,
      previousHashValid: prevHashValid,
      storedCurrentHash: rec.currentHash,
      computedCurrentHash,
      contentHashValid: contentHashValid,
      status,
      errorDetails,
      canonicalPayload: canonicalData
    });
  }

  const isValid = tamperedIndex === null;

  return {
    result: isValid ? 'PASS' : 'FAIL',
    isValid,
    recordsChecked: records.length,
    validBlocksCount,
    tamperedIndex,
    brokenBlock,
    blockVerifications,
    verificationTimestamp: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    genesisHash: records[0]?.currentHash || GENESIS_HASH,
    latestHash: records[records.length - 1]?.currentHash || GENESIS_HASH,
    isSimulatedCopy
  };
}

export class AuditLedger {
  // Live, pristine production ledger
  private records: AuditRecord[] = [];
  
  // Test-only simulation state (preserves live ledger untouched)
  private activeTestSimulation: TamperingSimulationResult | null = null;

  constructor() {
    this.initGenesis();
  }

  private initGenesis() {
    const genesisTime = new Date(Date.now() - 3600000 * 2).toISOString();
    const genesisHash = computeRecordHash(
      0,
      genesisTime,
      'System Kernel',
      'judge_auditor',
      'LEDGER_GENESIS_INITIALIZED',
      'session-sys-init',
      'ALLOWED',
      'BayoraShield SHA-256 Tamper-Evident Ledger initialized with zero-block anchor.',
      GENESIS_HASH
    );

    const genesisRecord: AuditRecord = {
      id: 'AUD-0000',
      index: 0,
      timestamp: genesisTime,
      actor: 'System Kernel',
      role: 'judge_auditor',
      action: 'LEDGER_GENESIS_INITIALIZED',
      sessionId: 'session-sys-init',
      result: 'ALLOWED',
      evidence: 'BayoraShield SHA-256 Tamper-Evident Ledger initialized with zero-block anchor.',
      previousHash: GENESIS_HASH,
      currentHash: genesisHash
    };

    this.records = [genesisRecord];
  }

  public recordEvent(
    actor: string,
    role: Role,
    action: string,
    sessionId: string,
    result: EnforcementResult,
    evidence: string
  ): AuditRecord {
    const index = this.records.length;
    const previousRecord = this.records[index - 1];
    const previousHash = previousRecord ? previousRecord.currentHash : GENESIS_HASH;
    const timestamp = new Date().toISOString();
    const id = `AUD-${String(index).padStart(4, '0')}`;

    const currentHash = computeRecordHash(
      index,
      timestamp,
      actor,
      role,
      action,
      sessionId,
      result,
      evidence,
      previousHash
    );

    const record: AuditRecord = {
      id,
      index,
      timestamp,
      actor,
      role,
      action,
      sessionId,
      result,
      evidence,
      previousHash,
      currentHash
    };

    this.records.push(record);
    return record;
  }

  public getAll(): AuditRecord[] {
    return [...this.records];
  }

  public getStatus(): {
    totalRecords: number;
    isValid: boolean;
    result: 'PASS' | 'FAIL';
    tamperedIndex: number | null;
    isSimulatedTamperActive: boolean;
    latestHash: string;
    genesisHash: string;
    brokenBlockDetails?: {
      index: number;
      expectedHash: string;
      actualHash: string;
      reason: string;
    };
  } {
    const verification = this.verifyIntegrity();
    return {
      totalRecords: this.records.length,
      isValid: verification.isValid,
      result: verification.result,
      tamperedIndex: verification.tamperedIndex,
      isSimulatedTamperActive: this.activeTestSimulation !== null,
      latestHash: this.records[this.records.length - 1]?.currentHash || GENESIS_HASH,
      genesisHash: this.records[0]?.currentHash || GENESIS_HASH,
      brokenBlockDetails: verification.brokenBlock
    };
  }

  public verifyIntegrity(): VerificationResult {
    // Verifies live records with complete cryptographic recomputation
    return verifyChain(this.records, false);
  }

  /**
   * Controlled audit tampering demonstration on a TEST-ONLY COPY:
   * Leaves this.records untouched.
   * Clones records, modifies the test copy, verifies the test copy, and returns proof.
   */
  public simulateTampering(
    targetIndex?: number,
    tamperType: 'CONTENT_MODIFICATION' | 'CHAIN_LINK_CORRUPTION' = 'CONTENT_MODIFICATION'
  ): TamperingSimulationResult {
    // 1. Create a test-only deep copy of the records
    const testCopy: AuditRecord[] = JSON.parse(JSON.stringify(this.records));

    // 2. Select target index (prefer block 1 or later to leave genesis alone if multiple exist)
    const idx = targetIndex !== undefined && targetIndex >= 0 && targetIndex < testCopy.length
      ? targetIndex
      : testCopy.length > 1 ? 1 : 0;

    const originalRecord: AuditRecord = JSON.parse(JSON.stringify(testCopy[idx]));
    const target = testCopy[idx];

    // 3. Mutate the test-only copy
    if (tamperType === 'CHAIN_LINK_CORRUPTION') {
      target.previousHash = 'ba90000000000000000000000000000000000000000000000000000000000000';
    } else {
      target.evidence = `[MALICIOUS MUTATION ON TEST COPY]: ${target.evidence} -- MODIFIED BY ADVERSARY`;
    }

    const tamperedRecord: AuditRecord = JSON.parse(JSON.stringify(target));

    // 4. Verify the test-only copy
    const verification = verifyChain(testCopy, true);

    const simulationResult: TamperingSimulationResult = {
      isSimulated: true,
      simulatedTarget: `Test-Only Copy Block #${idx} (${target.id})`,
      tamperedIndex: idx,
      tamperType,
      originalRecord,
      tamperedRecord,
      verification,
      testRecords: testCopy
    };

    this.activeTestSimulation = simulationResult;
    return simulationResult;
  }

  public getActiveSimulation(): TamperingSimulationResult | null {
    return this.activeTestSimulation;
  }

  public restoreFromBackup(): { success: boolean; restoredCount: number; message: string } {
    this.activeTestSimulation = null;
    return {
      success: true,
      restoredCount: this.records.length,
      message: 'Test simulation state cleared. Live ledger remains 100% verified and pristine.'
    };
  }
}

export const auditLedgerInstance = new AuditLedger();
