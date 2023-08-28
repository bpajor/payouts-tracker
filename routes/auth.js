import Express from "express";
import { getSignup, postSignup } from "../controllers/auth.js";
import { body } from "express-validator";

export const router = Express.Router();

router.get("/signup", getSignup);

router.post(
  "/signup",
  [
    body("name")
      .isAlpha()
      .trim()
      .withMessage("Podaj proszę poprawne imię !")
      .customSanitizer((value) => {
        return value.charAt(0).toUpperCase() + value.slice(1);
      }),
    body("surname")
      .isAlpha()
      .trim()
      .withMessage("Podaj proszę poprawne nazwisko !")
      .customSanitizer((value) => {
        return value.charAt(0).toUpperCase() + value.slice(1);
      }),
    body("email")
      .isEmail()
      .withMessage("Podaj proszę poprawny email !")
      .normalizeEmail(),
    body("password", "Podaj hasło które ma conajmniej 6 znaków oraz posiada tylko cyfry bądź litery")
      .isLength({ min: 6 })
      .isAlphanumeric()
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
