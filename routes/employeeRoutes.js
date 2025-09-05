import express from 'express';
import {
  addEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeeStatus
} from '../controllers/employeeController.js';
import authUser from '../middlewares/authUser.js';

const employeeRouter = express.Router();

employeeRouter.post('/', authUser, addEmployee);
employeeRouter.get('/', authUser, getEmployees);
employeeRouter.get('/:id', authUser, getEmployee);
employeeRouter.put('/:id', authUser, updateEmployee);
employeeRouter.delete('/:id', authUser, deleteEmployee);
employeeRouter.patch('/:id/status', authUser, updateEmployeeStatus);

export default employeeRouter;