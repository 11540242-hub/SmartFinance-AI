
import React from 'react';
import { User, signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  user: User;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, user }) => {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold text-blue-600 hidden md:block">SmartFinance AI</h1>
          <div className="hidden md:flex gap-4">
            <NavBtn label="總覽" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <NavBtn label="銀行帳戶" active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} />
            <NavBtn label="收支紀錄" active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
            <NavBtn label="視覺化報表" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400">目前使用者</p>
            <p className="text-sm font-medium text-slate-700">{user.email}</p>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
            title="登出"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

const NavBtn: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
    }`}
  >
    {label}
  </button>
);

export default Navbar;
