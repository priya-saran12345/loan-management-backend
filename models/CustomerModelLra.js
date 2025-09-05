// models/customerModel.js
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    customerId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    fatherName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true
    },
    aadhar: {
        type: String,
    },
    // Employment Info
    employmentType: {
        type: String,
        enum: ['salaried', 'self-employed', 'business', 'other'],
        default: 'salaried',
        required: true
    },
    monthlyIncome: {
        type: Number,
        required: true
    },

    // Guarantor Info
    guarantorName: {
        type: String,
        required: true
    },
    guarantorPhone: {
        type: String,
        required: true
    },
    guarantorAddress: {
        type: String,
        required: true
    },

    // Loan Info (frontend se calculate hoga)
    disbursementAmount: {
        type: Number,
        required: true
    },
    interestRate: {
        type: Number,
        required: true
    },
    loanTenure: {
        type: Number,
        required: true
    },
    loanPurpose: {
        type: String,
        required: true
    },

    // Calculated Loan Details
    fileCharges: { type: Number, default: 0 },
    totalLoanAmount: { type: Number, default: 0 },
    totalPayable: { type: Number, default: 0 },
    monthlyEmi: { type: Number, default: 0 },

    status: {
        type: String,
        enum: ['active', 'inactive', 'overdue'],
        default: 'active'
    },
    totalPaid: { type: Number, default: 0 },
    remainingAmount: {
        type: Number,
        default: function () {
            return this.totalPayable;
        }
    },
    overdue: { type: Number, default: 0 },

    emiHistory: [
        {
            date: Date,
            amount: Number,
            status: {
                type: String,
                enum: ['pending', 'paid', 'overdue'],
                default: 'pending'
            },
            interest: { type: Number, default: 0 }
        }
    ],

    applicationDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Indexes
customerSchema.index({ customerId: 1 }, { unique: true });
customerSchema.index({ phone: 1 }, { unique: true, sparse: true });
customerSchema.index({ aadhar: 1 }, { unique: true, sparse: true });

export default mongoose.model('Customerlra', customerSchema);
