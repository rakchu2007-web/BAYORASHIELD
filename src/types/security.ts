export type Role = 'red_team' | 'blue_team' | 'judge_auditor';

export interface UserContext {
  role: Role;
  token: string;
  name: string;
  ip: string;
}

export type TestCategory = 
  | 'direct_prompt_injection'
  | 'instruction_override'
  | 'unauthorized_access'
  | 'cross_session_leakage'
  | 'restricted_team_info'
  | 'untrusted_document_instructions';

export type EnforcementResult = 'BLOCKED' | 'DETECTED' | 'ALLOWED' | 'FAILED' | 'SIMULATED';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface SecurityFinding {
  id: string;
  severity: Severity;
  category: TestCategory;
  component: string;
  evidence: string;
  policyId: string;
  actionTaken: EnforcementResult;
  recommendedMitigation: string;
  confidence: number; // 0 to 1
  isSimulated?: boolean;
}

export interface SecurityTestRecord {
  id: string;
  testCategory: TestCategory;
  timestamp: string;
  sessionId: string;
  actorRole: Role;
  payloadTitle: string;
  inputPayload: string;
  policyEvaluated: string;
  detectionResult: boolean;
  enforcementResult: EnforcementResult;
  modelResponse?: string;
  evidence: string;
  residualRisk: string;
  confidence: number;
  durationMs: number;
  findings: SecurityFinding[];
  events: TestEvent[];
  modelAdapter?: 'gemini' | 'deterministic_sandboxed';
  isSimulated?: boolean;
}

export interface TestEvent {
  step: number;
  name: string;
  timestamp: string;
  status: 'passed' | 'blocked' | 'warning' | 'info';
  details: string;
  component: string;
}

export interface AuditRecord {
  id: string;
  index: number;
  timestamp: string;
  actor: string;
  role: Role;
  action: string;
  sessionId: string;
  result: EnforcementResult;
  evidence: string;
  previousHash: string;
  currentHash: string;
}

export interface BlockVerificationDetail {
  index: number;
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  storedPreviousHash: string;
  expectedPreviousHash: string;
  previousHashValid: boolean;
  storedCurrentHash: string;
  computedCurrentHash: string;
  contentHashValid: boolean;
  status: 'VALID' | 'TAMPERED_CONTENT' | 'BROKEN_LINK';
  errorDetails?: string;
  canonicalPayload?: string;
}

export interface VerificationResult {
  result: 'PASS' | 'FAIL';
  isValid: boolean;
  recordsChecked: number;
  validBlocksCount: number;
  tamperedIndex: number | null;
  brokenBlock?: {
    index: number;
    id: string;
    expectedHash: string;
    actualHash: string;
    reason: string;
    tamperType: 'CONTENT_MODIFICATION' | 'CHAIN_LINK_CORRUPTION';
  };
  blockVerifications: BlockVerificationDetail[];
  verificationTimestamp: string;
  durationMs: number;
  genesisHash: string;
  latestHash: string;
  isSimulatedCopy?: boolean;
}

export interface TamperingSimulationResult {
  isSimulated: boolean;
  simulatedTarget: string;
  tamperedIndex: number;
  tamperType: 'CONTENT_MODIFICATION' | 'CHAIN_LINK_CORRUPTION';
  originalRecord: AuditRecord;
  tamperedRecord: AuditRecord;
  verification: VerificationResult;
  testRecords: AuditRecord[];
}

export interface SecurityPolicy {
  id: string;
  name: string;
  category: TestCategory;
  description: string;
  enforcementMode: 'BLOCK' | 'LOG_ONLY' | 'DISABLED';
  regexPatterns: string[];
  severity: Severity;
  actionOnViolation: string;
  isCustomizable: boolean;
  active: boolean;
}

export interface RedTeamPayloadPreset {
  id: string;
  category: TestCategory;
  name: string;
  description: string;
  severity: Severity;
  payload: string;
  expectedOutcome: EnforcementResult;
  targetPolicy: string;
  explanation: string;
}

export interface AutomatedTestResult {
  id: string;
  name: string;
  description: string;
  category: string;
  passed: boolean;
  statusCode: number;
  expectedStatusCode: number;
  assertion: string;
  evidence: string;
  timestamp: string;
  durationMs: number;
}

export interface IsolationBoundaryStatus {
  name: string;
  target: string;
  status: 'SECURED' | 'BREACHED';
  enforcement: string;
  details: string;
  statusCode: number;
}

export interface IsolationVerificationResult {
  status: 'PASS' | 'FAIL';
  statusCode: number;
  verifiedBy: string;
  actorRole: Role;
  permission: string;
  timestamp: string;
  boundaries: IsolationBoundaryStatus[];
  message: string;
  summary: {
    totalBoundaries: number;
    secured: number;
    failed: number;
  };
}

