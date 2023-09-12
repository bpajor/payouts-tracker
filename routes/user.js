import Express from "express";
import { getAddCampaign, getAddEmployee, getCampaign, getEditEmployee, getEmployees, getHome, postAddCampaign, postAddEmployee, postDeleteEmployee, postEditEmployee } from "../controllers/user.js";
import { body } from "express-validator";
import { isAuth } from "../middleware/is-auth.js";

export const router = Express.Router();

router.get("/", getHome);

router.get("/employees", isAuth, getEmployees);

router.get("/add-employee", isAuth, getAddEmployee);

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
], isAuth, postAddEmployee);

router.get('/edit-employee/:employeeId', isAuth, getEditEmployee);

router.post('/edit-employee/:employeeId', isAuth, postEditEmployee);

router.post('/delete-employee/:employeeId', isAuth, postDeleteEmployee);

router.get('/campaign', getCampaign);

router.get('/add-campaign', getAddCampaign);

router.post('/add-campaign', postAddCampaign);