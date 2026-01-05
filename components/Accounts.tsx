
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { BankAccount } from '../types';

interface AccountsProps {
  user: User;
}

const Accounts: React.FC<AccountsProps> = ({ user }) => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('一般儲蓄');
  const [initialBalance, setInitialBalance] = useState('0');

  useEffect(() => {
    const q = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount));
      setAccounts(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'accounts'), {
        userId: user.uid,
        name,
        type,
        balance: parseFloat(initialBalance) || 0,
        createdAt: Date.now()
      });
      setName('');
      setInitialBalance('0');
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding account:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('確定要刪除此帳戶嗎？這將不會刪除相關的交易紀錄，但會導致顯示問題。')) {
      await deleteDoc(doc(db, 'accounts', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">我的銀行帳戶</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          新增帳戶
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative group">
            <button
              onClick={() => handleDelete(acc.id)}
              className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
            <div className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-1">{acc.type}</div>
            <h3 className="text-lg font-bold text-slate-700 mb-4">{acc.name}</h3>
            <div className="text-2xl font-mono font-bold text-slate-800">
              <span className="text-slate-400 text-sm mr-1">NT$</span>
              {acc.balance.toLocaleString()}
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border-2 border-dashed border-slate-200">
            尚未新增帳戶
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-8">
            <h3 className="text-xl font-bold mb-6">新增銀行帳戶</h3>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">帳戶名稱</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="例如：台銀活存、日常錢包"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">帳戶類型</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg"
                  value={type}
                  onChange={e => setType(e.target.value)}
                >
                  <option>一般儲蓄</option>
                  <option>信用卡</option>
                  <option>投資帳戶</option>
                  <option>現金</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">初始餘額</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={initialBalance}
                  onChange={e => setInitialBalance(e.target.value)}
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  確認新增
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
