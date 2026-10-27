/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Search,
  Users,
  BarChart3,
  History,
  ArrowRightLeft,
  Bell,
  FileCheck2,
  UserPlus,
  Sun,
  Moon,
  HelpCircle,
  ChevronDown,
  Building2,
  GraduationCap,
  Briefcase,
  ShieldAlert,
  Check,
  PlusCircle,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { UserAccount, UserRole } from '../types/auth';

export type ActiveTab =
  | 'employer-bgv'
  | 'doc-verification'
  | 'student-portal'
  | 'registry'
  | 'lookup'
  | 'insights'
  | 'audit-trail';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingConsentCount: number;
  activeStudentName: string;
  onOpenNotificationModal?: () => void;
  onOpenCreateStudentModal?: () => void;
  onOpenCreateAccountModal?: () => void;
  onOpenGuideModal?: () => void;
  unreadAlertCount?: number;
  currentUser: UserAccount;
  allAccounts: UserAccount[];
  onSelectUser: (user: UserAccount) => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingConsentCount,
  activeStudentName,
  onOpenNotificationModal,
  onOpenCreateStudentModal,
  onOpenCreateAccountModal,
  onOpenGuideModal,
  unreadAlertCount = 0,
  currentUser,
  allAccounts,
  onSelectUser,
  onSignOut,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Close account menu when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'STUDENT':
        return {
          icon: <GraduationCap className="w-3 h-3 text-emerald-500" />,
          label: 'Student',
          bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        };
      case 'EMPLOYER':
        return {
          icon: <Building2 className="w-3 h-3 text-amber-500" />,
          label: 'Employer',
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
      case 'INSTITUTION':
        return {
          icon: <Briefcase className="w-3 h-3 text-blue-500" />,
          label: 'Institution',
          bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        };
      case 'REGULATOR':
        return {
          icon: <ShieldAlert className="w-3 h-3 text-purple-500" />,
          label: 'Auditor',
          bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        };
    }
  };

  const activeRoleBadge = getRoleBadge(currentUser.role);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0c121d]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/90 shadow-xs dark:shadow-md transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-sm shadow-xs ring-1 ring-amber-400/30">
              A
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base tracking-tight whitespace-nowrap">
                  APAAR
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hidden xs:inline">
                  REGISTRY
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal hidden md:inline">
                One Nation, One Student ID · NEP 2020
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab('employer-bgv')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'employer-bgv'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Employer BGV</span>
            </button>

            <button
              onClick={() => setActiveTab('doc-verification')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'doc-verification'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Doc Verify</span>
            </button>

            <button
              onClick={() => setActiveTab('student-portal')}
              className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'student-portal'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Student Consent</span>
              {pendingConsentCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                  {pendingConsentCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('registry')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'registry'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Registry</span>
            </button>

            <button
              onClick={() => setActiveTab('lookup')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'lookup'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Lookup</span>
            </button>

            <button
              onClick={() => setActiveTab('insights')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'insights'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Insights</span>
            </button>

            <button
              onClick={() => setActiveTab('audit-trail')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'audit-trail'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
            </button>
          </nav>

          {/* Zone 3: Actions, Theme, Accounts & Notifications */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Guide / How It Works Button */}
            {onOpenGuideModal && (
              <button
                onClick={onOpenGuideModal}
                aria-label="Open APAAR portal guide and help"
                title="How APAAR Portal Works (எளிமையான வழிகாட்டி)"
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Guide</span>
              </button>
            )}

            {/* Register Student Button */}
            {onOpenCreateStudentModal && (
              <button
                onClick={onOpenCreateStudentModal}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xs transition-all whitespace-nowrap shrink-0 ring-1 ring-emerald-400/40"
                title="Create / Register a new Student with APAAR ID"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Student</span>
              </button>
            )}

            {/* Notification Alerts Bell */}
            {onOpenNotificationModal && (
              <button
                onClick={onOpenNotificationModal}
                className="relative p-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
                title="View Real-Time SMS / Email Verification Alerts Simulator"
              >
                <Bell className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                {unreadAlertCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadAlertCount}
                  </span>
                )}
              </button>
            )}

            {/* Active User Account Switcher Menu */}
            <div className="relative" ref={accountMenuRef}>
              <button
                onClick={() => setIsAccountMenuOpen(prev => !prev)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all text-xs"
                title="Active Account & Role Switcher"
                aria-expanded={isAccountMenuOpen}
              >
                <div
                  className={`w-6 h-6 rounded-md ${currentUser.avatarBg || 'bg-amber-500'} text-white font-bold flex items-center justify-center text-[11px] shadow-xs`}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex flex-col text-left hidden sm:flex">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-white max-w-[110px] truncate leading-tight">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1 py-0.2 rounded border ${activeRoleBadge.bg}`}
                    >
                      {activeRoleBadge.label}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-[#101826] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-[60] transition-colors animate-in fade-in duration-150">
                  {/* Current User Card */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${currentUser.avatarBg || 'bg-amber-500'} text-white font-black flex items-center justify-center text-sm shadow-xs`}
                      >
                        {currentUser.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {currentUser.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {currentUser.organization}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded border mt-1 ${activeRoleBadge.bg}`}
                        >
                          {activeRoleBadge.icon}
                          <span>{currentUser.designation || activeRoleBadge.label}</span>
                        </span>
                      </div>
                    </div>
                    {currentUser.apaarId && (
                      <div className="mt-2 text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg px-2 py-1 flex items-center justify-between font-mono">
                        <span>APAAR ID:</span>
                        <span className="font-bold">{currentUser.apaarId}</span>
                      </div>
                    )}
                  </div>

                  {/* Switch Account Section */}
                  <div className="p-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Switch User Account ({allAccounts.length}):
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1 mt-1">
                      {allAccounts.map(account => {
                        const isCurrent = account.id === currentUser.id;
                        const roleInfo = getRoleBadge(account.role);
                        return (
                          <button
                            key={account.id}
                            onClick={() => {
                              onSelectUser(account);
                              setIsAccountMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors text-xs ${
                              isCurrent
                                ? 'bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 font-semibold'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-6 h-6 rounded-md ${account.avatarBg || 'bg-slate-600'} text-white font-bold flex items-center justify-center text-[10px] shrink-0`}
                              >
                                {account.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                                  {account.name}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  {account.organization}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleInfo.bg}`}
                              >
                                {roleInfo.label}
                              </span>
                              {isCurrent && <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions: Create New Account & Guide */}
                  <div className="p-2 bg-slate-50 dark:bg-slate-900/40 space-y-1">
                    {onOpenCreateAccountModal && (
                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          onOpenCreateAccountModal();
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
                      >
                        <PlusCircle className="w-4 h-4 text-amber-500" />
                        <span>+ Create New Account (Puthiya Kanakku)</span>
                      </button>
                    )}
                    {onOpenGuideModal && (
                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          onOpenGuideModal();
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                      >
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                        <span>How APAAR Works (Valikaatti)</span>
                      </button>
                    )}
                    {onSignOut && (
                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          onSignOut();
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out / Login Page (Veliyeru)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Direct Sign Out / Login Page Button */}
            {onSignOut && (
              <button
                onClick={onSignOut}
                title="Sign Out to Login Gateway Page"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
