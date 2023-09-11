import { validationResult } from "express-validator";
import { Employee } from "../models/employee.js";
import postAddEditEmployee from "../helpers/employeeAddEdit.js";

export const getHome = (req, res, next) => {
  console.log(req.user);
  res.render("user/home", { pageTitle: "Strona główna" });
};

export const getEmployees = async (req, res, next) => {
  try {
    let foundEmployees = await Employee.find()
      .where("bossId")
      .equals(req.user._id);
    if (!foundEmployees.length) {
      foundEmployees = undefined;
    }
    res.render("user/employees", {
      pageTitle: "Twoi pracownicy",
      employees: foundEmployees,
    });
  } catch (error) {
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};

export const getAddEmployee = (req, res, next) => {
  res.render("user/add-employee", {
    pageTitle: "Dodaj pracownika",
    errors: [],
    oldInput: {},
    isUserSigned: undefined,
    edit: false,
  });
};

export const getEditEmployee = async (req, res, next) => {
  const foundEmployee = await Employee.findById(req.params.employeeId);
  if (foundEmployee.bossId.toString() !== req.user._id.toString()) {
    const error = new Error('Forbidden operation');
    error.httpStatusCode = 403;
    return next(error);
  }
  const { name, surname, hourlyRate, dailyHours, _id } = foundEmployee;
  const oldInput = {
    name,
    surname,
    hourlyRate,
    dailyHours,
    id: _id.toString(),
  };
  console.log(oldInput);
  res.render("user/add-employee", {
    pageTitle: "Edytuj pracownika",
    errors: [],
    oldInput,
    isUserSigned: undefined,
    edit: true,
  });
};

export const postAddEmployee = async (req, res, next) => {
  const errors = validationResult(req);
  try {
    await postAddEditEmployee(req, res, next, errors, "Add");
  } catch (error) {
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};

export const postEditEmployee = async (req, res, next) => {
  const errors = validationResult(req);
  try {
    await postAddEditEmployee(req, res, next, errors, "Edit");
  } catch (error) {
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};

export const postDeleteEmployee = async (req, res, next) => {
  const employee = await Employee.findById(req.params.employeeId);
  if (employee.bossId.toString() !== req.user._id.toString()) {
    const error = new Error('Forbidden operation');
    error.httpStatusCode = 403;
    return next(error);
  }
  try {
    await employee.deleteOne();
    res.redirect("/employees");
  } catch (error) {
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};
