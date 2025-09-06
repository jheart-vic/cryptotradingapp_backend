// import crypto from "crypto";

// const merchantId = "999"; // must match MERCHANT_ID from env
// // const merchantOrderId = "68a4e143594d016c159b41fa";
// const merchantOrderId = "68a583e3b6cd27b5c684545c";
// const payAmount = "60000.00";
// const appSecret = "bHtSd4DkZSdonKLvtest";

// const rawString = `merchantId=${merchantId}&merchantOrderId=${merchantOrderId}&amount=${payAmount}&appSecret=${appSecret}`;
// // const rawString = `merchantId=${merchantId}&merchantOrderId=${merchantOrderId}&appSecret=${appSecret}`;
// // const signParam = `merchantId=${merchantId}&appSecret=${appSecret}`;

// const sign = crypto.createHash("md5").update(rawString, "utf8").digest("hex").toLowerCase();

// console.log("Raw String:", rawString);
// console.log("Generated Sign:", sign);
// // const signParam = `merchantId=${merchantId}&appSecret=${appSecret}`;

// // // Step 2: generate MD5 (lowercase hex)
// // const sign = crypto.createHash("md5").update(signParam).digest("hex");

// // Step 1: generate timestamp in ms
// // const timestamp = Date.now();

// // Step 2: build the raw string
// // const rawString = `merchantId=${merchantId}&timestamp=${timestamp}&appSecret=${appSecret}`;

// // Step 3: generate MD5 (lowercase hex)
// // const sign = crypto.createHash("md5").update(rawString, "utf8").digest("hex").toLowerCase();

// console.log("Generated sign:", sign);
// // console.log("timestamp:", timestamp);
// // console.log("Sign Param:", signParam);

// checkBalance.js
import mongoose from "mongoose";
import dotenv from "dotenv";
// ⬇️ Replace with your MongoDB connection string (from your .env or Render)
const MONGO_URI =  "mongodb+srv://trading:v6efhpExaMqkhIR0@cluster0.ws8lrxz.mongodb.net/";

// Import your models
import User from "./models/User.js";
import Transaction from "./models/Transaction.js";

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const userId = "688e127034006f19ce8bd4d0"; // user to check

    // Fetch balance info
    const user = await User.findById(userId).select("balance totalDeposit");
    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log("\n=== 💰 User Balance Info ===");
    console.log("Balance:", user.balance);
    console.log("Total Deposit:", user.totalDeposit);

    // Fetch last 5 transactions
    const txs = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    console.log("\n=== 📜 Last 5 Transactions ===");
    if (txs.length === 0) {
      console.log("No transactions found for this user.");
    } else {
      txs.forEach((tx) => {
        console.log(
          `- [${tx.createdAt.toISOString()}] ${tx.type.toUpperCase()} | Amount: ${tx.amount} | Status: ${tx.status}`
        );
      });
    }

    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

run();
