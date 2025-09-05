import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  description: { type: String }
}, { timestamps: true });

const Income = mongoose.model("Income", incomeSchema);
export default Income;
