import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  balance: { type: Number, default: 0 },
  transactions: [{
    type: { type: String, enum: ['credit', 'debit'] },
    amount: Number,
    description: String,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('Wallet', walletSchema);