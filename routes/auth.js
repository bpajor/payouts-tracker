import Express from "express";
import {
  getLogin,
  getSignup,
  postLogin,
  postLogout,
  postSignup,
} from "../controllers/auth.js";
import { body } from "express-validator";
import { isAuth } from "../middleware/is-auth.js";

export const router = Express.Router();

router.get("/signup", isAuth, getSignup);

router.post(
  "/signup",
  [
    body("name")
      .matches(/^[a-zA-ZąĄćĆęĘłŁńŃóÓśŚźŹżŻ]+$/)
      .trim()
      .withMessage("Podaj proszę poprawne imię !")
      .customSanitizer((value) => {
        return value.charAt(0).toUpperCase() + value.slice(1);
      }),
    body("surname")
      .matches(/^[a-zA-ZąĄćĆęĘłŁńŃóÓśŚźŹżŻ]+$/)
      .trim()
      .withMessage("Podaj proszę poprawne nazwisko !")
      .customSanitizer((value) => {
        return value.charAt(0).toUpperCase() + value.slice(1);
      }),
    body("email")
      .isEmail()
      .withMessage("Podaj proszę poprawny email !")
      .normalizeEmail(),
    body("password")
      .custom((value, { req }) => {
        if (value.length < 6 || !/^[a-zA-Z0-9]+$/.test(value)) {
          throw new Error(
            "Podaj hasło, które ma co najmniej 6 znaków i składa się tylko z liter i cyfr."
          );
        }
        return true;
      })
      .trim(),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Hasła muszą się zgadzać!");
      }
      return true;
    }),
  ],
  postSignup
);

router.get("/login", isAuth, getLogin);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Podaj poprawny email !")
      .normalizeEmail(),
    body("password")
      .custom((value, { req }) => {
        if (value.length < 6 || !/^[a-zA-Z0-9]+$/.test(value)) {
          throw new Error(
            "Podaj hasło, które ma co najmniej 6 znaków i składa się tylko z liter i cyfr."
          );
        }
        return true;
      })
      .trim(),
  ],
  postLogin
);

router.post('/logout', isAuth, postLogout)
