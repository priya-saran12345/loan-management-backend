import ExtraIncome from "../models/extraIncomeModel.js";
import Customer from "../models/customerModel.js";
import Wallet from '../models/walletModel.js';

// Get all extra income
export const getExtraIncome = async (req, res) => {
  try {
    const income = await ExtraIncome.find()
      .sort({ date: -1 })
      .populate('customer', 'customerId name');
      
    const total = income.reduce((sum, item) => sum + item.amount, 0);
    
    res.json({ 
      success: true, 
      income,
      total 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Add extra income
export const addExtraIncome = async (req, res) => {
  try {
    const { customerId, amount, description } = req.body;
    
    let customer;
    if (customerId) {
      customer = await Customer.findOne({ customerId });
      if (!customer) {
        return res.status(404).json({ 
          success: false, 
          message: "Customer not found" 
        });
      }
    }
    
    const income = await ExtraIncome.create({
      customer: customer?._id,
      customerId: customer?.customerId,
      amount,
      description: description || "Extra income"
    });
    
    // Add to wallet
    const wallet = await Wallet.findOne();
    wallet.balance += parseFloat(amount);
    wallet.transactions.push({
      type: 'credit',
      amount: parseFloat(amount),
      description: description || "Extra income"
    });
    await wallet.save();
    
    res.status(201).json({ 
      success: true, 
      income 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};