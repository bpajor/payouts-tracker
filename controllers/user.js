import { validationResult } from "express-validator";
import { Employee } from "../models/employee.js";
import postAddEditEmployee from "../helpers/employeeAddEdit.js";
import { Campaign } from "../models/campaign.js";
import { ObjectId } from "mongodb";

export const getHome = (req, res, next) => {
  console.log(req.user);
  res.render("user/home", { pageTitle: "Strona główna" });
};

export const getEmployees = async (req, res, next) => {
  try {
    let foundEmployees = await Employee.find()
      .where("bossId")
      .equals(req.user._id);
    if (!foundEmployees.length) {
      foundEmployees = undefined;
    }
    res.render("user/employees", {
      pageTitle: "Twoi pracownicy",
      employees: foundEmployees,
    });
  } catch (error) {
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};

export const getAddEmployee = (req, res, next) => {
  res.render("user/add-employee", {
    pageTitle: "Dodaj pracownika",
    errors: [],
    oldInput: {},
    isUserSigned: undefined,
    edit: false,
  });
};

export const getEditEmployee = async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.employeeId)) {
      throw new Error("Employee not found");
    }
    const foundEmployee = await Employee.findById(req.params.employeeId);
    console.log(foundEmployee);
    if (!foundEmployee) {
      throw new Error("Employee not found");
    }
    if (foundEmployee.bossId.toString() !== req.user._id.toString()) {
      throw new Error("Forbidden operation");
    }
    const { name, surname, hourlyRate, dailyHours, _id } = foundEmployee;
    const oldInput = {
      name,
      surname,
      hourlyRate,
      dailyHours,
      delegationAmount: foundEmployee.delegationAmount,
      id: _id.toString(),
    };
    console.log(oldInput);
    res.render("user/add-employee", {
      pageTitle: "Edytuj pracownika",
      errors: [],
      oldInput,
      isUserSigned: undefined,
      edit: true,
    });
  } catch (error) {
    if (error.message === "Employee not found") {
      error.httpStatusCode = 404;
    } else {
      error.httpStatusCode = 403;
    }
    return next(error);
  }
};

export const postAddEmployee = async (req, res, next) => {
  const errors = validationResult(req);
  try {
    await postAddEditEmployee(req, res, next, errors, "Add");
  } catch (error) {
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};

export const postEditEmployee = async (req, res, next) => {
  const errors = validationResult(req);
  try {
    await postAddEditEmployee(req, res, next, errors, "Edit");
  } catch (error) {
    if (error.message === "Employee not found") {
      error.httpStatusCode = 404;
    } else {
      error.message = "Server bug";
      error.httpStatusCode = 500;
    }
    return next(error);
  }
};

export const postDeleteEmployee = async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.employeeId)) {
      throw new Error("Employee not found");
    }
    const employee = await Employee.findById(req.params.employeeId);
    if (!foundEmployee) {
      throw new Error("Employee not found");
    }
    if (employee.bossId.toString() !== req.user._id.toString()) {
      const error = new Error("Forbidden operation");
      error.httpStatusCode = 403;
      return next(error);
    }
    await employee.deleteOne();
    res.redirect("/employees");
  } catch (error) {
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};

export const getCampaign = async (req, res, next) => {
  const presentCampaign = await Campaign.where({
    ownerId: req.user._id,
  }).findOne();
  let isCampaign = true;
  if (!presentCampaign) {
    isCampaign = false;
    return res.render("user/campaign", { pageTitle: "Kampania", isCampaign });
  }
  const endtime = presentCampaign.endtime;
  res.render("user/campaign", {
    pageTitle: "Kampania",
    isCampaign,
    presentCampaign,
  });
};

export const getAddCampaign = (req, res, next) => {
  res.render("user/add-campaign", { pageTitle: "Dodaj kampanię" });
};

export const postAddCampaign = async (req, res, next) => {
  let { title, endtime } = req.body;
  endtime = new Date(endtime);
  endtime.setHours(endtime.getHours() + 2);
  const ownerId = req.user._id;
  const newCampaign = new Campaign({
    title,
    endtime,
    ownerId,
    employees: [],
  });
  try {
    await newCampaign.addCampaign(ownerId);
    return res.redirect("/campaign");
  } catch (error) {
    console.log(error);
    error.httpStatusCode = 500;
    return next(error);
  }
};

export const postDeleteCampaign = async (req, res, next) => {
  const campaignId = req.params.campaignId;
  try {
    const campaign = await Campaign.findById(campaignId);
    await campaign.deleteOne();
    return res.redirect("/campaign");
  } catch (error) {
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};

export const getCampaignDetails = async (req, res, next) => {
  try {
    const presentCampaign = await Campaign.where({
      ownerId: req.user._id,
    })
      .findOne()
      .populate("employeesData.employeeId");
    return res.render("user/campaign-details", {
      pageTitle: "Szczegóły kampanii",
      employees: presentCampaign.employeesData,
    });
  } catch (error) {
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};

export const getEmployeeDetails = async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.employeeId)) {
      throw new Error("Employee not found");
    }
    const presentCampaign = await Campaign.where({
      ownerId: req.user._id,
    })
      .findOne()
      .populate("employeesData.employeeId");
    let employee;
    const employeeIndex = presentCampaign.employeesData.findIndex((emp) => {
      return emp.employeeId._id.toString() === req.params.employeeId.toString();
    });
    employee = { ...presentCampaign.employeesData[employeeIndex]["_doc"] };
    if (!employee) {
      throw new Error("Employee not found");
    }
    console.log(employee);
    const campaignEndTime = presentCampaign.endtime;
    return res.render("user/employee-details", {
      pageTitle: "Sczegóły pracownika",
      employee,
      campaignEndTime,
    });
  } catch (error) {
    if (error.message === "Employee not found") {
      error.httpStatusCode = 404;
    } else {
      error.message = "Server bug";
      error.httpStatusCode = 500;
    }
    return next(error);
  }
};

export const postUpdateEmployeeWorkdays = async (req, res, next) => {
  const selectedDays = req.body["dates"].split(", ");
  console.log(selectedDays);
  try {
    const presentCampaign = await Campaign.where({
      ownerId: req.user._id,
    })
      .findOne()
      .populate("employeesData.employeeId");
    let employee;
    const employeeIndex = presentCampaign.employeesData.findIndex((emp) => {
      return emp.employeeId._id.toString() === req.params.employeeId.toString();
    });
    presentCampaign.employeesData[employeeIndex].workdays = selectedDays;
    await presentCampaign.save();
    return res.redirect("/campaign");
  } catch (error) {
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};
