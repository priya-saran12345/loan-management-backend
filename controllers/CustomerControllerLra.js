import Customer from "../models/CustomerModelLra.js";
import Wallet from "../models/walletModel.js";
import ExtraIncome from "../models/extraIncomeModel.js";

const generateCustomerId = async () => {
    const count = await Customer.countDocuments();
    const paddedCount = (count + 1).toString().padStart(6, '0');
    return `LRA-CUST-${paddedCount}`;
};

// ---------------- CREATE CUSTOMER ----------------
export const createLRACustomer = async (req, res) => {
    try {
        // Parse input values
        const disbursementAmount = parseFloat(req.body.disbursementAmount);
        const interestRate = parseFloat(req.body.interestRate);
        const loanTenure = parseInt(req.body.loanTenure);

        // Calculate file charges as 5% of disbursement amount
        const fileCharges = Math.round(disbursementAmount * 0.05);

        // Check wallet balance - only for disbursement amount
        const wallet = await Wallet.findOne();

        if (!wallet || wallet.balance < disbursementAmount) {
            return res.status(400).json({
                success: false,
                message: `Insufficient wallet balance. Required for disbursement: ₹${disbursementAmount}, Available: ₹${wallet ? wallet.balance : 0}`
            });
        }

        // ✅ Match with model required fields
        const requiredFields = [
            'name', 'fatherName', 'phone', 'address',
            'employmentType', 'monthlyIncome',
            'guarantorName', 'guarantorPhone', 'guarantorAddress',
            'loanPurpose', 'disbursementAmount', 'interestRate', 'loanTenure'
        ];

        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Generate ID
        const customerId = await generateCustomerId();

        // Calculate interest only on disbursement amount
        const totalInterest = (disbursementAmount * interestRate / 100) * (loanTenure / 12);
        const totalPayable = disbursementAmount + totalInterest; // Only disbursement + interest

        // Calculate monthly EMI and round it up to avoid decimal issues
        const monthlyEmi = Math.ceil(totalPayable / loanTenure);

        // Adjust the last EMI to account for rounding differences
        const totalCalculated = monthlyEmi * (loanTenure - 1);
        const lastEmi = totalPayable - totalCalculated;

        const interestPerMonth = totalInterest / loanTenure;
        const principalPerMonth = disbursementAmount / loanTenure;

        const customerData = {
            ...req.body,
            customerId,
            fileCharges,
            totalLoanAmount: disbursementAmount, // Just the disbursement amount
            totalPayable,
            monthlyEmi,
            totalPaid: 0,
            remainingAmount: totalPayable,
            status: 'active',
            emiHistory: []
        };

        const customer = await Customer.create(customerData);

        // Add FILE CHARGES as extra income
        await ExtraIncome.create({
            customer: customer._id,
            customerId: customer.customerId,
            amount: fileCharges,
            description: `File charges (5% of disbursement) for ${customer.customerId}`,
            type: 'file_charges',
            date: new Date()
        });

        // Don't add interest to extra income here - it will be added as EMIs are paid

        // Wallet update - deduct ONLY the disbursement amount
        wallet.balance -= disbursementAmount;
        wallet.transactions.push({
            type: 'debit',
            amount: disbursementAmount,
            description: `Loan disbursement to ${customer.customerId}`,
            date: new Date()
        });
        await wallet.save();

        // EMI schedule with interest calculation for each EMI
        const emiSchedule = [];
        const today = new Date();

        for (let i = 1; i <= loanTenure; i++) {
            const emiDate = new Date(today);
            emiDate.setMonth(today.getMonth() + i);

            // For the last EMI, use the adjusted amount to ensure exact total
            const emiAmount = i === loanTenure ? lastEmi : monthlyEmi;

            emiSchedule.push({
                date: emiDate,
                amount: emiAmount,
                principal: principalPerMonth,
                interest: interestPerMonth,
                status: 'pending',
                paidDate: null
            });
        }
        customer.emiHistory = emiSchedule;
        await customer.save();

        res.status(201).json({
            success: true,
            customer,
            calculationDetails: {
                disbursementAmount,
                fileChargesPercent: '5%',
                fileCharges,
                interestRate,
                loanTenure,
                totalInterest,
                totalPayable,
                monthlyEmi,
                lastEmi,
                principalPerMonth,
                interestPerMonth
            }
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---------------- GET ALL CUSTOMERS ----------------
export const getAllLRACustomers = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        const customers = await Customer.find(query).sort({ createdAt: -1 });

        res.status(200).json({ success: true, customers });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---------------- GET SINGLE CUSTOMER ----------------
export const getLRACustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        res.status(200).json({ success: true, customer });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---------------- GET CUSTOMER FOR EDIT ----------------
export const getLRACustomerForEdit = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.status(200).json({
            success: true,
            customer
        });
    } catch (error) {
        console.error('Error fetching customer for edit:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ---------------- UPDATE CUSTOMER ----------------
export const updateLRACustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // Don't allow updating these fields
        delete req.body.emiHistory;
        delete req.body.totalPaid;
        delete req.body.remainingAmount;
        delete req.body.customerId;

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
        console.error('Error updating customer:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ---------------- DELETE CUSTOMER ----------------
export const deleteLRACustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // Check if customer has any payments
        if (customer.totalPaid > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete customer with payment history"
            });
        }

        await Customer.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---------------- UPDATE EMI STATUS ----------------
export const updateEMIStatus = async (req, res) => {
    try {
        const { emiIndex, status, amountPaid } = req.body;
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        if (emiIndex >= customer.emiHistory.length) {
            return res.status(400).json({ success: false, message: 'Invalid EMI index' });
        }

        // Update EMI status
        customer.emiHistory[emiIndex].status = status;

        // Update payment details if amount is paid
        if (status === 'paid' && amountPaid) {
            customer.totalPaid += amountPaid;
            customer.remainingAmount -= amountPaid;

            // Add to wallet if payment is received
            const wallet = await Wallet.findOne();
            if (wallet) {
                wallet.balance += amountPaid;
                wallet.transactions.push({
                    type: 'credit',
                    amount: amountPaid,
                    description: `EMI payment from ${customer.customerId}`,
                    date: new Date()
                });
                await wallet.save();
            }

            // Add interest portion to extra income
            const emiInterest = customer.emiHistory[emiIndex].interest;
            if (emiInterest > 0) {
                await ExtraIncome.create({
                    customer: customer._id,
                    customerId: customer.customerId,
                    amount: emiInterest,
                    description: `Interest from EMI payment for ${customer.customerId} (EMI ${emiIndex + 1})`,
                    type: 'interest_income',
                    date: new Date()
                });
            }
        }

        await customer.save();
        res.status(200).json({ success: true, customer });
    } catch (error) {
        console.error('Error updating EMI status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---------------- GET PAYMENT HISTORY ----------------
export const getPaymentHistory = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // For LRA customers, we can use the emiHistory array as payment history
        const paymentHistory = customer.emiHistory
            .filter(emi => emi.status === 'paid')
            .map(emi => ({
                _id: emi._id,
                paymentDate: emi.paidDate || emi.date,
                amount: emi.amount,
                status: emi.status,
                type: 'emi',
                emiIndex: customer.emiHistory.indexOf(emi),
                interest: emi.interest
            }));

        res.status(200).json({ success: true, payments: paymentHistory });
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---------------- GET EMI DETAILS ----------------
export const getEMIDetails = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
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
                daysOverdue,
                paidDate: emi.paidDate,
                principal: emi.principal,
                monthlyInterest: emi.interest
            };
        });

        res.status(200).json({
            success: true,
            emiDetails,
            emiHistory: customer.emiHistory // For backward compatibility
        });
    } catch (error) {
        console.error('Error fetching EMI details:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---------------- COLLECT PAYMENT ----------------
export const collectPayment = async (req, res) => {
    try {
        const { customerId, amount, paymentType, emiIndex } = req.body;

        // Input validation
        if (!customerId || !amount || !paymentType) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: customerId, amount, paymentType"
            });
        }

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        const wallet = await Wallet.findOne();
        if (!wallet) {
            return res.status(500).json({
                success: false,
                message: "Wallet not found"
            });
        }

        const today = new Date();
        let amountToPay = parseFloat(amount);
        let description = '';
        let updatedEMIs = [];
        let totalInterestCollected = 0;

        // Process based on payment type
        switch (paymentType) {
            case 'emi':
                if (emiIndex === undefined || emiIndex >= customer.emiHistory.length) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid EMI index"
                    });
                }

                const emi = customer.emiHistory[emiIndex];
                if (emi.status === 'paid') {
                    return res.status(400).json({
                        success: false,
                        message: "EMI already paid"
                    });
                }

                // Calculate interest if overdue
                const emiDate = new Date(emi.date);
                let overdueInterest = 0;

                if (emiDate < today && emi.status === 'pending') {
                    const daysOverdue = Math.floor((today - emiDate) / (1000 * 60 * 60 * 24));
                    overdueInterest = emi.amount * 0.03 * daysOverdue;
                    amountToPay = emi.amount + overdueInterest;
                } else {
                    amountToPay = emi.amount;
                }

                // Update EMI status
                emi.status = 'paid';
                emi.paidDate = new Date();
                emi.overdueInterest = overdueInterest;
                updatedEMIs = [emiIndex];

                // Add the interest portion to extra income
                totalInterestCollected = emi.interest + overdueInterest;

                description = `EMI payment from ${customer.customerId} (EMI ${emiIndex + 1})`;
                break;

            case 'overdue':
                // Find all overdue EMIs
                const overdueEmis = customer.emiHistory.filter(emi => {
                    const emiDate = new Date(emi.date);
                    return emi.status === 'pending' && emiDate < today;
                });

                if (overdueEmis.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "No overdue EMIs found"
                    });
                }

                // Calculate total overdue amount with interest
                let totalOverdue = 0;
                overdueEmis.forEach(emi => {
                    const emiDate = new Date(emi.date);
                    const daysOverdue = Math.floor((today - emiDate) / (1000 * 60 * 60 * 24));
                    const interest = emi.amount * 0.03 * daysOverdue;
                    totalOverdue += emi.amount + interest;
                });

                if (amountToPay < totalOverdue) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient payment. Total overdue amount is ₹${totalOverdue.toFixed(2)}`
                    });
                }

                // Mark all overdue EMIs as paid
                customer.emiHistory.forEach((emi, index) => {
                    const emiDate = new Date(emi.date);
                    if (emi.status === 'pending' && emiDate < today) {
                        const daysOverdue = Math.floor((today - emiDate) / (1000 * 60 * 60 * 24));
                        const interest = emi.amount * 0.03 * daysOverdue;

                        emi.status = 'paid';
                        emi.paidDate = new Date();
                        emi.overdueInterest = interest;
                        updatedEMIs.push(index);

                        // Add interest portion to total
                        totalInterestCollected += emi.interest + interest;
                    }
                });

                description = `Overdue payment from ${customer.customerId}`;
                break;

            case 'full':
                // Use the exact remaining amount instead of recalculating
                if (amountToPay < customer.remainingAmount) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient payment. Total remaining amount is ₹${customer.remainingAmount.toFixed(2)}`
                    });
                }

                // Mark all pending EMIs as paid
                customer.emiHistory.forEach((emi, index) => {
                    if (emi.status === 'pending') {
                        emi.status = 'paid';
                        emi.paidDate = new Date();
                        updatedEMIs.push(index);

                        // Add interest portion to total
                        totalInterestCollected += emi.interest;
                    }
                });

                // Set exact payment amount to remaining balance
                amountToPay = customer.remainingAmount;
                description = `Full payment from ${customer.customerId}`;
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: "Invalid payment type. Use 'emi', 'overdue', or 'full'"
                });
        }

        // Add interest to extra income
        if (totalInterestCollected > 0) {
            await ExtraIncome.create({
                customer: customer._id,
                customerId: customer.customerId,
                amount: totalInterestCollected,
                description: `Interest from payment for ${customer.customerId}`,
                type: 'interest_income',
                date: new Date()
            });
        }

        // Update customer payment details
        customer.totalPaid += amountToPay;
        customer.remainingAmount = customer.totalPayable - customer.totalPaid;

        // Update customer status if fully paid (use a small tolerance for floating point)
        if (customer.remainingAmount <= 0.01) {
            customer.status = 'inactive';
            customer.remainingAmount = 0; // Set to exact zero
        }

        // Add to wallet
        wallet.balance += amountToPay;
        wallet.transactions.push({
            type: 'credit',
            amount: amountToPay,
            description: description,
            date: new Date()
        });

        // Save changes
        await customer.save();
        await wallet.save();

        res.status(200).json({
            success: true,
            message: 'Payment collected successfully',
            customer,
            paymentDetails: {
                amount: amountToPay,
                type: paymentType,
                emisUpdated: updatedEMIs,
                interestCollected: totalInterestCollected
            }
        });

    } catch (error) {
        console.error('Payment collection error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ---------------- GET OVERDUE PAYMENTS ----------------
export const getOverduePaymentsList = async (req, res) => {
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

        res.status(200).json({
            success: true,
            payments: overduePayments,
            total: overduePayments.reduce((sum, p) => sum + p.overdueAmount, 0)
        });
    } catch (error) {
        console.error('Error fetching overdue payments:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---------------- CALCULATE LRA EMI ----------------
export const calculateLRAEMI = async (req, res) => {
    try {
        const { disbursementAmount, interestRate, loanTenure } = req.body;

        // Calculate file charges as 5% of disbursement amount
        const fileCharges = Math.round(disbursementAmount * 0.05);

        // Calculate interest only on disbursement amount
        const totalInterest = (disbursementAmount * interestRate / 100) * (loanTenure / 12);
        const totalPayable = parseFloat(disbursementAmount) + totalInterest; // Only disbursement + interest

        // Calculate monthly EMI and round it up
        const monthlyEmi = Math.ceil(totalPayable / loanTenure);

        // Adjust the last EMI to account for rounding differences
        const totalCalculated = monthlyEmi * (loanTenure - 1);
        const lastEmi = totalPayable - totalCalculated;

        const interestPerMonth = totalInterest / loanTenure;
        const principalPerMonth = disbursementAmount / loanTenure;

        // Generate EMI schedule
        const schedule = [];
        const today = new Date();

        for (let i = 1; i <= loanTenure; i++) {
            const emiDate = new Date(today);
            emiDate.setMonth(today.getMonth() + i);

            const emiAmount = i === loanTenure ? lastEmi : monthlyEmi;

            schedule.push({
                date: emiDate,
                amount: emiAmount,
                principal: principalPerMonth,
                interest: interestPerMonth,
                status: 'pending'
            });
        }

        res.status(200).json({
            success: true,
            calculation: {
                disbursementAmount: parseFloat(disbursementAmount),
                fileCharges,
                interestRate: parseFloat(interestRate),
                loanTenure: parseInt(loanTenure),
                totalInterest,
                totalPayable,
                monthlyEmi,
                lastEmi,
                principalPerMonth,
                interestPerMonth
            },
            schedule
        });
    } catch (error) {
        console.error('Error calculating EMI:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---------------- GET CUSTOMER STATS ----------------
export const getLRACustomerStats = async (req, res) => {
    try {
        const totalCustomers = await Customer.countDocuments();
        const activeCustomers = await Customer.countDocuments({ status: 'active' });
        const inactiveCustomers = await Customer.countDocuments({ status: 'inactive' });

        const totalLoanAmount = await Customer.aggregate([
            { $group: { _id: null, total: { $sum: '$totalLoanAmount' } } }
        ]);

        const totalPaidAmount = await Customer.aggregate([
            { $group: { _id: null, total: { $sum: '$totalPaid' } } }
        ]);

        const totalRemainingAmount = await Customer.aggregate([
            { $group: { _id: null, total: { $sum: '$remainingAmount' } } }
        ]);

        // Calculate overdue amounts
        const today = new Date();
        const allCustomers = await Customer.find({ status: 'active' });

        let totalOverdueAmount = 0;
        let overdueCustomersCount = 0;

        for (const customer of allCustomers) {
            const overdueEmis = customer.emiHistory.filter(emi =>
                emi.status === 'pending' && new Date(emi.date) < today
            );

            if (overdueEmis.length > 0) {
                overdueCustomersCount++;
                const customerOverdue = overdueEmis.reduce((sum, emi) => {
                    const daysOverdue = Math.floor((today - new Date(emi.date)) / (1000 * 60 * 60 * 24));
                    const interest = emi.amount * 0.03 * daysOverdue;
                    return sum + emi.amount + interest;
                }, 0);

                totalOverdueAmount += customerOverdue;
            }
        }

        res.status(200).json({
            success: true,
            stats: {
                totalCustomers,
                activeCustomers,
                inactiveCustomers,
                overdueCustomers: overdueCustomersCount,
                totalLoanAmount: totalLoanAmount[0]?.total || 0,
                totalPaidAmount: totalPaidAmount[0]?.total || 0,
                totalRemainingAmount: totalRemainingAmount[0]?.total || 0,
                totalOverdueAmount
            }
        });
    } catch (error) {
        console.error('Error fetching customer stats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};