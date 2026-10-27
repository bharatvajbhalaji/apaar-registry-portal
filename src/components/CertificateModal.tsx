/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AcademicCredential, Student } from '../types';
import { X, ShieldCheck, QrCode, Lock, Printer, Award, FileText, CheckCircle2 } from 'lucide-react';

interface CertificateModalProps {
  credential: AcademicCredential | null;
  student?: Student | null;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  credential,
  student,
  onClose,
}) => {
  if (!credential) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#111927] border border-slate-700 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-white text-sm">
              AICTE & DigiLocker PKI Authenticated Credential
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Container */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="bg-gradient-to-b from-[#162235] to-[#0d1624] border-2 border-amber-500/50 rounded-xl p-8 relative overflow-hidden text-center space-y-6 shadow-inner">
            {/* Top Emblems */}
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <div className="text-left">
                <span className="text-[10px] tracking-widest uppercase font-bold text-amber-400 block">
                  GOVERNMENT OF INDIA
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  Sample certificate · Prototype
                </span>
              </div>

              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
                <Award className="w-6 h-6" />
              </div>

              <div className="text-right">
                <span className="text-[10px] tracking-widest uppercase font-bold text-emerald-400 block">
                  DIGILOCKER VERIFIED
                </span>
                <span className="text-xs font-mono text-slate-400">
                  NAD-PKI-2023
                </span>
              </div>
            </div>

            {/* Main Text */}
            <div className="space-y-3 py-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
                {credential.title}
              </h2>
              <p className="text-xs text-slate-300 max-w-lg mx-auto">
                This is to certify that the academic record registered under APAAR ID{' '}
                <strong className="text-amber-400 font-mono">{student?.apaarId || '2990 9583 2586'}</strong> belonging to{' '}
                <strong className="text-white">{student?.name || 'Abinaya S'}</strong> has been awarded by
              </p>
              <h3 className="text-base font-bold text-amber-300">
                {credential.issuingInstitution}
              </h3>

              {/* Requirement 10: Print APAAR ID on degree certificates, next to the Student ID */}
              <div className="max-w-lg mx-auto mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/80 border border-amber-500/40 rounded-xl p-3 text-left">
                <div className="border-b sm:border-b-0 sm:border-r border-slate-800 pb-2 sm:pb-0 sm:pr-3">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 block">
                    APAAR ID (12-Digit National ID)
                  </span>
                  <span className="text-sm font-mono font-extrabold text-white tracking-wider">
                    {student?.apaarId || '2990 9583 2586'}
                  </span>
                </div>
                <div className="sm:pl-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 block">
                    Student ID / University Roll (PEN)
                  </span>
                  <span className="text-sm font-mono font-extrabold text-white tracking-wider">
                    {student?.pen || 'PEN-20238910421'}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Box */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-lg border border-slate-800 text-xs text-left">
              <div>
                <span className="text-slate-500 block text-[10px]">Grade / Performance:</span>
                <strong className="text-emerald-400">{credential.cgpaOrPercentage}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Year of Conferment:</span>
                <strong className="text-white">{credential.yearOfPassing}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">AICTE Approval Code:</span>
                <strong className="text-amber-400 font-mono">{credential.aicteApprovalNumber}</strong>
              </div>
            </div>

            {/* Bottom Signature Seals */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-amber-500/20 text-left text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 block">DigiLocker Document URI:</span>
                <code className="text-slate-300 text-[11px] font-mono break-all">
                  {credential.digilockerUri}
                </code>
              </div>

              <div className="w-16 h-16 bg-white p-1 rounded-lg shrink-0 flex items-center justify-center shadow">
                <QrCode className="w-14 h-14 text-slate-950" />
              </div>
            </div>
          </div>

          {/* Cryptographic PKI Breakdown */}
          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Lock className="w-4 h-4" />
              <span>X.509 Cryptographic Verification Ledger Details</span>
            </div>

            <div className="text-slate-400 space-y-1 pt-1 text-[11px]">
              <div>
                <span className="text-slate-500">Algorithm: </span>
                <span className="text-slate-200">RSA-SHA256 (2048 bit Key Length)</span>
              </div>
              <div>
                <span className="text-slate-500">Root CA: </span>
                <span className="text-slate-200">National Academic Depository (NAD) Root Authority</span>
              </div>
              <div>
                <span className="text-slate-500">Certificate Serial: </span>
                <span className="text-amber-400">{credential.issuerCertificateSerial}</span>
              </div>
              <div className="break-all">
                <span className="text-slate-500">SHA-256 Digest: </span>
                <span className="text-emerald-400">{credential.sha256Hash}</span>
              </div>
              <div className="break-all">
                <span className="text-slate-500">Digital Signature: </span>
                <span className="text-slate-400">{credential.digitalSignature}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            Certified authentic under Section 4 of the Information Technology Act 2000.
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow"
          >
            <Printer className="w-4 h-4" />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>
    </div>
  );
};
