import Customer from "../models/customerModel.js";
import Payment from "../models/paymentModel.js";
import Wallet from "../models/walletModel.js";
import ExtraIncome from "../models/extraIncomeModel.js";

const generateCustomerId = async () => {
  const count = await Customer.countDocuments();
  const paddedCount = (count + 1).toString().padStart(6, '0');
  return `STL-CUST-${paddedCount}`;
};

export const createCustomer = async (req, res) => {
  try {
    const wallet = await Wallet.findOne();
    const requiredAmount = 8000;

    if (!wallet || wallet.balance < requiredAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Required: ₹${requiredAmount}, Available: ₹${wallet ? wallet.balance : 0}`
      });
    }

    const requiredFields = [
      'name', 'fatherName', 'phone', 'address',
      'employmentType', 'monthlyIncome',
      'guarantorName', 'guarantorPhone', 'guarantorAddress',
      'loanPurpose'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // First generate customer ID
    const customerId = await generateCustomerId();

    const customerData = {
      ...req.body,
      customerId,
      loanAmount: 10000,
      emiAmount: 100,
      paymentFrequency: 'daily',
      loanValidity: 100,
      emiHistory: []
    };

    const customer = await Customer.create(customerData);

    await ExtraIncome.create({
      customer: customer._id,
      customerId: customer.customerId,
      amount: 2000,
      description: `Loan processing fee for ${customer.customerId}`
    });

    wallet.balance -= 8000;
    wallet.transactions.push({
      type: 'debit',
      amount: 8000,
      description: `Loan disbursement to ${customer.customerId}`,
      date: new Date()
    });
    await wallet.save();

    const emiSchedule = [];
    const today = new Date();

    for (let i = 1; i <= 100; i++) {
      const emiDate = new Date(today);
      emiDate.setDate(today.getDate() + i);
      emiSchedule.push({
        date: emiDate,
        amount: 100,
        status: 'pending',
        interest: 0
      });
    }

    customer.emiHistory = emiSchedule;
    await customer.save();

    res.status(201).json({
      success: true,
      customer
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // List of fields that should not be updated
    const restrictedFields = ['emiHistory', 'customerId', 'loanAmount', 'emiAmount', 'paymentFrequency', 'loanValidity', 'totalPaid', 'remainingAmount', 'overdue', 'status'];

    // Remove restricted fields from request body
    restrictedFields.forEach(field => {
      delete req.body[field];
    });

    // Validate phone numbers
    if (req.body.phone && !/^\d{10}$/.test(req.body.phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits"
      });
    }

    if (req.body.guarantorPhone && !/^\d{10}$/.test(req.body.guarantorPhone)) {
      return res.status(400).json({
        success: false,
        message: "Guarantor phone number must be exactly 10 digits"
      });
    }

    if (req.body.aadhar && !/^\d{12}$/.test(req.body.aadhar)) {
      return res.status(400).json({
        success: false,
        message: "Aadhar number must be exactly 12 digits"
      });
    }

    // Update allowed fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        customer[key] = req.body[key];
      }
    });

    await customer.save();

    res.json({
      success: true,
      customer
    });

  } catch (error) {
    console.error('Update customer error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate field value (phone or aadhar might already exist)"
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

export const getCustomerForEdit = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    res.json({
      success: true,
      customer
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    res.json({
      success: true,
      customer
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCustomers = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      customers
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCustomerEMIs = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const today = new Date();
    const emiDetails = customer.emiHistory.map((emi, index) => {
      const emiDate = new Date(emi.date);
      const isOverdue = emiDate < today && emi.status === 'pending';
      const daysOverdue = isOverdue ?
        Math.floor((today - emiDate) / (1000 * 60 * 60 * 24)) : 0;
      const interest = isOverdue ? emi.amount * 0.03 * daysOverdue : 0;

      return {
        index,
        date: emi.date,
        amount: emi.amount,
        status: isOverdue ? 'overdue' : emi.status,
        interest,
        totalAmount: emi.amount + interest,
        daysOverdue
      };
    });

    res.json({
      success: true,
      emiDetails,
      customer: {
        _id: customer._id,
        name: customer.name,
        customerId: customer.customerId,
        totalPaid: customer.totalPaid,
        remainingAmount: customer.remainingAmount,
        overdue: customer.overdue
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCustomerPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ customer: req.params.id })
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

export const collectPayment = async (req, res) => {
  try {
    const { customerId, amount, paymentType, emiIndex } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const wallet = await Wallet.findOne();

    let emiAmount = 0;
    let interestAmount = 0;

    if (paymentType === 'emi' && emiIndex !== undefined) {
      if (customer.emiHistory[emiIndex]) {
        const emi = customer.emiHistory[emiIndex];
        emiAmount = emi.amount;

        // Overdue interest calculation
        const today = new Date();
        const emiDate = new Date(emi.date);
        if (emi.status === 'pending' && emiDate < today) {
          const daysOverdue = Math.floor((today - emiDate) / (1000 * 60 * 60 * 24));
          interestAmount = emi.amount * 0.03 * daysOverdue;
        }

        // Mark EMI as paid (only emiAmount is deducted from loan)
        emi.status = 'paid';
        emi.interest = 0;
      }
    }

    // Wallet Update (EMI + Interest)
    wallet.balance += emiAmount + interestAmount;
    wallet.transactions.push({
      type: 'credit',
      amount: emiAmount + interestAmount,
      description: `Payment from ${customer.customerId} (EMI: ₹${emiAmount}, Interest: ₹${interestAmount})`,
      date: new Date()
    });
    await wallet.save();

    // Extra Income Entry for interest only
    if (interestAmount > 0) {
      await ExtraIncome.create({
        customer: customer._id,
        customerId: customer.customerId,
        amount: interestAmount,
        description: `Overdue interest collected from ${customer.customerId}`
      });
    }

    // Payment record
    const payment = await Payment.create({
      customer: customer._id,
      customerId: customer.customerId,
      customerName: customer.name,
      amount: emiAmount,
      interest: interestAmount,
      type: paymentType,
      status: 'paid',
      paymentDate: new Date()
    });

    // Loan calculation (only EMI reduces remaining loan, not interest)
    customer.totalPaid += emiAmount;
    customer.remainingAmount = customer.loanAmount - customer.totalPaid;

    if (customer.remainingAmount <= 0) {
      customer.status = 'inactive';
    }

    await customer.save();

    res.json({
      success: true,
      payment,
      customer
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getOverduePayments = async (req, res) => {
  try {
    const today = new Date();
    const overdueCustomers = await Customer.find({
      status: 'active'
    });

    const overduePayments = [];

    for (const customer of overdueCustomers) {
      const overdueEmis = customer.emiHistory.filter(emi =>
        emi.status === 'pending' && new Date(emi.date) < today
      );

      if (overdueEmis.length > 0) {
        const totalOverdue = overdueEmis.reduce((sum, emi) => {
          const daysOverdue = Math.floor((today - new Date(emi.date)) / (1000 * 60 * 60 * 24));
          const interest = emi.amount * 0.03 * daysOverdue;
          return sum + emi.amount + interest;
        }, 0);

        overduePayments.push({
          customerId: customer.customerId,
          customerName: customer.name,
          customerPhone: customer.phone,
          overdueAmount: totalOverdue,
          overdueEmis: overdueEmis.length,
          lastPaymentDate: customer.lastPaymentDate
        });
      }
    }

    res.json({
      success: true,
      payments: overduePayments,
      total: overduePayments.reduce((sum, p) => sum + p.overdueAmount, 0)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const calculateEMI = async (req, res) => {
  try {
    const { loanAmount, emiAmount, paymentFrequency } = req.body;

    const totalEmis = Math.ceil(loanAmount / emiAmount);
    const today = new Date();
    const schedule = [];

    for (let i = 0; i < totalEmis; i++) {
      const emiDate = new Date(today);

      if (paymentFrequency === 'daily') {
        emiDate.setDate(today.getDate() + i);
      } else if (paymentFrequency === 'weekly') {
        emiDate.setDate(today.getDate() + (i * 7));
      } else {
        emiDate.setMonth(today.getMonth() + i);
      }

      schedule.push({
        date: emiDate,
        amount: emiAmount,
        status: 'pending',
        interest: 0
      });
    }

    res.json({
      success: true,
      schedule,
      totalEmis,
      totalAmount: totalEmis * emiAmount
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const payments = await Payment.countDocuments({ customer: req.params.id });
    if (payments > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete customer with payment history"
      });
    }

    await Customer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Customer deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ status: 'active' });
    const inactiveCustomers = await Customer.countDocuments({ status: 'inactive' });
    const overdueCustomers = await Customer.countDocuments({ status: 'active', overdue: { $gt: 0 } });

    const totalLoanAmount = await Customer.aggregate([
      { $group: { _id: null, total: { $sum: '$loanAmount' } } }
    ]);

    const totalPaidAmount = await Customer.aggregate([
      { $group: { _id: null, total: { $sum: '$totalPaid' } } }
    ]);

    const totalOverdueAmount = await Customer.aggregate([
      { $group: { _id: null, total: { $sum: '$overdue' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalCustomers,
        activeCustomers,
        inactiveCustomers,
        overdueCustomers,
        totalLoanAmount: totalLoanAmount[0]?.total || 0,
        totalPaidAmount: totalPaidAmount[0]?.total || 0,
        totalOverdueAmount: totalOverdueAmount[0]?.total || 0
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};