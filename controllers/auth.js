import { validationResult } from "express-validator";

export const getSignup = (req, res, next) => {
  console.log("render signup");
  res.render("auth/signup", {
    pageTitle: "Zarejestruj się",
    errors: [],
    oldInput: undefined,
  });
};

export const postSignup = (req, res, next) => {
  const name = req.body.name;
  const surname = req.body.surname;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const oldInput = { name, surname, email, password, confirmPassword };
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validator error");
    error.httpStatusCode = 422;
    const reasons = errors.array().map((reason) => {
      return { path: reason.path, msg: reason.msg };
    });
    error.content = { reasons, inputs: oldInput };
    return next(error);
  }
};
