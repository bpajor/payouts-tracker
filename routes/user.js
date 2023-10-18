import Express from "express";
import {
  getAddCampaign,
  getAddEmployee,
  getCampaign,
  getCampaignDetails,
  getCampaingsStory,
  getEditEmployee,
  getEmployeeDetails,
  getEmployees,
  getEndCampaign,
  getHome,
  postAddCampaign,
  postAddEmployee,
  postCreateExcelFile,
  postDeleteCampaign,
  postDeleteEmployee,
  postEditEmployee,
  postUpdateCampaign,
  postUpdateEmployee,
} from "../controllers/user.js";
import { body } from "express-validator";
import { isAuth } from "../middleware/is-auth.js";
import { csrfSynchronisedProtection } from "../helpers/csrfMiddleware.js";

export const router = Express.Router();

router.get("/", getHome);

router.get("/employees", isAuth, getEmployees);

router.get("/add-employee", isAuth, getAddEmployee);

router.post(
  "/add-employee",
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
  ],
  csrfSynchronisedProtection,
  isAuth,
  postAddEmployee
);

router.get("/edit-employee/:employeeId", isAuth, getEditEmployee);

router.post(
  "/edit-employee/:employeeId",
  csrfSynchronisedProtection,
  isAuth,
  postEditEmployee
);

router.post(
  "/delete-employee/:employeeId",
  csrfSynchronisedProtection,
  isAuth,
  postDeleteEmployee
);

router.get("/campaign", isAuth, getCampaign);

router.get("/add-campaign", isAuth, getAddCampaign);

router.post(
  "/add-campaign",
  [
    body("title")
      .matches(/^[\x20-\x7E\x80-\xFF]+$/)
      .withMessage("Nie używaj polskich znaków w nazwie kampanii !"),
  ],
  csrfSynchronisedProtection,
  isAuth,
  postAddCampaign
);

router.post(
  "/delete-campaign/:campaignId",
  csrfSynchronisedProtection,
  isAuth,
  postDeleteCampaign
);

router.get("/campaign-details", isAuth, getCampaignDetails);

router.get("/employee-details/:employeeId", isAuth, getEmployeeDetails);

router.post(
  "/update-workdays/:employeeId",
  csrfSynchronisedProtection,
  isAuth,
  postUpdateEmployee
);

router.post(
  "/update-campaign/:campaignId",
  csrfSynchronisedProtection,
  isAuth,
  postUpdateCampaign
);

router.get("/end-campaign", isAuth, getEndCampaign);

router.post(
  "/create-excel-file",
  csrfSynchronisedProtection,
  isAuth,
  postCreateExcelFile
);

router.get("/campaigns-story", isAuth, getCampaingsStory);
