/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Student, AcademicCredential } from '../types';
import { generateHash } from '../utils/verificationEngine';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Building2,
  Lock,
  Download,
  Eye,
  RefreshCw,
  Search,
  ExternalLink,
  Award,
  FileText,
  BadgeCheck,
} from 'lucide-react';

interface DocumentSlot {
  slotId: string;
  slotName: string;
  documentType: string;
  category: 'Higher Education' | 'Schooling' | 'Regulatory' | 'Credits';
  issuingBody: string;
  documentNumber: string;
  digilockerUri: string;
  status: 'VERIFIED' | 'TAMPER_ALERT' | 'PENDING_VERIFICATION' | 'NOT_UPLOADED';
  cgpaOrMarks: string;
  passingYear: string;
  sha256Digest: string;
  pkiAlgorithm: string;
  rootCA: string;
  verifiedAt: string;
  tamperReason?: string;
}

interface DocumentVerificationViewProps {
  students: Student[];
  onViewCertificateDetails: (credential: AcademicCredential) => void;
  onLogAuditAction: (action: any, details: string, level: 'SUCCESS' | 'ALERT' | 'INFO') => void;
}

export const DocumentVerificationView: React.FC<DocumentVerificationViewProps> = ({
  students,
  onViewCertificateDetails,
  onLogAuditAction,
}) => {
  const [selectedStudentApaar, setSelectedStudentApaar] = useState('2990 9583 2586');
  const [activeSlotId, setActiveSlotId] = useState<string>('slot-degree');
  const [isVerifying, setIsVerifying] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const activeStudent =
    students.find(s => s.apaarId === selectedStudentApaar) || students[2] || students[0];

  // Document verification slots customized for this student
  const [slots, setSlots] = useState<Record<string, DocumentSlot[]>>({
    '2990 9583 2586': [
      {
        slotId: 'slot-degree',
        slotName: 'Slot 1: Bachelor of Technology (B.Tech) Degree Certificate',
        documentType: 'DEGREE',
        category: 'Higher Education',
        issuingBody: 'Institute of Technology, Attur / Anna University',
        documentNumber: 'AU-DEG-2023-882109',
        digilockerUri: 'in.gov.digilocker.annauniv.deg.2023.299095832586',
        status: 'VERIFIED',
        cgpaOrMarks: '8.82 CGPA (First Class with Distinction)',
        passingYear: '2023',
        sha256Digest: generateHash('CRED-ATTUR-DEG-01|B.Tech IT|Institute of Technology, Attur|2023|8.82 CGPA'),
        pkiAlgorithm: 'RSA-SHA256 (2048-bit)',
        rootCA: 'AICTE Central Root CA - National Academic Depository',
        verifiedAt: '24 Oct 2026, 10:02 AM',
      },
      {
        slotId: 'slot-marksheet',
        slotName: 'Slot 2: Consolidated Statement of Grades (Semesters 1-8)',
        documentType: 'MARKSHEET',
        category: 'Higher Education',
        issuingBody: 'Controller of Examinations, Anna University',
        documentNumber: 'AU-CSG-2023-99412',
        digilockerUri: 'in.gov.digilocker.annauniv.csg.2023.299095832586',
        status: 'VERIFIED',
        cgpaOrMarks: '8.82 CGPA / 164 Credits Cleared',
        passingYear: '2023',
        sha256Digest: generateHash('AU-CSG-MARKSHEET-299095832586'),
        pkiAlgorithm: 'RSA-SHA256 (2048-bit)',
        rootCA: 'Anna University Examination Board PKI Authority',
        verifiedAt: '24 Oct 2026, 10:02 AM',
      },
      {
        slotId: 'slot-abc',
        slotName: 'Slot 3: Academic Bank of Credits (ABC) Digital Ledger',
        documentType: 'ABC_TRANSCRIPT',
        category: 'Credits',
        issuingBody: 'Academic Bank of Credits, Ministry of Education',
        documentNumber: 'ABC-MOE-2023-1192803',
        digilockerUri: 'in.gov.abc.transcript.2023.299095832586',
        status: 'VERIFIED',
        cgpaOrMarks: '164 Valid Verified Transferable Credits',
        passingYear: '2023',
        sha256Digest: generateHash('ABC-TRANSCRIPT-299095832586'),
        pkiAlgorithm: 'ECDSA-SHA256',
        rootCA: 'National Educational Technology Forum (NETF) Root CA',
        verifiedAt: '24 Oct 2026, 10:02 AM',
      },
      {
        slotId: 'slot-aicte',
        slotName: 'Slot 4: AICTE National Accreditation & Program Recognition',
        documentType: 'AICTE_APPROVAL',
        category: 'Regulatory',
        issuingBody: 'All India Council for Technical Education (AICTE)',
        documentNumber: 'AICTE-TN-ENG-2019-8812',
        digilockerUri: 'in.gov.aicte.registry.cert.2023.299095832586',
        status: 'VERIFIED',
        cgpaOrMarks: 'Approved B.Tech Program (Tier-1 NBA Accredited)',
        passingYear: '2019-2023',
        sha256Digest: generateHash('AICTE-APPROVAL-299095832586'),
        pkiAlgorithm: 'RSA-SHA256 (2048-bit)',
        rootCA: 'Ministry of Education Government PKI Authority',
        verifiedAt: '24 Oct 2026, 10:02 AM',
      },
      {
        slotId: 'slot-hsc',
        slotName: 'Slot 5: Higher Secondary Certificate (Class 12 - HSC)',
        documentType: 'SCHOOL_HSC',
        category: 'Schooling',
        issuingBody: 'Tamil Nadu State Board of School Examinations (TNDGE)',
        documentNumber: 'TNDGE-HSC-2019-44129',
        digilockerUri: 'in.gov.digilocker.tndge.hsc.2019.299095832586',
        status: 'VERIFIED',
        cgpaOrMarks: '562 / 600 (93.66% Physics/Chemistry/Maths/CS)',
        passingYear: '2019',
        sha256Digest: generateHash('TNDGE-HSC-2019-299095832586'),
        pkiAlgorithm: 'RSA-SHA256',
        rootCA: 'Tamil Nadu State e-Governance Agency (TNeGA) CA',
        verifiedAt: '24 Oct 2026, 10:03 AM',
      },
      {
        slotId: 'slot-sslc',
        slotName: 'Slot 6: Secondary School Leaving Certificate (Class 10 - SSLC)',
        documentType: 'SCHOOL_SSLC',
        category: 'Schooling',
        issuingBody: 'Department of Government Examinations, Chennai',
        documentNumber: 'TNDGE-SSLC-2017-88120',
        digilockerUri: 'in.gov.digilocker.tndge.sslc.2017.299095832586',
        status: 'VERIFIED',
        cgpaOrMarks: '481 / 500 (96.20%)',
        passingYear: '2017',
        sha256Digest: generateHash('TNDGE-SSLC-2017-299095832586'),
        pkiAlgorithm: 'RSA-SHA256',
        rootCA: 'Tamil Nadu State e-Governance Agency (TNeGA) CA',
        verifiedAt: '24 Oct 2026, 10:03 AM',
      },
    ],
  });

  const currentSlots = slots[selectedStudentApaar] || slots['2990 9583 2586'];
  const activeSlot = currentSlots.find(s => s.slotId === activeSlotId) || currentSlots[0];

  const filteredSlots = currentSlots.filter(s => {
    if (filterCategory === 'ALL') return true;
    return s.category === filterCategory;
  });

  // Re-verify slot action
  const handleVerifySlot = (slotId: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      setSlots(prev => ({
        ...prev,
        [selectedStudentApaar]: prev[selectedStudentApaar].map(s =>
          s.slotId === slotId
            ? {
                ...s,
                status: 'VERIFIED',
                verifiedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' Just Now',
                tamperReason: undefined,
              }
            : s
        ),
      }));
      setIsVerifying(false);
      onLogAuditAction(
        'DIGITAL_SIGNATURE_VERIFIED',
        `Document verification slot "${activeSlot.slotName}" cryptographically verified against DigiLocker & AICTE repository.`,
        'SUCCESS'
      );
    }, 600);
  };

  // Simulate Tampered / Fake document in this slot
  const handleSimulateTamper = (slotId: string) => {
    setSlots(prev => ({
      ...prev,
      [selectedStudentApaar]: prev[selectedStudentApaar].map(s =>
        s.slotId === slotId
          ? {
              ...s,
              status: 'TAMPER_ALERT',
              cgpaOrMarks: '9.98 CGPA (Tampered - Original: 8.82)',
              tamperReason: 'CRITICAL MISMATCH: SHA-256 payload digest differs from AICTE master ledger. Altered CGPA/Grade detected.',
              verifiedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' Just Now',
            }
          : s
      ),
    }));
    onLogAuditAction(
      'SECURITY_TAMPER_ALERT',
      `FRAUD ALERT in Document Verification Slot: Cryptographic hash mismatch on "${activeSlot.slotName}".`,
      'ALERT'
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-[#111927] border border-slate-800 rounded-xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-amber-400" />
              Academic Document Verification Slots
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Automated slot-by-slot verification of candidate academic records, transcripts, and marksheets via AICTE Central Repository & DigiLocker PKI.
            </p>
          </div>

          {/* Student Selector */}
          <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800 self-start md:self-auto">
            <span className="text-[11px] text-slate-400 font-semibold">Active Candidate:</span>
            <select
              value={selectedStudentApaar}
              onChange={e => setSelectedStudentApaar(e.target.value)}
              className="bg-transparent text-xs font-bold text-amber-400 focus:outline-none cursor-pointer"
            >
              <option value="2990 9583 2586" className="bg-slate-900 text-white">
                Abinaya S (Salem) - 2990 9583 2586 (6 Slots)
              </option>
              <option value="8686 2578 1740" className="bg-slate-900 text-white">
                Karthik M (Coimbatore) - 8686 2578 1740 (4 Slots)
              </option>
            </select>
          </div>
        </div>

        {/* Candidate Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-2 text-xs">
          <div>
            <span className="text-slate-400 block">Candidate Name:</span>
            <strong className="text-white text-sm">{activeStudent.name}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">APAAR ID:</span>
            <span className="font-mono text-amber-400 font-bold">{activeStudent.apaarId}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Current Institution:</span>
            <span className="text-slate-300 truncate block">{activeStudent.currentInstitution}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Verified Slots:</span>
            <span className="font-mono text-emerald-400 font-bold">
              {currentSlots.filter(s => s.status === 'VERIFIED').length} of {currentSlots.length} Verified
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Slot List (5 cols) & Right Slot Inspector (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Verification Slot Directory */}
        <div className="lg:col-span-5 bg-[#111927] border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-amber-400" />
              Document Verification Slots ({currentSlots.length})
            </h2>

            {/* Category filter */}
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-slate-900 text-[11px] text-slate-300 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Categories</option>
              <option value="Higher Education">Higher Education</option>
              <option value="Schooling">Schooling</option>
              <option value="Credits">Credits & ABC</option>
              <option value="Regulatory">Regulatory</option>
            </select>
          </div>

          {/* Slots list */}
          <div className="space-y-2.5">
            {filteredSlots.map(slot => {
              const isSelected = activeSlot.slotId === slot.slotId;
              return (
                <button
                  key={slot.slotId}
                  onClick={() => setActiveSlotId(slot.slotId)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs space-y-2 ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500 shadow-md text-white'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-100 text-xs truncate">
                      {slot.slotName}
                    </span>
                    {slot.status === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800 shrink-0 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        Tamper Alert
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                    <span>{slot.issuingBody}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-amber-400">{slot.passingYear}</span>
                    <span aria-hidden="true">·</span>
                    <span>{slot.category}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Document Slot Inspector */}
        <div className="lg:col-span-7 bg-[#111927] border border-slate-800 rounded-xl p-6 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                DOCUMENT VERIFICATION INSPECTOR
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">{activeSlot.slotName}</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleVerifySlot(activeSlot.slotId)}
                disabled={isVerifying}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                <span>Re-Verify Slot</span>
              </button>

              <button
                onClick={() => handleSimulateTamper(activeSlot.slotId)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 hover:text-white font-medium rounded-lg text-xs transition-colors"
                title="Test how tamper detection behaves if this certificate was manipulated"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Test Tamper</span>
              </button>
            </div>
          </div>

          {/* Tamper Warning Banner if slot failed */}
          {activeSlot.status === 'TAMPER_ALERT' && (
            <div className="p-4 bg-rose-950/80 border-2 border-rose-600 rounded-xl text-rose-300 space-y-2 text-xs animate-in fade-in duration-200">
              <div className="font-bold flex items-center gap-2 text-sm text-white">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>Cryptographic Signature Mismatch Detected!</span>
              </div>
              <p className="leading-relaxed text-[11px] text-rose-200">
                {activeSlot.tamperReason}
              </p>
              <div className="pt-2 border-t border-rose-900/80 flex items-center justify-between text-[11px]">
                <span>Status: REJECTED BY AICTE INTEGRITY RULE</span>
                <button
                  onClick={() => handleVerifySlot(activeSlot.slotId)}
                  className="underline font-bold text-rose-300 hover:text-white"
                >
                  Restore Authentic Document from Master Ledger
                </button>
              </div>
            </div>
          )}

          {/* Document Preview Card */}
          <div className="bg-gradient-to-b from-[#142033] to-[#0c1523] border border-slate-700/80 rounded-xl p-6 relative overflow-hidden shadow-lg space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                  AUTHENTICATED DIGILOCKER ISSUANCE
                </span>
                <h4 className="text-base font-bold text-white mt-1">{activeSlot.documentType.replace('_', ' ')}</h4>
                <p className="text-xs text-slate-300">{activeSlot.issuingBody}</p>
              </div>

              <div className="w-16 h-16 bg-white p-1 rounded-lg shrink-0 flex items-center justify-center shadow">
                <QrCode className="w-14 h-14 text-slate-950" />
              </div>
            </div>

            {/* Key Slot Fields */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/70 p-4 rounded-lg border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Score / Performance:</span>
                <strong className={activeSlot.status === 'TAMPER_ALERT' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {activeSlot.cgpaOrMarks}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Conferment Year:</span>
                <strong className="text-white">{activeSlot.passingYear}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Document / Reg No:</span>
                <strong className="text-amber-400 font-mono text-[11px]">{activeSlot.documentNumber}</strong>
              </div>
            </div>

            {/* DigiLocker URI */}
            <div className="text-[11px] font-mono text-slate-400 bg-slate-950/50 p-2.5 rounded border border-slate-800/80 break-all">
              <span className="text-slate-500">DigiLocker URI: </span>
              <span className="text-slate-200">{activeSlot.digilockerUri}</span>
            </div>
          </div>

          {/* Cryptographic Ledger Verification Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                PKI Signature Verification Matrix
              </span>
              <span className="text-[10px] text-emerald-400">
                Verified at: {activeSlot.verifiedAt}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-400 pt-1">
              <div>
                <span className="text-slate-500">Root Authority (CA): </span>
                <span className="text-slate-200">{activeSlot.rootCA}</span>
              </div>
              <div>
                <span className="text-slate-500">Algorithm: </span>
                <span className="text-amber-400">{activeSlot.pkiAlgorithm}</span>
              </div>
              <div className="break-all">
                <span className="text-slate-500">SHA-256 Checksum: </span>
                <span className={activeSlot.status === 'TAMPER_ALERT' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {activeSlot.sha256Digest}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px]">
              DPDP Act 2023 & IT Act 2000 Section 4 Compliant.
            </span>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export Verified Slot Dossier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
