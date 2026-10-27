/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Student,
  VerificationRequest,
  StudentConsentPreferences,
  AcademicCredential,
} from '../types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  FileCheck,
  Building2,
  Lock,
  Bell,
  Trash2,
  Plus,
  KeyRound,
  Eye,
  Check,
  Ban,
  FileText,
  User,
  UserPlus,
} from 'lucide-react';

interface StudentPortalProps {
  currentStudent: Student;
  allStudents: Student[];
  onSelectStudent: (apaarId: string) => void;
  requests: VerificationRequest[];
  preferences: StudentConsentPreferences;
  onGrantConsent: (requestId: string, scope: VerificationRequest['scopeOfAccess']) => void;
  onRejectRequest: (requestId: string, reason: string) => void;
  onRevokeConsent: (requestId: string, reason: string) => void;
  onUpdatePreferences: (newPrefs: StudentConsentPreferences) => void;
  onViewCertificateDetails: (credential: AcademicCredential) => void;
  onOpenApprovalModal?: (request: VerificationRequest) => void;
  onOpenEnrollmentModal?: (student: Student) => void;
  onOpenCreateStudentModal?: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentStudent,
  allStudents,
  onSelectStudent,
  requests,
  preferences,
  onGrantConsent,
  onRejectRequest,
  onRevokeConsent,
  onUpdatePreferences,
  onViewCertificateDetails,
  onOpenApprovalModal,
  onOpenEnrollmentModal,
  onOpenCreateStudentModal,
}) => {

  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'preferences' | 'vault'>('pending');
  const [selectedScope, setSelectedScope] = useState<Record<string, VerificationRequest['scopeOfAccess']>>({});
  
  // Revocation modal state
  const [revokingRequestId, setRevokingRequestId] = useState<string | null>(null);
  const [revocationReason, setRevocationReason] = useState('Withdrawn as per DPDP Act 2023 - Offer accepted elsewhere');
  
  // Local preferences editing
  const [localPrefs, setLocalPrefs] = useState<StudentConsentPreferences>({ ...preferences });
  const [prefsSavedToast, setPrefsSavedToast] = useState(false);
  const [newBlacklistCompany, setNewBlacklistCompany] = useState('');

  // History filtering
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'VERIFIED' | 'REVOKED' | 'REJECTED'>('ALL');

  // Filter requests for this specific student
  const studentRequests = requests.filter(r => r.studentApaarId === currentStudent.apaarId);
  const pendingRequests = studentRequests.filter(r => r.status === 'PENDING_STUDENT_CONSENT');
  const historyRequests = studentRequests.filter(r => r.status !== 'PENDING_STUDENT_CONSENT');

  const filteredHistory = historyRequests.filter(r => {
    if (historyFilter === 'VERIFIED') return r.status === 'VERIFIED' || r.status === 'CONSENT_GRANTED';
    if (historyFilter === 'REVOKED') return r.status === 'CONSENT_REVOKED';
    if (historyFilter === 'REJECTED') return r.status === 'CONSENT_REJECTED';
    return true;
  });

  const handleScopeToggle = (
    reqId: string,
    scopeItem: 'IDENTITY' | 'ACADEMIC_MARKS' | 'DIGITAL_SIGNATURE' | 'FULL_TRANSCRIPT'
  ) => {
    const current = selectedScope[reqId] || ['IDENTITY', 'ACADEMIC_MARKS', 'DIGITAL_SIGNATURE'];
    let updated: VerificationRequest['scopeOfAccess'];
    if (current.includes(scopeItem)) {
      if (current.length === 1) return; // Keep at least one
      updated = current.filter(item => item !== scopeItem);
    } else {
      updated = [...current, scopeItem];
    }
    setSelectedScope(prev => ({ ...prev, [reqId]: updated }));
  };

  const handleSavePreferences = () => {
    onUpdatePreferences(localPrefs);
    setPrefsSavedToast(true);
    setTimeout(() => setPrefsSavedToast(false), 3000);
  };

  const handleAddBlacklist = () => {
    if (!newBlacklistCompany.trim()) return;
    if (localPrefs.blacklistedEmployers.includes(newBlacklistCompany.trim())) return;
    setLocalPrefs(prev => ({
      ...prev,
      blacklistedEmployers: [...prev.blacklistedEmployers, newBlacklistCompany.trim()],
    }));
    setNewBlacklistCompany('');
  };

  const handleRemoveBlacklist = (company: string) => {
    setLocalPrefs(prev => ({
      ...prev,
      blacklistedEmployers: prev.blacklistedEmployers.filter(c => c !== company),
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Student Profile Header & Persona Selector */}
      <div className="bg-[#111927] border border-slate-800 rounded-xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-amber-500/60 flex items-center justify-center text-amber-400 font-bold text-xl shrink-0">
              {currentStudent.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold text-white tracking-tight">{currentStudent.name}</h1>
                <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded font-medium">
                  DPDP Act 2023 Protected
                </span>
                <span className="text-xs text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded font-medium">
                  {currentStudent.stage}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span>
                  APAAR ID: <strong className="font-mono text-slate-200">{currentStudent.apaarId}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  PEN: <span className="font-mono text-slate-300">{currentStudent.pen}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>{currentStudent.currentInstitution}</span>
                <span aria-hidden="true">·</span>
                <span>District: {currentStudent.district}</span>
              </div>
            </div>
          </div>

          {/* Persona quick switcher */}
          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto shrink-0">
            <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <User className="w-4 h-4 text-slate-400" />
              <div className="flex flex-col">
                <label htmlFor="student-selector" className="text-[10px] text-slate-400 font-medium">
                  Switch Student View:
                </label>
                <select
                  id="student-selector"
                  value={currentStudent.apaarId}
                  onChange={e => onSelectStudent(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-amber-400 focus:outline-none cursor-pointer max-w-[220px]"
                >
                  {allStudents.map(s => (
                    <option key={s.apaarId} value={s.apaarId} className="bg-slate-900 text-white">
                      {s.name} ({s.apaarId}) - {s.stage}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {onOpenCreateStudentModal && (
              <button
                type="button"
                onClick={onOpenCreateStudentModal}
                className="px-2.5 py-2 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1 shadow transition-colors"
                title="Create / Register another student with APAAR ID"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Register</span>
              </button>
            )}
          </div>
        </div>


        {/* Quick telemetry summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-400 block">Pending Employer Requests</span>
            <span className="font-mono text-lg font-bold text-amber-400 tabular-nums">
              {pendingRequests.length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">DigiLocker Linked Documents</span>
            <span className="font-mono text-lg font-bold text-emerald-400 tabular-nums">
              {currentStudent.digilockerDocumentsCount} Verified
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Academic Bank of Credits</span>
            <span className="font-mono text-lg font-bold text-sky-400 tabular-nums">
              {currentStudent.abcCreditsBalance} Credits
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Consent Rule Enforcement</span>
            <span className="font-mono text-lg font-bold text-slate-200">
              {preferences.requireOtpForApproval ? 'Aadhaar OTP Required' : '1-Click Approval'}
            </span>
          </div>
        </div>
      </div>

      {/* APAAR Registration Consent Approval Banner (If pending) */}
      {currentStudent.consentPending && (
        <div className="bg-amber-950/40 border-2 border-amber-500/80 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse-subtle">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  APAAR ID Registration Requires Statutory Consent Approval
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Under the Ministry of Education & NEP 2020 guidelines, {currentStudent.name}&apos;s APAAR registration is awaiting parent/student consent declaration.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenEnrollmentModal?.(currentStudent)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-md transition-colors shrink-0 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve APAAR ID Now</span>
          </button>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Pending Requests</span>
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-600 text-white">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'history'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Historical Verifications & Revocations</span>
          <span className="text-xs text-slate-400">({historyRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'preferences'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Consent Preferences & DPDP Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'vault'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Academic Vault ({currentStudent.credentials.length})</span>
        </button>
      </div>

      {/* Tab 1: Pending Verification Requests */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Pending Background Verification Requests
              </h2>
              <p className="text-xs text-slate-400">
                Under the DPDP Act 2023, no employer or third party can access your academic records without your express consent.
              </p>
            </div>
            <span className="text-xs text-slate-400">
              Active pending: <strong className="text-amber-400">{pendingRequests.length}</strong>
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="bg-[#111927] border border-slate-800/80 rounded-xl p-10 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-semibold text-white">No pending verification requests</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                You have no unresolved background checks. When an employer initiates a verification request with your APAAR ID, it will appear here for your approval.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {pendingRequests.map(req => {
                const currentScope = selectedScope[req.id] || req.scopeOfAccess;
                return (
                  <div
                    key={req.id}
                    className="bg-[#111927] border border-amber-500/40 rounded-xl p-6 shadow-lg space-y-5"
                  >
                    {/* Header info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white">{req.employerName}</h3>
                            <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded">
                              Request #{req.id}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                            <span>Verifier: <strong className="text-slate-300">{req.verifierName}</strong> ({req.verifierRole})</span>
                            <span aria-hidden="true">·</span>
                            <span>Email: {req.verifierEmail}</span>
                            <span aria-hidden="true">·</span>
                            <span>IP: <code className="font-mono text-slate-300">{req.verifierIp}</code></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-950/40 border border-amber-900/60 px-3 py-1.5 rounded-lg self-start sm:self-auto">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>Awaiting Your Consent</span>
                      </div>
                    </div>

                    {/* Purpose & Documents requested */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-slate-400 font-medium">Verification Purpose:</span>
                        <p className="text-slate-200 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                          {req.purpose}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <span className="text-slate-400 font-medium">Requested Academic Documents:</span>
                        <div className="flex flex-wrap gap-2">
                          {req.requestedCredentialTypes.map(cType => (
                            <span
                              key={cType}
                              className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 font-medium text-[11px] flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-400" />
                              {cType.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Expiry: Valid for 24-72 hours following authorization.
                        </div>
                      </div>
                    </div>

                    {/* Granular Consent Scope Controls */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        Configure Granular Sharing Scope (DPDP Rule):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {[
                          { key: 'IDENTITY', label: 'Verify Student Identity' },
                          { key: 'ACADEMIC_MARKS', label: 'Share Degree & CGPA' },
                          { key: 'DIGITAL_SIGNATURE', label: 'Share AICTE Signature' },
                          { key: 'FULL_TRANSCRIPT', label: 'Share ABC Ledger' },
                        ].map(item => {
                          const isChecked = currentScope.includes(item.key as any);
                          return (
                            <label
                              key={item.key}
                              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-amber-950/30 border-amber-500/50 text-white'
                                  : 'bg-slate-900/50 border-slate-800 text-slate-400'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleScopeToggle(req.id, item.key as any)}
                                className="accent-amber-500 rounded"
                              />
                              <span className="text-[11px]">{item.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-800">
                      <button
                        onClick={() => onRejectRequest(req.id, 'Candidate declined verification request.')}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>Decline Request</span>
                      </button>

                      {onOpenApprovalModal && (
                        <button
                          onClick={() => onOpenApprovalModal(req)}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900 border border-amber-600/70 rounded-lg transition-colors shadow-sm"
                          title="Open full APAAR Approval options modal (Aadhaar OTP, time-limited, custom scope)"
                        >
                          <KeyRound className="w-4 h-4 text-amber-400" />
                          <span>Approval Options (OTP / Scope)</span>
                        </button>
                      )}

                      <button
                        onClick={() => onGrantConsent(req.id, currentScope)}
                        className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-md transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Quick Approve (1-Click)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Historical Verifications & Revocations */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Historical Verification Statuses & Audit Records
              </h2>
              <p className="text-xs text-slate-400">
                Full chronological ledger of every employer check. You retain the legal right to revoke data sharing at any time.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
              {(['ALL', 'VERIFIED', 'REVOKED', 'REJECTED'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    historyFilter === f
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f === 'ALL' ? 'All' : f === 'VERIFIED' ? 'Verified' : f === 'REVOKED' ? 'Revoked' : 'Rejected'}
                </button>
              ))}
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="bg-[#111927] border border-slate-800/80 rounded-xl p-10 text-center space-y-3">
              <Clock className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-sm font-semibold text-white">No records found for this filter</h3>
              <p className="text-xs text-slate-400">Try selecting 'All' to see all past records.</p>
            </div>
          ) : (
            <div className="bg-[#111927] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Employer & Verifier</th>
                      <th className="py-3 px-4">Purpose</th>
                      <th className="py-3 px-4">Credentials</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {filteredHistory.map(req => {
                      const isRevokable = req.status === 'VERIFIED' || req.status === 'CONSENT_GRANTED';
                      return (
                        <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-medium">
                            <div className="flex flex-col">
                              <span className="text-white font-semibold">{req.employerName}</span>
                              <span className="text-[11px] text-slate-400">
                                {req.verifierName} · <code className="text-slate-500">{req.verifierIp}</code>
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 max-w-xs truncate" title={req.purpose}>
                            <span className="text-slate-300">{req.purpose}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {req.requestedCredentialTypes.map(t => (
                                <span
                                  key={t}
                                  className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {req.status === 'VERIFIED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                                <Check className="w-3 h-3" />
                                Verified & Active
                              </span>
                            )}
                            {req.status === 'CONSENT_GRANTED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-950/80 text-sky-400 border border-sky-800">
                                <Clock className="w-3 h-3" />
                                Consent Granted
                              </span>
                            )}
                            {req.status === 'CONSENT_REVOKED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950/80 text-rose-400 border border-rose-800">
                                <Ban className="w-3 h-3" />
                                Consent Revoked
                              </span>
                            )}
                            {req.status === 'CONSENT_REJECTED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                                <XCircle className="w-3 h-3" />
                                Rejected by Student
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                            {new Date(req.requestedAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {isRevokable ? (
                              <button
                                onClick={() => setRevokingRequestId(req.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 rounded transition-colors"
                                title="Revoke employer's verification access immediately under DPDP Act 2023"
                              >
                                <Ban className="w-3 h-3" />
                                <span>Revoke Consent</span>
                              </button>
                            ) : req.status === 'CONSENT_REVOKED' ? (
                              <span className="text-[11px] text-rose-400 font-medium">Access Purged</span>
                            ) : (
                              <span className="text-[11px] text-slate-500">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Consent Preferences & DPDP Rules */}
      {activeTab === 'preferences' && (
        <div className="bg-[#111927] border border-slate-800 rounded-xl p-6 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Manage Consent Preferences & Data Sharing Rules
              </h2>
              <p className="text-xs text-slate-400">
                Configure your persistent data privacy boundaries under the Digital Personal Data Protection (DPDP) Act 2023.
              </p>
            </div>

            <button
              onClick={handleSavePreferences}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors shrink-0 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Save Privacy Preferences</span>
            </button>
          </div>

          {prefsSavedToast && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Preferences saved successfully! All future background verification requests will respect these parameters.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Left Column: Toggles */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                Security & Verification Safeguards
              </h3>

              <label className="flex items-start gap-3 p-3.5 bg-slate-900/60 rounded-lg border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPrefs.requireOtpForApproval}
                  onChange={e => setLocalPrefs(prev => ({ ...prev, requireOtpForApproval: e.target.checked }))}
                  className="accent-amber-500 mt-0.5 rounded"
                />
                <div>
                  <span className="font-semibold text-slate-200 block">Require Aadhaar OTP for Consent Approval</span>
                  <span className="text-slate-400 text-[11px]">
                    Prevents accidental clicks by requiring a 6-digit OTP sent to your registered mobile number (registered mobile).
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 bg-slate-900/60 rounded-lg border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPrefs.autoApproveVettedEmployers}
                  onChange={e => setLocalPrefs(prev => ({ ...prev, autoApproveVettedEmployers: e.target.checked }))}
                  className="accent-amber-500 mt-0.5 rounded"
                />
                <div>
                  <span className="font-semibold text-slate-200 block">Auto-Approve Vetted Tier-1 Employers</span>
                  <span className="text-slate-400 text-[11px]">
                    Fast-tracks pre-screened IT and public enterprise recruiters (e.g. TCS, Infosys, Zoho) for Degree verification.
                  </span>
                </div>
              </label>

              <div className="p-3.5 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-200 block">Default Data Sharing Validity Period</span>
                <span className="text-slate-400 text-[11px] block">
                  Employer's verification credential automatically expires and self-destructs after this duration.
                </span>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { hours: 24, label: '24 Hours' },
                    { hours: 72, label: '3 Days' },
                    { hours: 168, label: '7 Days' },
                  ].map(opt => (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => setLocalPrefs(prev => ({ ...prev, defaultValidityHours: opt.hours }))}
                      className={`py-1.5 text-xs font-semibold rounded border transition-colors ${
                        localPrefs.defaultValidityHours === opt.hours
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Blacklist & Notifications */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                Notifications & Access Restrictions
              </h3>

              <div className="p-3.5 bg-slate-900/60 rounded-lg border border-slate-800 space-y-3">
                <span className="font-semibold text-slate-200 block">Notification Channels</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPrefs.notifyViaSMS}
                    onChange={e => setLocalPrefs(prev => ({ ...prev, notifyViaSMS: e.target.checked }))}
                    className="accent-amber-500 rounded"
                  />
                  <span className="text-slate-300">Instant SMS notification on mobile (registered mobile)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPrefs.notifyViaEmail}
                    onChange={e => setLocalPrefs(prev => ({ ...prev, notifyViaEmail: e.target.checked }))}
                    className="accent-amber-500 rounded"
                  />
                  <span className="text-slate-300">Email alert with HR verifier IP log</span>
                </label>
              </div>

              {/* Blacklist Employers */}
              <div className="p-3.5 bg-slate-900/60 rounded-lg border border-slate-800 space-y-3">
                <span className="font-semibold text-slate-200 block">Employer Blacklist (Zero Access)</span>
                <span className="text-slate-400 text-[11px] block">
                  Blacklisted entities are instantly blocked from initiating verification requests against your APAAR ID.
                </span>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBlacklistCompany}
                    onChange={e => setNewBlacklistCompany(e.target.value)}
                    placeholder="Company name to block..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddBlacklist}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Block</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {localPrefs.blacklistedEmployers.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic">No companies currently blacklisted.</span>
                  ) : (
                    localPrefs.blacklistedEmployers.map(company => (
                      <span
                        key={company}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-rose-950/60 border border-rose-800 text-rose-300 rounded text-[11px]"
                      >
                        <span>{company}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBlacklist(company)}
                          className="hover:text-white"
                          title="Unblock"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Academic Vault */}
      {activeTab === 'vault' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                DigiLocker & AICTE Academic Vault
              </h2>
              <p className="text-xs text-slate-400">
                Official cryptographically signed academic credentials tied to APAAR ID {currentStudent.apaarId}.
              </p>
            </div>
          </div>

          {currentStudent.credentials.length === 0 ? (
            <div className="bg-[#111927] border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
              No degree credentials registered yet for this stage ({currentStudent.stage}).
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentStudent.credentials.map(cred => (
                <div
                  key={cred.id}
                  className="bg-[#111927] border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900">
                        {cred.type}
                      </span>
                      <h4 className="text-sm font-bold text-white">{cred.title}</h4>
                      <p className="text-xs text-slate-400">{cred.issuingInstitution}</p>
                    </div>
                    <FileCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-mono">
                    <div>
                      <span className="text-slate-500 block">Score / CGPA:</span>
                      <span className="text-slate-200 font-semibold">{cred.cgpaOrPercentage}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Passing Year:</span>
                      <span className="text-slate-200">{cred.yearOfPassing}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block">AICTE Approval Code:</span>
                      <span className="text-amber-400">{cred.aicteApprovalNumber}</span>
                    </div>
                    <div className="col-span-2 truncate">
                      <span className="text-slate-500 block">SHA-256 Digest:</span>
                      <span className="text-slate-400">{cred.sha256Hash.slice(0, 24)}...</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      DigiLocker Verified
                    </span>
                    <button
                      onClick={() => onViewCertificateDetails(cred)}
                      className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Cryptographic Certificate</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Revocation Modal Dialogue */}
      {revokingRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#111927] border border-rose-500/50 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-950/80 border border-rose-800 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Revoke Employer Verification Consent</h3>
                <span className="text-xs text-rose-400">Digital Personal Data Protection (DPDP) Act 2023 § 6(4)</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are exercising your legal right under Section 6(4) of the DPDP Act 2023 to revoke data sharing consent.
              Once confirmed, the employer's verification access will be severed immediately and their digital token will be invalidated.
            </p>

            <div className="space-y-1 text-xs">
              <label htmlFor="revocation-reason-input" className="text-slate-400 font-medium">
                Reason for Revocation (Logged in immutable audit trail):
              </label>
              <textarea
                id="revocation-reason-input"
                value={revocationReason}
                onChange={e => setRevocationReason(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setRevokingRequestId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (revokingRequestId) {
                    onRevokeConsent(revokingRequestId, revocationReason);
                    setRevokingRequestId(null);
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg flex items-center gap-1.5 shadow-md"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Confirm Revocation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
