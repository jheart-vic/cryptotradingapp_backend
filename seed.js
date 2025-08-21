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