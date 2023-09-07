import { validationResult } from "express-validator";

export const getHome = (req, res, next) => {
  console.log(req.user);
  res.render("user/home", { pageTitle: "Strona główna" });
};

export const getEmployees = (req, res, next) => {
  res.render("user/employees", {
    pageTitle: "Twoi pracownicy",
    employees: null,
  });
};

export const getAddEmployee = (req, res, next) => {
  res.render("user/add-employee", {
    pageTitle: "Dodaj pracownika",
    errors: [],
    oldInput: {},
    isUserSigned: undefined,
  });
};

export const postAddEmployee = (req, res, next) => {
  const name = req.body.name;
  const surname = req.body.surname;
  const hourlyRate = req.body.rate;
  const isDelegation = req.body.isDelegation;
  const dailyHours = req.body.hours;
  const oldInput = { name, surname, hourlyRate, dailyHours };
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('error happened')
    const error = new Error("Adding employee error");
    error.view = "user/add-employee";
    error.httpStatusCode = 422;
    const reasons = errors.array().map((reason) => {
      return { path: reason.path, msg: reason.msg };
    });
    error.content = { reasons, inputs: oldInput, isUserSigned: undefined };
    return next(error);
  }
};
