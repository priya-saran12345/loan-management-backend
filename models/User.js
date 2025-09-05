import mongoose, { Types } from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
    },
    { minimize: false, timestamps: true }
);

// Add indexes for better performance
// userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.models.user || mongoose.model('user', userSchema);

export default User;