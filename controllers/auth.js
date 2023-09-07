import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import { User } from "../models/user.js";

export const getSignup = (req, res, next) => {
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
  const filteredUsers = await User.find().where("email").equals(email);
  const isUserSigned = filteredUsers.length !== 0;
  if (!errors.isEmpty() || isUserSigned) {
    const error = new Error("Signup error");
    error.view = "auth/signup";
    error.httpStatusCode = 422;
    const reasons = errors.array().map((reason) => {
      return { path: reason.path, msg: reason.msg };
    });
    if (isUserSigned) {
      reasons.push({
        path: "email",
        msg: "Użytkownik o danym emailu istnieje !",
      });
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
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};

export const getLogin = (req, res, next) => {
  res.render("auth/login", {
    pageTitle: "Zaloguj się",
    errors: [],
    oldInput: undefined,
  });
};

export const postLogin = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const oldInput = { email, password };
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Login error");
    error.view = "auth/login";
    error.httpStatusCode = 422;
    const reasons = errors.array().map((reason) => {
      return { path: reason.path, msg: reason.msg };
    });
    error.content = { reasons, inputs: oldInput, isUserSigned: undefined };
    return next(error);
  }

  const userQuery = User.where({ email: email });
  try {
    const foundUser = await userQuery.findOne();
    if (!foundUser) {
      throw new Error("Bad email");
    }
    const userPassword = foundUser.password;
    const isInputPasswordCorrect = await bcrypt.compare(password, userPassword);
    if (!isInputPasswordCorrect) {
      throw new Error("Bad password");
    }
    req.session.isLoggedIn = true;
    req.session.user = foundUser;
    const sessionSaveResult = await req.session.save((err) => {
      if (err) {
        throw new Error("Server bug");
      }
    });
    res.redirect("/");
  } catch (error) {
    switch (error.message) {
      case "Server bug":
        error.httpStatusCode = 500;
        return next(error);
      case "Bad email":
        error.httpStatusCode = 422;
        break;
      case "Bad password":
        error.httpStatusCode = 401;
        break;
    }
    error.view = "auth/login";
    // const reasons = errors.array().map((reason) => {
    //   return { path: reason.path, msg: reason.msg };
    // });
    const reasons = [
      {
        path: error.message === "Bad email" ? "email" : "password",
        msg:
          error.message === "Bad email"
            ? "Użytkownik o tym adresie email nie istnieje. Spróbuj ponownie"
            : "Podałeś niepoprawne hasło",
      },
    ];
    error.content = { reasons, inputs: oldInput, isUserSigned: undefined };
    return next(error);
  }
};

export const postLogout = async (req, res, next) => {
  const sessionDestroyResult = await req.session.destroy((error) => {
    if (error) {
      error.message = "Server bug";
      error.httpStatusCode = 500;
      return next(error);
    }
  });
  res.redirect("/");
};
