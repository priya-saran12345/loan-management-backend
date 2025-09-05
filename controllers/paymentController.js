import Payment from "../models/paymentModel.js";
import Customer from "../models/customerModel.js";
import Wallet from "../models/walletModel.js";

// Get all payments
export const getPayments = async (req, res) => {
  try {
    const { status, type } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;
    
    const payments = await Payment.find(query)
      .sort({ paymentDate: -1 });
      
    res.json({ 
      success: true, 
      payments 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get payment summary
export const getPaymentSummary = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const [totalPaid, todayPayments, overdueCustomers] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Payment.find({ 
        paymentDate: { $gte: startOfDay, $lte: endOfDay },
        status: 'paid'
      }),
      Customer.countDocuments({ overdue: { $gt: 0 } })
    ]);
    
    res.json({ 
      success: true, 
      summary: {
        totalPaid: totalPaid[0]?.total || 0,
        todayPayments: todayPayments.reduce((sum, p) => sum + p.amount, 0),
        totalOverdue: overdueCustomers
      },
      todayPayments
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};