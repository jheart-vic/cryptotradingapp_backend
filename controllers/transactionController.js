import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import Settings from "../models/Settings.js";
import OTpay from "../helpers/otpay.js";

// Deposit request -> OTpay order
export const requestDeposit = async (req, res) => {
  const { amount, method } = req.body;
  try {
    const settings = await Settings.findOne();
    if (settings?.depositEnabled === false) {
      return res.status(403).json({ msg: "Deposits are currently disabled" });
    }

    const tx = await Transaction.create({
      userId: req.user._id,
      type: "deposit",
      amount,
      method,
      status: "pending",
    });

    // Send to OTpay
    const otRes = await OTpay.createDepositOrder(tx._id.toString(), amount);
    tx.gatewayResponse = otRes.data;
    tx.gatewayOrderId = otRes.data?.data?.orderId || null;
    await tx.save();

    res.json({ msg: "Deposit initiated", tx });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Withdraw request -> OTpay payout
export const requestWithdraw = async (req, res) => {
  const { amount, bankName, accountNumber } = req.body;
  try {
    const settings = await Settings.findOne();
    if (settings?.withdrawalEnabled === false) {
      return res.status(403).json({ msg: "Withdrawals are currently disabled" });
    }

    const user = await User.findById(req.user._id);
    if (user.balance < amount) {
      return res.status(400).json({ msg: "Insufficient balance" });
    }

    const tx = await Transaction.create({
      userId: user._id,
      type: "withdraw",
      amount,
      bankName,
      accountNumber,
      status: "pending",
    });

    // Send to OTpay
    const otRes = await OTpay.createWithdrawalOrder(
      tx._id.toString(),
      amount,
      bankName,
      accountNumber
    );
    tx.gatewayResponse = otRes.data;
    tx.gatewayOrderId = otRes.data?.data?.orderId || null;
    await tx.save();

    res.json({ msg: "Withdrawal initiated", tx });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


export const withdrawRequest = async (req, res) => {
  try {
    const { amount, method, walletAddress, bankName, accountNumber } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (user.balance < amount) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }

    // Create transaction in DB
    const transaction = await Transaction.create({
      userId,
      type: 'withdraw',
      amount,
      method,
      walletAddress,
      bankName,
      accountNumber,
      status: 'pending'
    });

    // Call Otp ay API to send money
    const response = await axios.post('OTPAY_API_WITHDRAW_URL', {
      order_id: transaction._id,
      amount,
      method,
      walletAddress,
      bankName,
      accountNumber
    });

    // Otp ay will later call your webhook to confirm
    res.status(200).json({ msg: 'Withdrawal initiated', data: response.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};