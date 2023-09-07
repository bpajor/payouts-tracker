import Express from "express";
import { getAddEmployee, getEmployees, getHome, postAddEmployee } from "../controllers/user.js";
import { body } from "express-validator";

export const router = Express.Router();

router.get("/", getHome);

router.get("/employees", getEmployees);

router.get("/add-employee", getAddEmployee);

router.post("/add-employee", [
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
], postAddEmployee);
