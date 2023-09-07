import { validationResult } from "express-validator";
import { Employee } from "../models/employee.js";

export const getHome = (req, res, next) => {
  console.log(req.user);
  res.render("user/home", { pageTitle: "Strona główna" });
};

export const getEmployees = async (req, res, next) => {
  try {
      let foundEmployees = await Employee.find().where('bossId').equals(req.user._id);
      if (!foundEmployees.length) {
        foundEmployees = undefined;
      }
      res.render("user/employees", {
      pageTitle: "Twoi pracownicy",
      employees: foundEmployees,
    });
  }
  catch (error) {
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
    edit: false
  });
};

export const getEditEmployee = (req, res, next) => {
  
}

export const postAddEmployee = async (req, res, next) => {
  const name = req.body.name;
  const surname = req.body.surname;
  const hourlyRate = req.body.rate;
  const isDelegation = req.body.isDelegation === "yes" ? true : false;
  const dailyHours = req.body.hours;
  const oldInput = { name, surname, hourlyRate, dailyHours };
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Adding employee error");
    error.view = "user/add-employee";
    error.httpStatusCode = 422;
    const reasons = errors.array().map((reason) => {
      return { path: reason.path, msg: reason.msg };
    });
    error.content = { reasons, inputs: oldInput, isUserSigned: undefined };
    return next(error);
  }

  try {
    const employee = new Employee({
      name,
      surname,
      hourlyRate,
      isDelegation,
      dailyHours,
      bossId: req.user._id,
    });
    
    const saveEmployeeResult = await employee.save();
    res.redirect('/employees');
  } catch (error) {
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};
