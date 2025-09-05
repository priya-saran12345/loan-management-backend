import mongoose from "mongoose";
import Employee from "../models/Employee.js";

// Add new employee
export const addEmployee = async (req, res) => {
  try {
    const { name, email, phone, position, address } = req.body;

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists',
        field: 'email'
      });
    }

    const employee = await Employee.create({
      name,
      email,
      phone,
      position,
      address,
      createdBy: req.userId
    });

    res.status(201).json({
      success: true,
      employee,
      message: 'Employee added successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get all employees
export const getEmployees = async (req, res) => {
  try {
    const { search = '', status = '' } = req.query;

    let query = { createdBy: req.userId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    const employees = await Employee.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      employees,
      count: employees.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get single employee
export const getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.id,
      createdBy: req.userId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      employee
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Update employee
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, position, address, status } = req.body;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID"
      });
    }

    // Check if employee exists and belongs to the user
    const existingEmployee = await Employee.findOne({
      _id: id,
      createdBy: req.userId
    });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found or you don't have permission"
      });
    }

    // Check if email is being updated to an existing email
    if (email && email !== existingEmployee.email) {
      const employeeWithEmail = await Employee.findOne({
        email,
        _id: { $ne: id } // Exclude current employee from the check
      });

      if (employeeWithEmail) {
        return res.status(400).json({
          success: false,
          message: 'Another employee already uses this email',
          field: 'email'
        });
      }
    }

    // Prepare update data
    const updateData = {
      name: name || existingEmployee.name,
      email: email || existingEmployee.email,
      phone: phone || existingEmployee.phone,
      position: position || existingEmployee.position,
      address: address || existingEmployee.address,
      status: status || existingEmployee.status
    };

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      employee: updatedEmployee,
      message: 'Employee updated successfully'
    });
  } catch (error) {
    console.error('Update error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
        field: 'email'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Delete employee
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.userId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or you don\'t have permission'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Update employee status
export const updateEmployeeStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be "Active" or "Inactive"'
      });
    }

    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      { status },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or you don\'t have permission'
      });
    }

    res.status(200).json({
      success: true,
      employee,
      message: 'Employee status updated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};