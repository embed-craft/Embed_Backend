# 🛠️ Backend Setup Guide (Windows)

Bhai, ye steps follow kar ke hum MongoDB aur Redis setup karenge.

## 1. MongoDB Setup (Database)
Humare paas do options hain. **Option A (Cloud)** best hai agar team ke saath kaam karna hai.

### Option A: MongoDB Atlas (Cloud - Recommended for Team)
Isse tumhara database internet pe hoga. Tum aur tumhare dost same data dekh payenge.
**Iske liye tumhe MongoDB install karne ki zaroorat NAHI hai.**

1.  **Sign Up:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) pe free account banao.
2.  **Create Cluster:** Free tier (M0 Sandbox) select karke cluster banao.
3.  **Database Access:** 'Database Access' mein jake ek user banao (username/password yaad rakhna).
4.  **Network Access:** 'Network Access' mein jake "Allow Access from Anywhere" (0.0.0.0/0) kar do (taaki doston ke laptop se bhi connect ho sake).
5.  **Get Connection String:**
    *   "Connect" button dabao -> "Connect your application".
    *   URL copy karo. Wo kuch aisa dikhega: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/...`
    *   `<username>` aur `<password>` ko apne details se replace karo.
6.  **Update Code:** Apne `.env` file mein `MONGO_URI` ko is URL se replace kar do.

*Tip: [MongoDB Compass](https://www.mongodb.com/try/download/compass) download kar lo (sirf GUI tool), taaki tum apna cloud data dekh sako.*

### Option B: Local MongoDB (Offline)
Agar internet nahi hai ya sirf khud ke liye test karna hai.

1.  **Download:** [MongoDB Community Server](https://www.mongodb.com/try/download/community) install karo.
2.  **Verify:** CMD mein `mongod --version` check karo.
3.  **Update Code:** `.env` mein `MONGO_URI=mongodb://localhost:27017/nudge_db` rakho.

### Can I switch later? (Local -> Cloud)
**Haan, bilkul!**
Abhi local pe kaam karo. Jab team ke saath share karna ho:
1.  MongoDB Atlas pe cluster banao.
2.  Bas `.env` file mein `MONGO_URI` change kar dena.
3.  Code mein koi change nahi karna padega.
4.  Purana data bhi move ho sakta hai (Export/Import karke).

## 2. Redis Setup (Cache)
Windows pe Redis install karna thoda mushkil hota hai. Sabse aasaan tareeka hai **Free Cloud Redis** use karna.

1.  **Sign Up:** [Redis Cloud](https://redis.com/try-free/) pe jao aur free account banao.
2.  **Create Database:** Ek free database banao (Name: `nudge-cache`).
3.  **Get Details:** Wahan se tumhe ek **Public Endpoint** (e.g., `redis-12345.c1.us-east-1-2.ec2.cloud.redislabs.com:12345`) aur **Password** milega.
4.  **Update Code:**
    *   Apne `nudge-backend` folder mein `.env` file banao.
    *   Ye details wahan daal do:
    ```env
    REDIS_HOST=tumhara-redis-endpoint
    REDIS_PORT=tumhara-redis-port
    REDIS_PASSWORD=tumhara-redis-password
    ```

**Alternative (Agar Cloud nahi chahiye):**
*   [Memurai Developer](https://www.memurai.com/get-memurai) download kar lo. Ye Windows ke liye Redis hai. Install karke bas chalana hai.

## 3. AWS Kab Use Hoga? (Deployment)
Abhi hum **Development Phase** mein hain (Localhost).
*   **Abhi:** Code tumhare laptop pe chal raha hai. Database tumhare laptop pe hai.
*   **AWS Tab Chahiye:** Jab hum chahenge ki **poori duniya** isse use kare.
    *   Tab hum apna code AWS EC2 (Virtual Computer) ya Lambda pe dalenge.
    *   Database ko AWS DocumentDB pe shift karenge.
    *   Abhi AWS account ki zaroorat nahi hai. Pehle code perfect karte hain!

## 4. Run Project
Sab install hone ke baad:
1.  `nudge-backend` folder mein jao.
2.  Ek `.env` file banao (agar nahi banayi):
    ```env
    PORT=4000
    MONGO_URI=mongodb://localhost:27017/nudge_db
    # Agar Redis Cloud use kar rahe ho toh yahan details daalo, warna local ke liye khali chhod do
    ```
3.  Run karo: `npm start`
