import Express from "express";
import { getAddCampaign, getAddEmployee, getCampaign, getCampaignDetails, getEditEmployee, getEmployeeDetails, getEmployees, getHome, postAddCampaign, postAddEmployee, postDeleteCampaign, postDeleteEmployee, postEditEmployee, postUpdateCampaign, postUpdateEmployeeWorkdays } from "../controllers/user.js";
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

router.get('/campaign', isAuth, getCampaign);

router.get('/add-campaign', isAuth, getAddCampaign);

router.post('/add-campaign', isAuth, postAddCampaign);

router.post('/delete-campaign/:campaignId', isAuth, postDeleteCampaign);

router.get('/campaign-details', isAuth, getCampaignDetails);

router.get('/employee-details/:employeeId', isAuth, getEmployeeDetails);

router.post('/update-workdays/:employeeId', postUpdateEmployeeWorkdays);

router.post('/update-campaign/:campaignId', postUpdateCampaign);