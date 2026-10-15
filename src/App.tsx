/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header.tsx';
import { Sidebar, NavPage } from './components/layout/Sidebar.tsx';
import { OverviewPage } from './pages/OverviewPage.tsx';
import { RedTeamLabPage } from './pages/RedTeamLabPage.tsx';
import { BlueTeamDefensePage } from './pages/BlueTeamDefensePage.tsx';
import { IsolationCenterPage } from './pages/IsolationCenterPage.tsx';
import { TargetModelPage } from './pages/TargetModelPage.tsx';
import { AttackReplayPage } from './pages/AttackReplayPage.tsx';
import { AuditForensicsPage } from './pages/AuditForensicsPage.tsx';
import { RiskAnalyticsPage } from './pages/RiskAnalyticsPage.tsx';
import { SecurityPoliciesPage } from './pages/SecurityPoliciesPage.tsx';
import { SystemSettingsPage } from './pages/SystemSettingsPage.tsx';
import { JudgeDemoModal } from './components/modals/JudgeDemoModal.tsx';
import { QuickTestModal } from './components/modals/QuickTestModal.tsx';
import { api, setActiveToken, KNOWN_ROLE_TOKENS } from './services/api.ts';
import { Role, SecurityPolicy, SecurityTestRecord } from './types/security.ts';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavPage>('overview');
  const [currentRole, setCurrentRole] = useState<Role>('judge_auditor');
  const [sessions, setSessions] = useState<Array<{ id: string; name: string; canaryToken: string }>>([
    { id: 'sess-alpha-882', name: 'Primary AI Safety Gauntlet', canaryToken: 'CANARY-ALPHA-9901-X7' }
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>('sess-alpha-882');
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [testHistory, setTestHistory] = useState<SecurityTestRecord[]>([]);
  const [auditValid, setAuditValid] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<{
    totalTests: number;
    threatsDetected: number;
    blockedRequests: number;
    allowedRequests: number;
    detectedRequests: number;
    failedRequests: number;
    policyViolations: number;
    auditVerificationStatus: string;
    tamperedIndex: number | null;
    riskScore: number;
    activeSessionsCount: number;
    activePoliciesCount: number;
    categoryBreakdown: Record<string, { total: number; blocked: number; failed: number }>;
  }>({
    totalTests: 2,
    threatsDetected: 1,
    blockedRequests: 1,
    allowedRequests: 1,
    detectedRequests: 0,
    failedRequests: 0,
    policyViolations: 1,
    auditVerificationStatus: 'VERIFIED',
    tamperedIndex: null,
    riskScore: 100,
    activeSessionsCount: 3,
    activePoliciesCount: 6,
    categoryBreakdown: {}
  });

  const [isJudgeDemoOpen, setIsJudgeDemoOpen] = useState(false);
  const [isQuickTestOpen, setIsQuickTestOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Sync initial role token
  useEffect(() => {
    setActiveToken(KNOWN_ROLE_TOKENS.judge_auditor.token);
  }, []);

  const refreshAllData = useCallback(async () => {
    try {
      const [sessList, polList, histList, metricData, auditData] = await Promise.all([
        api.getSessions(),
        api.getPolicies(),
        api.getTestHistory(),
        api.getAnalyticsMetrics(),
        api.getAuditStatus()
      ]);

      if (sessList && sessList.length > 0) {
        setSessions(sessList);
        if (!sessList.some((s) => s.id === activeSessionId)) {
          setActiveSessionId(sessList[0].id);
        }
      }
      if (polList) setPolicies(polList);
      if (histList) setTestHistory(histList);
      if (metricData) setMetrics(metricData as typeof metrics);
      if (auditData) setAuditValid(auditData.isValid);
    } catch (err) {
      console.error('Error refreshing app state:', err);
    } finally {
      setInitialLoading(false);
    }
  }, [activeSessionId]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
  };

  const handleTestCompleted = (record: SecurityTestRecord) => {
    setTestHistory((prev) => [record, ...prev]);
    refreshAllData();
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans bg-cyber-grid selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Persistent Command Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        activeSessionId={activeSessionId}
        sessions={sessions}
        onSessionChange={setActiveSessionId}
        onOpenQuickTest={() => setIsQuickTestOpen(true)}
        onOpenJudgeDemo={() => setIsJudgeDemoOpen(true)}
        systemStatus="ONLINE"
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          currentRole={currentRole}
          auditValid={auditValid}
        />

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {initialLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 font-mono text-xs text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <span>Initializing BAYORASHIELD Security Gateway & Cryptographic Ledger...</span>
            </div>
          ) : (
            <>
              {currentPage === 'overview' && (
                <OverviewPage
                  metrics={metrics}
                  recentTests={testHistory}
                  onOpenQuickTest={() => setIsQuickTestOpen(true)}
                  onOpenJudgeDemo={() => setIsJudgeDemoOpen(true)}
                  onNavigateToTab={(tab) => setCurrentPage(tab as NavPage)}
                  auditValid={auditValid}
                />
              )}

              {currentPage === 'red_lab' && (
                <RedTeamLabPage
                  activeSessionId={activeSessionId}
                  sessions={sessions}
                  onSelectSession={setActiveSessionId}
                  onTestExecuted={handleTestCompleted}
                  onNavigateToReplay={() => setCurrentPage('attack_replay')}
                />
              )}

              {currentPage === 'blue_defense' && (
                <BlueTeamDefensePage
                  policies={policies}
                  onPolicyUpdated={refreshAllData}
                  recentTests={testHistory}
                />
              )}

              {currentPage === 'isolation' && (
                <IsolationCenterPage
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  currentRole={currentRole}
                  onRoleChange={handleRoleChange}
                />
              )}

              {currentPage === 'target_model' && (
                <TargetModelPage
                  activeSessionId={activeSessionId}
                  onTestExecuted={handleTestCompleted}
                />
              )}

              {currentPage === 'attack_replay' && (
                <AttackReplayPage testHistory={testHistory} />
              )}

              {currentPage === 'audit_forensics' && (
                <AuditForensicsPage onLedgerMutated={refreshAllData} />
              )}

              {currentPage === 'risk_analytics' && (
                <RiskAnalyticsPage metrics={metrics} testHistory={testHistory} />
              )}

              {currentPage === 'policies' && (
                <SecurityPoliciesPage
                  policies={policies}
                  onPolicyUpdated={refreshAllData}
                />
              )}

              {currentPage === 'settings' && (
                <SystemSettingsPage />
              )}
            </>
          )}
        </main>
      </div>

      {/* Quick Test Modal */}
      <QuickTestModal
        isOpen={isQuickTestOpen}
        onClose={() => setIsQuickTestOpen(false)}
        activeSessionId={activeSessionId}
        onTestCompleted={handleTestCompleted}
        onNavigateToTab={(tab) => {
          setIsQuickTestOpen(false);
          setCurrentPage(tab as NavPage);
        }}
      />

      {/* Guided Judge Demonstration Modal */}
      <JudgeDemoModal
        isOpen={isJudgeDemoOpen}
        onClose={() => setIsJudgeDemoOpen(false)}
        onComplete={() => {
          setIsJudgeDemoOpen(false);
          refreshAllData();
        }}
        onNavigateToTab={(tab) => {
          setIsJudgeDemoOpen(false);
          setCurrentPage(tab as NavPage);
        }}
      />
    </div>
  );
}
