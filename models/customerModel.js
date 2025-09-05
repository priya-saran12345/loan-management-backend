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
    required: true
  },
  address: {
    type: String,
    required: true
  },
  aadhar: {
    type: String,
  },
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
  loanAmount: {
    type: Number,
    default: 10000
  },
  emiAmount: {
    type: Number,
    default: 100
  },
  paymentFrequency: {
    type: String,
    default: 'daily'
  },
  loanPurpose: {
    type: String,
    required: true
  },
  loanValidity: {
    type: Number,
    default: 100
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'overdue'],
    default: 'active'
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    default: function () { return this.loanAmount }
  },
  overdue: {
    type: Number,
    default: 0
  },
  emiHistory: [{
    date: Date,
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending'
    },
    interest: {
      type: Number,
      default: 0
    }
  }],
  applicationDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

customerSchema.index({ customerId: 1 }, { unique: true });
customerSchema.index({ phone: 1 }, { unique: true, sparse: true });
customerSchema.index({ aadhar: 1 }, { unique: true, sparse: true });

export default mongoose.model('Customer', customerSchema);