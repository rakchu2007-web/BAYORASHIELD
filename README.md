# BAYORASHIELD: Adversarial AI Safety Command Center
> **Attack the AI. Protect the Intelligence. Prove the Security.**  
> *Developed for the Hack in Hills '26 Bayora Adversarial AI Safety Challenge*

---

## 1. System Architecture & Topology

BAYORASHIELD is an end-to-end adversarial AI safety operations platform and SOC command center built with strict boundary enforcement, cryptographic audit trails, and multi-tier defense pipelines:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       BAYORASHIELD COMMAND CENTER UI                        │
│   (React 19 + TypeScript + Tailwind CSS SOC Terminal + Event Scrubber)      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Bearer Token / Role Auth
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EXPRESS SECURITY GATEWAY (server.ts)                     │
│  - RBAC Middleware (Extracts Bearer Token & Validates Tenant Scope)         │
│  - Multi-Tenant Boundary Interceptor (Blocks Cross-Team Reads: 403 Forbidden)│
└──────────────┬───────────────────────┬──────────────────────────────┬───────┘
               │                       │                              │
               ▼                       ▼                              ▼
    ┌────────────────────┐   ┌────────────────────┐       ┌────────────────────┐
    │  RED TEAM VAULT    │   │ BLUE DEFENSE VAULT │       │ TARGET MODEL SANDBOX│
    │  - Top Secret Red  │   │ - Active POL-AI-*  │       │ - Session Anchor   │
    │  - Exploit Drafts  │   │ - Honeytokens      │       │ - Canary Traps     │
    │  - Token: RED-9941 │   │ - Token: BLUE-3312 │       │ - Model Adapters   │
    └────────────────────┘   └────────────────────┘       └─────────┬──────────┘
                                                                    │
                                                                    ▼
                                               ┌───────────────────────────────┐
                                               │   PRE-EXECUTION REGEX FILTER  │
                                               │   (POL-AI-01 through 06)      │
                                               └──────────────┬────────────────┘
                                                              │
                                                              ▼
                                               ┌───────────────────────────────┐
                                               │   TARGET MODEL INFERENCE      │
                                               │   (Gemini 2.5 Flash / Sandboxed)│
                                               └──────────────┬────────────────┘
                                                              │
                                                              ▼
                                               ┌───────────────────────────────┐
                                               │  POST-EXECUTION CANARY GUARD  │
                                               │  (Scans for Leaks/Exfiltration│
                                               └──────────────┬────────────────┘
                                                              │
                                                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                SHA-256 TAMPER-EVIDENT AUDIT LEDGER (auditLedger.ts)         │
│   Genesis Anchor ──► Block #1 ──► Block #2 ──► Block #N (Canonical JSON)    │
│   (Recomputable cryptographic hash chain with real-time tamper detection)   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Implemented Views & Navigation

| Code | View Name | Purpose |
|---|---|---|
| **A** | **Security Overview** | Real-time SOC dashboard, test KPIs, actual threats blocked, verified audit status, live risk gauge. |
| **B** | **Red Team Lab** | Adversarial payload workbench with 6 categories: Prompt Injection, Instruction Override, Unauthorized Vault Access, Cross-Session Leakage, Restricted Info Exfiltration, and Document Directives. |
| **C** | **Blue Team Defense** | Policy guardrail configurations, regex inspection patterns, mode switching (`BLOCK` vs `LOG_ONLY`), negative access verification, and disclosed findings. |
| **D** | **Isolation Center** | Visual multi-tenant architecture topology, cross-boundary access matrix, and live endpoint test triggers. |
| **E** | **Target Model Testing** | Interactive prompt runner with configurable adapters (Gemini 2.5 Flash / Deterministic Sandboxed), honeytoken detection, and documented evaluation limitations. |
| **F** | **Attack Replay** | Frame-by-frame visual event timeline with scrubber, pause/resume playback, component traces, and exportable JSON test reports. |
| **G** | **Audit & Forensics** | SHA-256 hash-chained event ledger with canonical serialization, block-by-block hash verification, controlled tampering simulation, and self-heal restore. |
| **H** | **Risk Analytics** | Transparent mathematical scoring model separating attack attempts, detected signatures, hard blocks, and confirmed containment failures. |
| **I** | **Security Policies** | Formal specifications for POL-AI-01 through POL-AI-06 with regex signatures, severity ratings, and enforcement modes. |
| **J** | **System Settings** | Live 10-suite automated security regression test runner, STRIDE threat model, architecture docs, and RBAC token directory. |

---

## 3. Role-Based Access Control (RBAC) Tokens

| Role | Name / Title | Bearer Token Key | Allowed Scopes |
|---|---|---|---|
| **Red Team** | Red Operator #104 | `BAYORA-RED-SECRET-KEY-9941` | `/api/vault/red`, `/api/tests/execute`, `/api/presets` |
| **Blue Team** | Blue Defender #208 | `BAYORA-BLUE-DEFENSE-KEY-3312` | `/api/vault/blue`, `/api/policies/toggle`, `/api/policies` |
| **Judge / Auditor** | Security Auditor #001 | `BAYORA-JUDGE-AUDIT-KEY-7700` | Full Read-Only Inspection across all vaults, sessions, and audit ledgers |

---

## 4. 10-Suite Automated Security Tests

The application includes automated regression testing executing against live backend endpoints:

1. `AUTO-SUITE-01`: Unauthorized Red Team -> Blue Team Record Access (Assert 403 Forbidden)
2. `AUTO-SUITE-02`: Unauthorized Blue Team -> Red Team Payload Access (Assert 403 Forbidden)
3. `AUTO-SUITE-03`: Cross-Session Context Leakage Barrier (Assert Canary Quarantined)
4. `AUTO-SUITE-04`: Missing/Invalid Session Identifier Rejection (Assert 401 Unauthorized)
5. `AUTO-SUITE-05`: Invalid Role Permissions & Secret Exfiltration Prevention (Assert 403)
6. `AUTO-SUITE-06`: Direct Prompt Injection Defense (DAN Signature Intercepted)
7. `AUTO-SUITE-07`: Cryptographic Audit Hash Chain Integrity Verification (SHA-256 from Genesis)
8. `AUTO-SUITE-08`: Audit Tampering Detection & Controlled Self-Heal (Mutated Block Flagged)
9. `AUTO-SUITE-09`: Risk Calculation & Formula Correctness (Mathematical Integrity Verified)
10. `AUTO-SUITE-10`: Malformed Input Fuzzing & Graceful Error Handling (Zero Unhandled Rejections)

---

## 5. Judge Demonstration Guided Scenario (9 Steps)

Click the **JUDGE DEMO** button in the header to run the guided evaluation gauntlet:
- **Step 1:** Provisions isolated Red and Blue sessions with distinct canary strings.
- **Step 2:** Dispatches an unauthorized cross-team probe (`GET /api/vault/red` from Blue Team).
- **Step 3:** Confirms backend RBAC intercept with HTTP 403 (verifying server-side enforcement).
- **Step 4:** Dispatches a direct DAN prompt injection against the target model.
- **Step 5:** Evaluates the intercept under documented policy `POL-AI-01`.
- **Step 6:** Executes a cross-session memory probe asserting canary containment.
- **Step 7:** Reviews the chronological multi-stage test event timeline.
- **Step 8:** Recomputes the SHA-256 hash chain verifying zero cryptographic breaks.
- **Step 9:** Compiles and exports an official signed JSON evaluation report.

---

## 6. Setup and Run Instructions

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### Quickstart
```bash
# 1. Install dependencies
npm install

# 2. Run full-stack development server
npm run dev

# 3. Build for production
npm run build
npm run start
```
The application will be accessible at `http://localhost:3000`.

### Environment Variables
Configure `.env` using `.env.example`:
```ini
# Optional: Real Gemini 2.5 Flash model evaluation (if omitted, high-fidelity deterministic sandboxed model is used)
GEMINI_API_KEY=""

# Application Host URL
APP_URL="http://localhost:3000"
```

---

## 7. Security Guarantees & Honest Limitations

1. **Application-Level vs Hypervisor Isolation:**
   - *Current Implementation:* Strong in-process memory isolation with scoped routing, token authentication, and separate database collections.
   - *Limitation:* Does not execute separate Linux cgroup Docker containers per tenant. A host OS compromise would bypass process memory boundaries.

2. **Tamper-Evident Ledger vs Privileged Admin Rewriting:**
   - *Current Implementation:* SHA-256 canonical hash chaining mathematically detects single-record edits or retro-modifications.
   - *Limitation:* A privileged database administrator with root key access could re-hash the entire chain from block 1 to N. Production deployment requires external signed checkpoints (RFC 6962 transparency logs or WORM append-only cloud storage).
