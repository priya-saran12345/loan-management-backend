import Income from "../models/Income.js";

export const addIncome = async (req, res) => {
  try {
    const {amount, date, description } = req.body;

    if (!amount || !date) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    const income = await Income.create({
      userId: req.userId,
      amount,
      date,
      description
    });

    res.json({ success: true, income });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getIncomes = async (req, res) => {
  try {
    const incomes = await Income.find({ userId: req.userId }).sort({ date: -1 });
    res.json({ success: true, incomes });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;
    await Income.deleteOne({ _id: id, userId: req.userId });
    res.json({ success: true, message: "Income deleted" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
