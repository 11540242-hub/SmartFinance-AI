
import { GoogleGenAI } from "@google/genai";
import { Transaction, BankAccount } from "./types";

export const getFinancialAdvice = async (
  transactions: Transaction[],
  accounts: BankAccount[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  // Prepare data summary for AI
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const recentTransactions = transactions
    .sort((a, b) => b.date - a.date)
    .slice(0, 15)
    .map(t => `${new Date(t.date).toLocaleDateString()}: ${t.type === 'INCOME' ? '+' : '-'}${t.amount} (${t.category}) - ${t.description}`);

  const prompt = `
    你是一位專業的個人理財顧問。請根據以下使用者的財務數據提供簡潔、專業且具體的建議。
    
    當前帳戶總餘額: NT$ ${totalBalance}
    最近 15 筆交易紀錄:
    ${recentTransactions.join('\n')}
    
    請從以下三個面向分析：
    1. 消費習慣分析 (是否有過多非必要支出？)
    2. 儲蓄與預算建議
    3. 未來一個月的財務行動指南
    
    請用親切、鼓勵的語氣回答，並使用繁體中文。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });
    return response.text || "抱歉，目前無法產生建議。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 顧問目前休息中，請稍後再試。";
  }
};
