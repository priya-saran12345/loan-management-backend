// models/Employee.js
import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    position: { type: String, required: true },
    address: { type: String, required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true }
  },
  { timestamps: true }
);

// Add indexes for better performance
employeeSchema.index({ email: 1 });
employeeSchema.index({ name: 1 });
employeeSchema.index({ createdBy: 1 });

const Employee = mongoose.models.employee || mongoose.model('employee', employeeSchema);

export default Employee;