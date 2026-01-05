
export interface UserProfile {
  uid: string;
  email: string;
}

export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  type: string;
  createdAt: number;
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: number;
}

export const CATEGORIES = {
  EXPENSE: ['飲食', '交通', '購物', '娛樂', '醫療', '居住', '教育', '保險', '其他'],
  INCOME: ['薪資', '獎金', '投資', '利息', '兼職', '其他']
};
