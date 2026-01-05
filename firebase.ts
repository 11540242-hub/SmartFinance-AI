
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 請注意：在實際部署前，請將下列資訊替換為您在 Firebase Console 取得的配置
// 這些通常會放在 .env 檔案中，但在本範例中作為結構參考
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 由於我們無法在預覽環境中預設 Firebase，這裡導出一個初始化函數或預設值
// 在開發者實際使用時，應填入真實的 Firebase Config
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
