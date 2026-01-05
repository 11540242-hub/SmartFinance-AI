
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, getDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction, BankAccount, TransactionType, CATEGORIES } from '../types';

interface TransactionsProps {
  user: User;
}

const Transactions: React.FC<TransactionsProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES.EXPENSE[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // Fetch Accounts
    const qAcc = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const unsubAcc = onSnapshot(qAcc, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as BankAccount));
      setAccounts(data);
      if (data.length > 0) setAccountId(data[0].id);
    });

    // Fetch Transactions
    const qTrans = query(
      collection(db, 'transactions'), 
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );
    const unsubTrans = onSnapshot(qTrans, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });

    return () => {
      unsubAcc();
      unsubTrans();
    };
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return alert('請先建立銀行帳戶');

    const numAmount = parseFloat(amount);
    try {
      // 1. Add transaction
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        accountId,
        type,
        amount: numAmount,
        category,
        description,
        date: new Date(date).getTime()
      });

      // 2. Update account balance
      const accountRef = doc(db, 'accounts', accountId);
      const accountSnap = await getDoc(accountRef);
      if (accountSnap.exists()) {
        const currentBalance = accountSnap.data().balance;
        const newBalance = type === TransactionType.INCOME 
          ? currentBalance + numAmount 
          : currentBalance - numAmount;
        await updateDoc(accountRef, { balance: newBalance });
      }

      setIsModalOpen(false);
      setAmount('');
      setDescription('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (t: Transaction) => {
    if (!confirm('確定刪除此紀錄？帳戶餘額將會自動調整。')) return;
    
    try {
      // Adjust balance back
      const accountRef = doc(db, 'accounts', t.accountId);
      const accountSnap = await getDoc(accountRef);
      if (accountSnap.exists()) {
        const currentBalance = accountSnap.data().balance;
        const newBalance = t.type === TransactionType.INCOME 
          ? currentBalance - t.amount 
          : currentBalance + t.amount;
        await updateDoc(accountRef, { balance: newBalance });
      }
      await deleteDoc(doc(db, 'transactions', t.id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">收支明細</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          記錄一筆
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">日期</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">分類</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">說明</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">金額</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(t.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    t.type === TransactionType.INCOME ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {t.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">{t.description || '-'}</td>
                <td className={`px-6 py-4 text-sm font-bold text-right ${
                  t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'
                }`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'}{t.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(t)} className="text-slate-300 hover:text-red-500 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">尚無任何交易紀錄</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">新增財務紀錄</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => { setType(TransactionType.EXPENSE); setCategory(CATEGORIES.EXPENSE[0]); }}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition ${type === TransactionType.EXPENSE ? 'bg-white text-red-600 shadow' : 'text-slate-500'}`}
                >支出</button>
                <button
                  type="button"
                  onClick={() => { setType(TransactionType.INCOME); setCategory(CATEGORIES.INCOME[0]); }}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition ${type === TransactionType.INCOME ? 'bg-white text-green-600 shadow' : 'text-slate-500'}`}
                >收入</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">日期</label>
                  <input type="date" className="w-full px-4 py-2 border rounded-lg" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">金額</label>
                  <input type="number" required className="w-full px-4 py-2 border rounded-lg" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">銀行帳戶</label>
                <select className="w-full px-4 py-2 border rounded-lg" value={accountId} onChange={e => setAccountId(e.target.value)}>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (餘額: {a.balance})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">分類</label>
                <select className="w-full px-4 py-2 border rounded-lg" value={category} onChange={e => setCategory(e.target.value)}>
                  {(type === TransactionType.EXPENSE ? CATEGORIES.EXPENSE : CATEGORIES.INCOME).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">描述</label>
                <input type="text" className="w-full px-4 py-2 border rounded-lg" value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">取消</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">儲存紀錄</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
