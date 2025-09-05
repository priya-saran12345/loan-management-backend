import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  amount: { type: Number, required: true },
  type: {
    type: String,
    enum: ['emi', 'full', 'overdue'],
    required: true
  },
  status: {
    type: String,
    enum: ['paid', 'failed'],
    default: 'paid'
  },
  interest: { type: Number, default: 0 },
  description: String,
  paymentDate: { type: Date, default: Date.now }
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;