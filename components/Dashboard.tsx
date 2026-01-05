
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { BankAccount, Transaction, TransactionType } from '../types';
import { getFinancialAdvice } from '../geminiService';

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const unsubAcc = onSnapshot(query(collection(db, 'accounts'), where('userId', '==', user.uid)), (snap) => {
      setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() } as BankAccount)));
    });
    const unsubTrans = onSnapshot(query(collection(db, 'transactions'), where('userId', '==', user.uid)), (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });
    return () => { unsubAcc(); unsubTrans(); };
  }, [user]);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const thisMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const monthIncome = thisMonthTransactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
  const monthExpense = thisMonthTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);

  const fetchAdvice = async () => {
    setIsAiLoading(true);
    const advice = await getFinancialAdvice(transactions, accounts);
    setAiAdvice(advice);
    setIsAiLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="總資產淨值" value={totalBalance} color="blue" />
        <StatCard title="本月總收入" value={monthIncome} color="green" />
        <StatCard title="本月總支出" value={monthExpense} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </span>
              AI 財務顧問建議
            </h3>
            {aiAdvice ? (
              <div className="prose prose-blue max-w-none text-slate-600 whitespace-pre-wrap">
                {aiAdvice}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4 text-sm">點擊下方按鈕，讓 Gemini 分析您的收支狀況並給予專業建議。</p>
                <button
                  onClick={fetchAdvice}
                  disabled={isAiLoading || transactions.length === 0}
                  className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isAiLoading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> AI 分析中...</>
                  ) : '獲取 AI 理財建議'}
                </button>
              </div>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold mb-4">最近活動</h3>
            <div className="space-y-4">
              {transactions.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{t.category}</div>
                    <div className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString()} · {t.description || '無描述'}</div>
                  </div>
                  <div className={`font-mono font-bold ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === TransactionType.INCOME ? '+' : '-'}{t.amount.toLocaleString()}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && <p className="text-center text-slate-400 py-4">目前沒有交易紀錄</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold mb-4">我的帳戶</h3>
            <div className="space-y-4">
              {accounts.map(acc => (
                <div key={acc.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">{acc.name}</div>
                    <div className="text-xs text-slate-400">{acc.type}</div>
                  </div>
                  <div className="font-mono text-sm font-bold text-slate-600">
                    NT$ {acc.balance.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number; color: 'blue' | 'green' | 'red' }> = ({ title, value, color }) => {
  const colors = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    green: 'text-green-600 bg-green-50 border-green-100',
    red: 'text-red-600 bg-red-50 border-red-100'
  };
  return (
    <div className={`p-6 rounded-2xl border ${colors[color]} shadow-sm`}>
      <div className="text-sm font-medium opacity-70 mb-2">{title}</div>
      <div className="text-2xl font-bold font-mono">
        <span className="text-lg mr-1 opacity-50">NT$</span>
        {value.toLocaleString()}
      </div>
    </div>
  );
};

export default Dashboard;
