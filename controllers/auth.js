import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import {User} from "../models/user.js";

export const getSignup = (req, res, next) => {
  console.log("render signup");
  res.render("auth/signup", {
    pageTitle: "Zarejestruj się",
    errors: [],
    oldInput: undefined,
  });
};

export const postSignup = async (req, res, next) => {
  const name = req.body.name;
  const surname = req.body.surname;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const oldInput = { name, surname, email, password, confirmPassword };
  const errors = validationResult(req);
  const filteredUsers = await User.find().where('email').equals(email);
  const isUserSigned = filteredUsers.length !== 0;
  if (!errors.isEmpty() || isUserSigned) {
    const error = new Error("Validator error");
    error.httpStatusCode = 422;
    const reasons = errors.array().map((reason) => {
      return { path: reason.path, msg: reason.msg };
    });
    if (isUserSigned) {
      reasons.push({path: 'email', msg: 'Użytkownik o danym emailu istnieje !'})
    }
    error.content = { reasons, inputs: oldInput, isUserSigned };
    return next(error);
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      name,
      surname,
      email,
      password: hashedPassword,
    });
    const saveUserResult = await user.save();
    res.redirect("/login");
  } catch (error) {
    error.message = 'Server bug';
    error.httpStatusCode = 500;
    return next(error);
  }
};

export const getLogin = (req, res, next) => {
  res.render('auth/login', {pageTitle: 'Zaloguj się'})
}
