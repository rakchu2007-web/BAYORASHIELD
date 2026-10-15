import {
  AuditRecord,
  AutomatedTestResult,
  EnforcementResult,
  RedTeamPayloadPreset,
  Role,
  SecurityPolicy,
  SecurityTestRecord,
  TestCategory,
  IsolationVerificationResult
} from '../types/security.ts';

export interface AuthContextState {
  role: Role;
  name: string;
  token: string;
}

export const KNOWN_ROLE_TOKENS: Record<Role, { token: string; name: string; title: string }> = {
  red_team: {
    token: 'BAYORA-RED-SECRET-KEY-9941',
    name: 'Red Operator #104',
    title: 'Adversarial AI Specialist'
  },
  blue_team: {
    token: 'BAYORA-BLUE-DEFENSE-KEY-3312',
    name: 'Blue Defender #208',
    title: 'Defensive Guardrails Architect'
  },
  judge_auditor: {
    token: 'BAYORA-JUDGE-AUDIT-KEY-7700',
    name: 'Security Auditor #001',
    title: 'Independent Evaluation Judge'
  }
};

let currentToken: string = KNOWN_ROLE_TOKENS.judge_auditor.token;

export function setActiveToken(token: string) {
  currentToken = token;
}

export function getActiveToken(): string {
  return currentToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (currentToken) {
    headers.set('Authorization', `Bearer ${currentToken}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!res.ok) {
    let errorJson;
    try {
      errorJson = await res.json();
    } catch {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const err = new Error(errorJson.message || errorJson.error || `Request failed with ${res.status}`);
    (err as unknown as { status: number; data: unknown }).status = res.status;
    (err as unknown as { status: number; data: unknown }).data = errorJson;
    throw err;
  }

  return res.json() as Promise<T>;
}

export const api = {
  getHealth: () => request<{ status: string; service: string }>('/api/health'),
  
  getAuthContext: () => request<{ role: Role; name: string; token: string }>('/api/auth/current'),
  
  getSessions: () => request<Array<{
    id: string;
    name: string;
    createdAt: string;
    status: 'ACTIVE' | 'ARCHIVED' | 'ISOLATED';
    createdByRole: Role;
    isolationLevel: string;
    canaryToken: string;
  }>>('/api/sessions'),

  createSession: (name: string) => request<{
    id: string;
    name: string;
    createdAt: string;
    status: string;
    createdByRole: Role;
    canaryToken: string;
  }>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ name })
  }),

  getPresets: () => request<RedTeamPayloadPreset[]>('/api/presets'),

  getPolicies: () => request<SecurityPolicy[]>('/api/policies'),

  togglePolicy: (policyId: string, active?: boolean, enforcementMode?: 'BLOCK' | 'LOG_ONLY' | 'DISABLED') =>
    request<SecurityPolicy>('/api/policies/toggle', {
      method: 'POST',
      body: JSON.stringify({ policyId, active, enforcementMode })
    }),

  executeTest: (params: {
    sessionId: string;
    category: TestCategory;
    title: string;
    payload: string;
    modelAdapter?: 'gemini' | 'deterministic_sandboxed';
  }) => request<SecurityTestRecord>('/api/tests/execute', {
    method: 'POST',
    body: JSON.stringify(params)
  }),

  getTestHistory: () => request<SecurityTestRecord[]>('/api/tests/history'),

  getTestById: (id: string) => request<SecurityTestRecord>(`/api/tests/${id}`),

  getAuditLedger: () => request<AuditRecord[]>('/api/audit/ledger'),

  getAuditStatus: () => request<{
    totalRecords: number;
    isValid: boolean;
    tamperedIndex: number | null;
    isTampered: boolean;
    latestHash: string;
    genesisHash: string;
    brokenBlockDetails?: {
      index: number;
      expectedHash: string;
      actualHash: string;
      reason: string;
    };
  }>('/api/audit/status'),

  verifyAuditIntegrity: (useTestCopy?: boolean) => request<import('../types/security.ts').VerificationResult>('/api/audit/verify', {
    method: 'POST',
    body: JSON.stringify({ useTestCopy })
  }),

  simulateAuditTampering: (targetIndex?: number, tamperType?: 'CONTENT_MODIFICATION' | 'CHAIN_LINK_CORRUPTION') =>
    request<import('../types/security.ts').TamperingSimulationResult>('/api/audit/simulate-tampering', {
      method: 'POST',
      body: JSON.stringify({ targetIndex, tamperType })
    }),

  getAuditSimulationState: () => request<import('../types/security.ts').TamperingSimulationResult | null>('/api/audit/simulation'),

  restoreAuditBackup: () => request<{ success: boolean; restoredCount: number; message: string }>('/api/audit/restore', {
    method: 'POST'
  }),

  getRedVault: () => request<{
    vault: string;
    records: Array<{
      id: string;
      codename: string;
      classification: string;
      zeroDayPayloadDraft: string;
      targetObjective: string;
      createdTimestamp: string;
    }>;
  }>('/api/vault/red'),

  getBlueVault: () => request<{
    vault: string;
    records: Array<{
      id: string;
      ruleCode: string;
      classification: string;
      honeypotCanarySecret: string;
      internalMitigationLogic: string;
      activeBarrierMode: string;
    }>;
    policies: SecurityPolicy[];
  }>('/api/vault/blue'),

  verifyIsolation: (roleTokenOverride?: string) => request<IsolationVerificationResult>('/api/isolation/verify', {
    method: 'POST',
    headers: roleTokenOverride ? { Authorization: `Bearer ${roleTokenOverride}` } : undefined
  }),

  testBoundaryAccess: (targetVault: 'red' | 'blue', roleTokenOverride?: string) => request<{
    status: string;
    code: number;
    error?: string;
    message: string;
    targetVault?: string;
    attemptedBy?: string;
    enforcedAt?: string;
  }>('/api/isolation/test-boundary', {
    method: 'POST',
    headers: roleTokenOverride ? { Authorization: `Bearer ${roleTokenOverride}` } : undefined,
    body: JSON.stringify({ targetVault })
  }),

  testCrossSessionLeakage: (fromSessionId: string, targetSessionId: string, roleTokenOverride?: string) => request<{
    status: string;
    code: number;
    error?: string;
    message: string;
    fromSessionId: string;
    targetSessionId: string;
    enforcedAt?: string;
  }>('/api/isolation/test-cross-session', {
    method: 'POST',
    headers: roleTokenOverride ? { Authorization: `Bearer ${roleTokenOverride}` } : undefined,
    body: JSON.stringify({ fromSessionId, targetSessionId })
  }),

  runAutomatedTests: () => request<{
    timestamp: string;
    summary: {
      total: number;
      passed: number;
      failed: number;
      passPercentage: number;
    };
    results: AutomatedTestResult[];
  }>('/api/automated-tests/run', { method: 'POST' }),

  getAnalyticsMetrics: () => request<{
    totalTests: number;
    threatsDetected: number;
    blockedRequests: number;
    allowedRequests: number;
    detectedRequests: number;
    failedRequests: number;
    simulatedRequests: number;
    policyViolations: number;
    auditVerificationStatus: string;
    tamperedIndex: number | null;
    riskScore: number;
    categoryBreakdown: Record<string, { total: number; blocked: number; failed: number }>;
    activeSessionsCount: number;
    activePoliciesCount: number;
    timestamp: string;
  }>('/api/analytics/metrics')
};
