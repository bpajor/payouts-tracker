import { ObjectId } from "mongodb";
import { Employee } from "../models/employee.js";

const postAddEditEmployee = async (req, res, next, errors, mode) => {
  if (mode === 'Edit' && !ObjectId.isValid(req.params.employeeId)) {
    throw new Error("Employee not found");
  }
  console.log('not an error')
  const name = req.body.name;
  const surname = req.body.surname;
  const hourlyRate = req.body.rate;
  const isDriver = req.body.isDriver === "yes" ? true : false;
  const driverAmount = req.body.driverAmount;
  const dailyHours = req.body.hours;
  const oldInput = { name, surname, hourlyRate, dailyHours };
  if (driverAmount) {
    oldInput.driverAmount = driverAmount;
  }
  if (!errors.isEmpty()) {
    const error = new Error(
      mode === "Add" ? "Adding employee error" : "Editing employee error"
    );
    error.view = "user/add-employee";
    error.httpStatusCode = 422;
    const reasons = errors.array().map((reason) => {
      return { path: reason.path, msg: reason.msg };
    });
    error.content = { reasons, inputs: oldInput, isUserSigned: undefined };
    return next(error);
  }
  let employee;
  if (mode === "Add") {
    employee = new Employee({
      name,
      surname,
      hourlyRate,
      isDriver,
      dailyHours,
      bossId: req.user._id,
    });
    if (driverAmount) {
      employee.driverAmount = driverAmount;
    }
  } else {
    employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }
    employee.name = name;
    employee.surname = surname;
    employee.hourlyRate = hourlyRate;
    employee.isDriver = isDriver;
    employee.dailyHours = dailyHours;
    if (driverAmount) {
      employee.driverAmount = driverAmount;
    }
  }
  await employee.save();
  res.redirect("/employees");
};

export default postAddEditEmployee;
