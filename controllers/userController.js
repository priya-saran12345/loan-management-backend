import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Register User : /api/user/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Name, email and password are required" 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "User already exists" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      user: { email: user.email, name: user.name },
      message: "User registered successfully"
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Login User : /api/user/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      user: { email: user.email, name: user.name },
      message: "Logged in successfully"
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Check Auth : /api/user/is-auth
export const isAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    return res.json({ 
      success: true, 
      user 
    });
  } catch (error) {
    console.error("Auth check error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Logout User : /api/user/logout
export const logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });
    return res.json({ 
      success: true, 
      message: "Logged out successfully" 
    });
  } catch (error) {
    console.error("Logout error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Update Profile : /api/user/update-profile
export const updateProfile = async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    // Update name if provided
    if (name) {
      user.name = name;
    }
    // Update password if current password is provided
    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ 
          success: false, 
          message: "Current password is incorrect" 
        });
      }
      if (!newPassword) {
        return res.status(400).json({ 
          success: false, 
          message: "New password is required" 
        });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }
    await user.save();
    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: { email: user.email, name: user.name }
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Forgot Password : /api/user/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ 
        success: true,
        message: "If this email exists, we've sent a password reset link"
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    // In a real app, you would send an email with the reset link
    // For this demo, we'll just return the token
    return res.json({
      success: true,
      message: "Password reset link would be sent to email",
      resetToken // In production, don't return this to the client
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Reset Password : /api/user/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Token and new password are required" 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    console.error("Reset password error:", error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ 
        success: false, 
        message: "Password reset link has expired" 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid token" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};