import mongoose from 'mongoose';

const extraIncomeSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerId: String,
  amount: { type: Number, required: true },
  description: String,
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('ExtraIncome', extraIncomeSchema);