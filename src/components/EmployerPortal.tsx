/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Student,
  VerificationRequest,
  AcademicCredential,
} from '../types';
import { formatApaarId, validateApaarId } from '../utils/verificationEngine';
import { ApaarQrScannerModal } from './ApaarQrScannerModal';
import {
  ShieldCheck,
  Building2,
  FileCheck2,
  Send,
  AlertTriangle,
  QrCode,
  CheckCircle2,
  Lock,
  Clock,
  Printer,
  Ban,
  ArrowRight,
  ExternalLink,
  Cpu,
  KeyRound,
  Eye,
  Camera,
  Sparkles,
  Zap,
  X,
} from 'lucide-react';

interface EmployerPortalProps {
  students: Student[];
  requests: VerificationRequest[];
  onSubmitRequest: (params: {
    employerName: string;
    verifierName: string;
    verifierEmail: string;
    studentApaarId: string;
    requestedCredentials: AcademicCredential['type'][];
    purpose: string;
  }) => { success: boolean; error?: string; requestId?: string };
  onSimulateConsentApproval: (requestId: string) => void;
  onExecuteBackendValidation: (requestId: string, simulateTamper?: boolean) => void;
  onViewAuditTrail: (requestId?: string) => void;
  onViewCertificateDetails: (credential: AcademicCredential) => void;
  onSwitchToStudentView: () => void;
}

export const EmployerPortal: React.FC<EmployerPortalProps> = ({
  students,
  requests,
  onSubmitRequest,
  onSimulateConsentApproval,
  onExecuteBackendValidation,
  onViewAuditTrail,
  onViewCertificateDetails,
  onSwitchToStudentView,
}) => {
  // Form fields
  const [employerName, setEmployerName] = useState('Tata Consultancy Services');
  const [verifierName, setVerifierName] = useState('Kavitha Ramachandran');
  const [verifierEmail, setVerifierEmail] = useState('kavitha.demo@tcs.example.com');
  const [apaarInput, setApaarInput] = useState('2990 9583 2586');
  const [purpose, setPurpose] = useState('Pre-Employment Background Verification for Systems Engineer (Req #TCS-2026-CHN)');
  const [selectedCredTypes, setSelectedCredTypes] = useState<AcademicCredential['type'][]>([
    'DEGREE',
    'MARKSHEET',
    'AICTE_APPROVAL',
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string>(
    requests.length > 0 ? requests[0].id : ''
  );
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [qrScanSuccessToast, setQrScanSuccessToast] = useState<{
    studentName: string;
    apaarId: string;
    requestId?: string;
  } | null>(null);

  // Active request currently selected in employer view
  const activeRequest = requests.find(r => r.id === selectedRequestId) || requests[0];
  const targetStudent = activeRequest ? students.find(s => s.apaarId === activeRequest.studentApaarId) : null;

  const handleApaarChange = (val: string) => {
    setApaarInput(formatApaarId(val));
    setFormError(null);
  };

  const handleToggleCredType = (type: AcademicCredential['type']) => {
    setSelectedCredTypes(prev => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev;
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateApaarId(apaarInput);
    if (!validation.isValid) {
      setFormError(validation.error || 'Invalid APAAR ID');
      return;
    }

    const res = onSubmitRequest({
      employerName,
      verifierName,
      verifierEmail,
      studentApaarId: apaarInput,
      requestedCredentials: selectedCredTypes,
      purpose,
    });

    if (!res.success) {
      setFormError(res.error || 'Failed to submit request.');
    } else if (res.requestId) {
      setSelectedRequestId(res.requestId);
      setFormError(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 4-Step Verification Workflow Architecture Banner */}
      <div className="bg-[#111927] border border-slate-800 rounded-xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              Employer Academic Background Verification (BGV) System
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              End-to-end 4-step workflow: Request Initiation → Student DPDP Consent Handshake → AICTE Central & DigiLocker PKI Cross-Verification → Cryptographic Audit Trail.
            </p>
          </div>
        </div>

        {/* 4 Steps Stepper visualizer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">1</span>
              <span>Verification Request</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Employer inputs student's 12-digit APAAR ID and submits verification petition.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">2</span>
              <span>Student Consent</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              DPDP Act rule: instant push notification to student; data locked until approved.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">3</span>
              <span>Backend Validation</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Node.js backend queries AICTE & DigiLocker, validating X.509 PKI signatures & SHA-256 hash.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">4</span>
              <span>Result & Audit Trail</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Verified dossier displayed on dashboard; immutable log saved with cryptographic hash.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column (5 cols): Step 1 Initiation Form */}
        <div className="lg:col-span-5 bg-[#111927] border border-slate-800 rounded-xl p-6 shadow-md space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                Step 1: Initiate Background Verification Request
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Scan candidate's physical APAAR card or enter 12-digit ID to dispatch an authenticated verification petition.
              </p>
            </div>
          </div>

          {/* Optical QR Scanner Quick Action Banner */}
          <button
            type="button"
            onClick={() => setIsQrScannerOpen(true)}
            className="w-full p-3.5 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/20 hover:from-amber-500/25 hover:to-amber-500/25 text-amber-300 border-2 border-amber-500/50 hover:border-amber-400 rounded-xl font-bold flex items-center justify-between transition-all group shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Scan Physical APAAR Card QR</span>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-extrabold flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" />
                    Auto BGV
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-normal">
                  Live camera scanning or interactive physical card deck
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform shrink-0">
              <span className="hidden sm:inline">Launch Scanner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* QR Scan Success Toast */}
          {qrScanSuccessToast && (
            <div className="p-3 bg-emerald-950/90 border border-emerald-600 text-emerald-200 rounded-lg flex items-start justify-between gap-2 text-xs animate-in fade-in">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">
                    Physical Card Scanned: {qrScanSuccessToast.studentName}
                  </span>
                  <div className="text-[11px] text-emerald-300 font-mono mt-0.5">
                    APAAR ID {qrScanSuccessToast.apaarId} loaded.{' '}
                    {qrScanSuccessToast.requestId
                      ? `BGV Request #${qrScanSuccessToast.requestId} automatically dispatched.`
                      : 'Candidate details prefilled.'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQrScanSuccessToast(null)}
                className="text-emerald-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Candidate APAAR ID input with inline Scan QR button */}
            <div className="space-y-1.5">
              <label htmlFor="apaar-input" className="text-slate-300 font-semibold block">
                Candidate 12-Digit APAAR ID <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="apaar-input"
                  type="text"
                  value={apaarInput}
                  onChange={e => handleApaarChange(e.target.value)}
                  placeholder="XXXX XXXX XXXX"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-24 py-2 text-sm text-amber-400 font-mono tracking-wider focus:outline-none focus:border-amber-500"
                  maxLength={14}
                />
                <button
                  type="button"
                  onClick={() => setIsQrScannerOpen(true)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Scan physical APAAR card with camera or card deck"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Scan QR</span>
                </button>
              </div>
              {/* Dynamic Quick load chips including newly created students */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
                <span>Quick pick candidate:</span>
                {students.slice(0, 5).map(s => (
                  <button
                    key={s.apaarId}
                    type="button"
                    onClick={() => handleApaarChange(s.apaarId)}
                    className={`px-2 py-0.5 rounded border transition-colors ${
                      apaarInput === s.apaarId
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-semibold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    {s.name} ({s.district})
                  </button>
                ))}
              </div>
            </div>


            {/* Employer info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="employer-select" className="text-slate-300 font-semibold block">
                  Employer Entity
                </label>
                <select
                  id="employer-select"
                  value={employerName}
                  onChange={e => setEmployerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Tata Consultancy Services">Tata Consultancy Services (TCS)</option>
                  <option value="Zoho Corporation">Zoho Corporation</option>
                  <option value="Infosys Limited">Infosys Limited</option>
                  <option value="Cognizant Technology Solutions">Cognizant Technology Solutions</option>
                  <option value="Google India Pvt Ltd">Google India Pvt Ltd</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="verifier-name-input" className="text-slate-300 font-semibold block">
                  HR Verifier Name
                </label>
                <input
                  id="verifier-name-input"
                  type="text"
                  value={verifierName}
                  onChange={e => setVerifierName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="verifier-email-input" className="text-slate-300 font-semibold block">
                Official Verifier Work Email
              </label>
              <input
                id="verifier-email-input"
                type="email"
                value={verifierEmail}
                onChange={e => setVerifierEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Credentials to check */}
            <div className="space-y-2">
              <label className="text-slate-300 font-semibold block">
                Credentials to Verify (AICTE & DigiLocker)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'DEGREE', label: 'Degree Certificate' },
                  { key: 'MARKSHEET', label: 'Consolidated Marksheet' },
                  { key: 'AICTE_APPROVAL', label: 'AICTE Approval Check' },
                  { key: 'ABC_TRANSCRIPT', label: 'ABC Credit Transcript' },
                ].map(cred => (
                  <label
                    key={cred.key}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      selectedCredTypes.includes(cred.key as any)
                        ? 'bg-amber-950/40 border-amber-500/60 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCredTypes.includes(cred.key as any)}
                      onChange={() => handleToggleCredType(cred.key as any)}
                      className="accent-amber-500 rounded"
                    />
                    <span className="text-[11px] font-medium">{cred.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="purpose-input" className="text-slate-300 font-semibold block">
                Verification Purpose (DPDP Compliance requirement)
              </label>
              <textarea
                id="purpose-input"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors shadow-md text-xs"
            >
              <Send className="w-4 h-4" />
              <span>Send Background Verification Request</span>
            </button>
          </form>

          {/* Quick Request Selector */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-slate-400 text-xs font-semibold block">
              Active Employer Verification Records:
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {requests.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRequestId(r.id)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                    selectedRequestId === r.id
                      ? 'bg-amber-950/40 border-amber-500/80 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="truncate">
                    <span className="font-semibold block truncate">{r.studentName} ({r.studentApaarId})</span>
                    <span className="text-[10px] text-slate-400">{r.employerName} · #{r.id}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                      r.status === 'VERIFIED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : r.status === 'PENDING_STUDENT_CONSENT'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : r.status === 'CONSENT_REVOKED'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {r.status === 'PENDING_STUDENT_CONSENT' ? 'PENDING CONSENT' : r.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column (7 cols): Steps 2, 3, and 4 Workflow Viewer */}
        <div className="lg:col-span-7 space-y-6">
          {activeRequest ? (
            <div className="bg-[#111927] border border-slate-800 rounded-xl p-6 shadow-md space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded">
                      Request ID: {activeRequest.id}
                    </span>
                    <span className="text-xs text-slate-400">
                      Logged at {new Date(activeRequest.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {activeRequest.studentName} — APAAR: {activeRequest.studentApaarId}
                  </h3>
                </div>

                {/* Status indicator */}
                <div>
                  {activeRequest.status === 'PENDING_STUDENT_CONSENT' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/80 text-amber-400 text-xs font-semibold">
                      <Clock className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Step 2: Awaiting Student Consent</span>
                    </div>
                  )}
                  {activeRequest.status === 'CONSENT_GRANTED' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-950/60 border border-sky-500/80 text-sky-400 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-sky-400" />
                      <span>Consent Granted · Ready for Backend Validation</span>
                    </div>
                  )}
                  {activeRequest.status === 'VERIFYING' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/80 text-indigo-400 text-xs font-semibold">
                      <Cpu className="w-4 h-4 animate-pulse text-indigo-400" />
                      <span>Step 3: Querying AICTE & DigiLocker PKI...</span>
                    </div>
                  )}
                  {activeRequest.status === 'VERIFIED' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/80 text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Step 4: Cryptographically Verified</span>
                    </div>
                  )}
                  {activeRequest.status === 'CONSENT_REVOKED' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-500/80 text-rose-400 text-xs font-bold">
                      <Ban className="w-4 h-4 text-rose-400" />
                      <span>Access Revoked by Student (DPDP Act)</span>
                    </div>
                  )}
                  {activeRequest.status === 'TAMPERED_FAILED' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-500/80 text-rose-400 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Tamper Detected · Digital Signature Failed</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2 Section: Student Consent Notification status */}
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-amber-400" />
                    Step 2: DPDP Student Consent Handshake
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Candidate: {activeRequest.studentName}
                  </span>
                </div>

                {activeRequest.status === 'PENDING_STUDENT_CONSENT' ? (
                  <div className="space-y-3">
                    <p className="text-slate-300 text-xs leading-relaxed">
                      An encrypted consent notification has been dispatched to candidate's registered mobile device and APAAR Student Consent Portal. Academic data remains locked until the student explicitly grants permission.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        onClick={() => onSimulateConsentApproval(activeRequest.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Simulate Candidate Approving in App</span>
                      </button>

                      <button
                        onClick={onSwitchToStudentView}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Student Dashboard to Review</span>
                      </button>
                    </div>
                  </div>
                ) : activeRequest.status === 'CONSENT_REVOKED' ? (
                  <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded text-rose-300 space-y-1">
                    <div className="font-semibold flex items-center gap-1">
                      <Ban className="w-3.5 h-3.5" />
                      <span>Consent Revoked by Student</span>
                    </div>
                    <p className="text-[11px] text-rose-400">
                      Reason: "{activeRequest.revocationReason || 'Candidate withdrew consent under Section 6 of DPDP Act 2023'}". Employer access token has been purged.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Consent approved by student on {activeRequest.consentGrantedAt ? new Date(activeRequest.consentGrantedAt).toLocaleString() : 'Recent timestamp'}.
                    </span>
                  </div>
                )}
              </div>

              {/* Step 3 Section: Backend AICTE & DigiLocker PKI Validation */}
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    Step 3: Node.js Backend & AICTE / DigiLocker Cross-Validation
                  </span>
                  {activeRequest.backendValidation && (
                    <span className="font-mono text-[10px] text-slate-400">
                      Latency: {activeRequest.backendValidation.networkLatencyMs}ms
                    </span>
                  )}
                </div>

                {activeRequest.status === 'CONSENT_GRANTED' && (
                  <div className="space-y-3">
                    <p className="text-slate-300 text-xs">
                      Student consent verified. The Node.js backend is ready to query AICTE Central Repository & DigiLocker to cross-verify the X.509 digital signature and SHA-256 integrity hash.
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => onExecuteBackendValidation(activeRequest.id, false)}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg shadow-sm transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Run AICTE Digital Signature Cross-Verification</span>
                      </button>

                      {/* Tamper simulation tester */}
                      <button
                        onClick={() => onExecuteBackendValidation(activeRequest.id, true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-300 hover:text-white bg-rose-950/80 hover:bg-rose-900 border border-rose-800 rounded-lg transition-colors"
                        title="Simulate candidate presenting an edited/tampered certificate to test PKI mismatch alert"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Test Fake/Tampered Record Detection</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeRequest.backendValidation && (
                  <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
                      <span>Repository: {activeRequest.backendValidation.repositoryChecked}</span>
                      <span>Algorithm: {activeRequest.backendValidation.signatureAlgorithm}</span>
                    </div>

                    <div className="text-slate-300">
                      <span className="text-slate-500 block text-[10px]">Root Certifying Authority (CA):</span>
                      <span>{activeRequest.backendValidation.issuerCA}</span>
                    </div>

                    <div className="text-slate-300">
                      <span className="text-slate-500 block text-[10px]">X.509 Serial:</span>
                      <span className="text-amber-400">{activeRequest.backendValidation.certificateSerial}</span>
                    </div>

                    <div className="truncate text-slate-300">
                      <span className="text-slate-500 block text-[10px]">SHA-256 Digest Fingerprint:</span>
                      <span className="text-emerald-400">{activeRequest.backendValidation.sha256Digest}</span>
                    </div>

                    {activeRequest.backendValidation.isTampered && (
                      <div className="p-2 bg-rose-950 border border-rose-800 text-rose-400 text-xs rounded mt-2">
                        {activeRequest.backendValidation.tamperDetails}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 4 Section: Result Dossier & Audit Trail Link */}
              {activeRequest.status === 'VERIFIED' && targetStudent && targetStudent.credentials.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-emerald-400" />
                      Step 4: Official Verified Background Verification Dossier
                    </h4>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewAuditTrail(activeRequest.id)}
                        className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>View Audit Trail</span>
                      </button>
                    </div>
                  </div>

                  {/* Visual Certificate Card */}
                  <div className="bg-gradient-to-b from-[#142033] to-[#0f1725] border-2 border-emerald-500/40 rounded-xl p-6 relative overflow-hidden shadow-xl">
                    {/* Watermark badge */}
                    <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                      <ShieldCheck className="w-48 h-48 text-emerald-400" />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded tracking-wide uppercase">
                          AICTE & DigiLocker Authenticated
                        </span>
                        <h3 className="text-base font-bold text-white mt-1.5">
                          {targetStudent.credentials[0]?.title}
                        </h3>
                        <p className="text-xs text-slate-300">
                          {targetStudent.credentials[0]?.issuingInstitution}
                        </p>
                      </div>

                      <div className="w-14 h-14 bg-white p-1 rounded-lg shrink-0 flex items-center justify-center shadow-md">
                        <QrCode className="w-12 h-12 text-slate-900" />
                      </div>
                    </div>

                    {/* Metadata grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/60 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Student Name:</span>
                        <strong className="text-white">{targetStudent.name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">APAAR ID:</span>
                        <span className="font-mono text-amber-400 font-bold">{targetStudent.apaarId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">CGPA / Grade:</span>
                        <strong className="text-emerald-400">{targetStudent.credentials[0]?.cgpaOrPercentage}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Year of Passing:</span>
                        <strong className="text-white">{targetStudent.credentials[0]?.yearOfPassing}</strong>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span>
                        AICTE Accreditation: <strong className="text-slate-200">{targetStudent.credentials[0]?.aicteApprovalNumber}</strong>
                      </span>
                      <button
                        onClick={() => onViewCertificateDetails(targetStudent.credentials[0])}
                        className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect PKI Chain</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#111927] border border-slate-800 rounded-xl p-10 text-center text-xs text-slate-400">
              Select or submit a verification request to view the live workflow.
            </div>
          )}
        </div>
      </div>

      {/* Physical APAAR Card QR Scanner Modal */}
      <ApaarQrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        students={students}
        defaultEmployerName={employerName}
        defaultVerifierName={verifierName}
        defaultVerifierEmail={verifierEmail}
        defaultRequestedCredentials={selectedCredTypes}
        defaultPurpose={purpose}
        onSubmitRequest={onSubmitRequest}
        onScanSuccess={({ student, autoTriggered, requestId }) => {
          handleApaarChange(student.apaarId);
          if (requestId) {
            setSelectedRequestId(requestId);
          }
          setQrScanSuccessToast({
            studentName: student.name,
            apaarId: student.apaarId,
            requestId,
          });
          setTimeout(() => {
            setQrScanSuccessToast(null);
          }, 8000);
        }}
      />
    </div>
  );
};
