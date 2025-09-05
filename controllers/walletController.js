import Wallet from "../models/walletModel.js";
import Customer from "../models/customerModel.js";
import ExtraIncome from "../models/extraIncomeModel.js";

// Get wallet balance
export const getWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne();

    if (!wallet) {
      wallet = await Wallet.create({ balance: 0 });
    }

    res.json({
      success: true,
      wallet
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get wallet transactions
export const getWalletTransactions = async (req, res) => {
  try {
    const { type } = req.query;
    const wallet = await Wallet.findOne();

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }

    let transactions = wallet.transactions;

    if (type && ['credit', 'debit'].includes(type)) {
      transactions = transactions.filter(t => t.type === type);
    }

    res.json({
      success: true,
      transactions: transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add to wallet (deposit)
export const addToWallet = async (req, res) => {
  try {
    const { amount, description } = req.body;

    const wallet = await Wallet.findOne();
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }

    wallet.balance += parseFloat(amount);
    wallet.transactions.push({
      type: 'credit',
      amount: parseFloat(amount),
      description: description || "Manual deposit to wallet",
      date: new Date()
    });

    await wallet.save();

    res.json({
      success: true,
      wallet
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Withdraw from wallet
export const withdrawFromWallet = async (req, res) => {
  try {
    const { amount, description } = req.body;

    const wallet = await Wallet.findOne();
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }

    if (wallet.balance < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance"
      });
    }

    wallet.balance -= parseFloat(amount);
    wallet.transactions.push({
      type: 'debit',
      amount: parseFloat(amount),
      description: description || "Manual withdrawal from wallet",
      date: new Date()
    });

    await wallet.save();

    res.json({
      success: true,
      wallet
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// controllers/walletController.js
export const deleteTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const wallet = await Wallet.findOne();
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }
    
    const transaction = wallet.transactions.id(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }
    
    // Update balance if needed
    if (transaction.type === 'credit') {
      wallet.balance -= transaction.amount;
    } else {
      wallet.balance += transaction.amount;
    }
    
    // Remove the transaction
    wallet.transactions.pull(transactionId);
    await wallet.save();
    
    res.json({
      success: true,
      wallet
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};