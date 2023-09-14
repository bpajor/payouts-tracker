import { Employee } from "../models/employee.js";

const postAddEditEmployee = async (req, res, next, errors, mode) => {
  const name = req.body.name;
  const surname = req.body.surname;
  const hourlyRate = req.body.rate;
  const isDelegation = req.body.isDelegation === "yes" ? true : false;
  const delegationAmount = req.body.delegationAmount;
  const dailyHours = req.body.hours;
  const oldInput = { name, surname, hourlyRate, dailyHours };
  if (delegationAmount) {
    oldInput.delegationAmount = delegationAmount;
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
      isDelegation,
      dailyHours,
      bossId: req.user._id,
    });
    if (delegationAmount) {
      employee.delegationAmount = delegationAmount;
    }
  } else {
    employee = await Employee.findById(req.params.employeeId);
    employee.name = name;
    employee.surname = surname;
    employee.hourlyRate = hourlyRate;
    employee.isDelegation = isDelegation;
    employee.dailyHours = dailyHours;
    if (delegationAmount) {
      employee.delegationAmount = delegationAmount;
    }
  }
  await employee.save();
  res.redirect("/employees");
};

export default postAddEditEmployee;
