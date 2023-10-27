import { validationResult } from "express-validator";
import { Employee } from "../models/employee.js";
import postAddEditEmployee from "../helpers/employeeAddEdit.js";
import { Campaign } from "../models/campaign.js";
import { ObjectId } from "mongodb";
import fs from "fs";
import { OldCampaigns } from "../models/oldCampaigns.js";

export const getHome = (req, res, next) => {
  res.redirect("/campaign");
};

export const getEmployees = async (req, res, next) => {
  try {
    let foundEmployees = await Employee.find()
      .where("bossId")
      .equals(req.user._id);
    if (!foundEmployees.length) {
      foundEmployees = undefined;
    } else {
      foundEmployees.forEach((employee, index) => {
        employee.randomId = 10000000000 * Math.random().toFixed(10);
      });
    }
    res.render("user/employees", {
      pageTitle: "Twoi pracownicy",
      employees: foundEmployees,
    });
  } catch (error) {
    console.log(error);
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
    res.render("user/add-employee", {
      pageTitle: "Edytuj pracownika",
      errors: [],
      oldInput,
      isUserSigned: undefined,
      edit: true,
    });
  } catch (error) {
    console.log(error);
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
    console.log(error);
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
    console.log(error);
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
  console.log("in post delete endpoint");
  try {
    if (!ObjectId.isValid(req.params.employeeId)) {
      throw new Error("Employee not found");
    }
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }
    if (employee.bossId.toString() !== req.user._id.toString()) {
      const error = new Error("Forbidden operation");
      error.httpStatusCode = 403;
      return next(error);
    }
    await employee.deleteOne();
    console.log("employee should be deleted");
    if (req.user.campaign) {
      await req.user.campaign.updateCampaign();
    }
    res.redirect("/employees");
  } catch (error) {
    console.log(error);
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};

export const getCampaign = async (req, res, next) => {
  try {
    const presentCampaign = await Campaign.where({
      ownerId: req.user._id,
    })
      .findOne()
      .populate("employeesData.employeeId");
    let isCampaign = true;
    if (!presentCampaign) {
      isCampaign = false;
      return res.render("user/campaign", { pageTitle: "Kampania", isCampaign });
    }
    const allEmpSalarySum = presentCampaign.calculateAllExpenses();
    const topEmps = presentCampaign.calculateTopEmployees();

    res.render("user/campaign", {
      pageTitle: "Kampania",
      isCampaign,
      presentCampaign,
      allEmpSalarySum,
      topEmps,
    });
  } catch (error) {
    console.log(error);
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};

export const getAddCampaign = (req, res, next) => {
  res.render("user/add-campaign", { pageTitle: "Dodaj kampanię", errors: [] });
};

export const postAddCampaign = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Bad filename");
    error.view = "user/add-campaign";
    error.httpStatusCode = 422;
    const reasons = errors.array().map((reason) => {
      return { path: reason.path, msg: reason.msg };
    });
    error.content = { reasons, inputs: oldInput, isUserSigned: undefined };
    return next(error);
  }
  let { title, endtime, delegationAmount } = req.body;
  endtime = new Date(endtime);
  endtime.setHours(endtime.getHours() + 2);
  const ownerId = req.user._id;
  const newCampaign = new Campaign({
    title,
    endtime,
    ownerId,
    delegationAmount,
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

export const postUpdateCampaign = async (req, res, next) => {
  const campaignId = req.params.campaignId;
  try {
    const campaign = await Campaign.findById(campaignId);
    campaign.updateCampaign(req.user._id);
  } catch (error) {
    console.log(error);
    error.message = "Server bug";
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
    console.log(error);
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
    if (!presentCampaign) {
      return res.redirect("/");
    }
    const employees = presentCampaign.extractEmployeesData();
    return res.render("user/campaign-details", {
      pageTitle: "Szczegóły kampanii",
      employees: employees,
      campaignId: presentCampaign._id,
    });
  } catch (error) {
    console.log(error);
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
    const employee = presentCampaign.extractEmployeeData(req.params.employeeId);

    const campaignEndTime = presentCampaign.endtime;
    return res.render("user/employee-details", {
      pageTitle: "Szczegóły pracownika",
      employee,
      campaignEndTime,
    });
  } catch (error) {
    console.log(error);
    if (error.message === "Employee not found") {
      error.httpStatusCode = 404;
    } else {
      error.message = "Server bug";
      error.httpStatusCode = 500;
    }
    return next(error);
  }
};

export const postUpdateEmployee = async (req, res, next) => {
  let selectedDelegationDays = req.body["datesDelegation"].split(", ");
  let selectedNormalDays = req.body["datesNormal"].split(", ");
  if (selectedDelegationDays[0] === "") {
    selectedDelegationDays = [];
  }
  if (selectedNormalDays[0] === "") {
    selectedNormalDays = [];
  }
  const bonusAmount = req.body.bonus;
  try {
    const presentCampaign = await Campaign.where({
      ownerId: req.user._id,
    })
      .findOne()
      .populate("employeesData.employeeId");
    if (!presentCampaign) {
      return res.redirect("/");
    }
    presentCampaign.updateEmployee(
      req.params.employeeId,
      bonusAmount,
      selectedDelegationDays,
      selectedNormalDays
    );

    await presentCampaign.save();
    return res.redirect("/campaign");
  } catch (error) {
    console.log(error);
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};

export const getEndCampaign = async (req, res, next) => {
  try {
    const presentCampaign = await Campaign.where({
      ownerId: req.user._id,
    })
      .findOne()
      .populate("employeesData.employeeId");
    if (!presentCampaign) {
      return res.redirect("/");
    }
    const employees = presentCampaign.extractEmployeesData();
    console.log(employees);

    return res.render("user/end-campaign", {
      pageTitle: "Zakończ kampanię",
      employees: employees,
      campaignId: presentCampaign._id,
    });
  } catch (error) {
    console.log(error);
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};

export const postCreateExcelFile = async (req, res, next) => {
  const presentCampaign = req.user.campaign;

  if (!presentCampaign) {
    return res.redirect("/");
  }

  const allExpenses = presentCampaign.calculateAllExpenses();

  const employeesData = [];
  presentCampaign.employeesData.forEach((employee, index) => {
    const employeeData = {
      name: employee.employeeId.name,
      surname: employee.employeeId.surname,
      payment: presentCampaign.calculateEmployeeMonthSalary(index),
      daysWorked:
        employee.workdays.daysNormal.length +
        employee.workdays.daysDelegation.length,
    };
    employeesData.push(employeeData);
  });

  const oldCampaign = new OldCampaigns({
    title: presentCampaign.title,
    ownerId: presentCampaign.ownerId,
    allExpenses,
    endtime: presentCampaign.endtime,
    employeesData,
  });

  const workbook = presentCampaign.createExcelFile();

  try {
    await oldCampaign.save();
    const filePath = `wypłaty_${presentCampaign.title}.xlsx`;

    await workbook.xlsx.writeFile(filePath);

    const fileStream = fs.createReadStream(filePath);

    fileStream.on("open", async () => {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=wyplaty_${presentCampaign.title}.xlsx`
      );
      fileStream.pipe(res);
      await presentCampaign.deleteOne();
    });

    fileStream.on("error", (err) => {
      throw new Error(err);
    });

    3;
  } catch (error) {
    console.log(error);
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};

export const getCampaingsStory = async (req, res, next) => {
  try {
    const oldCampaigns = await OldCampaigns.find({ ownerId: req.user._id });
    res.render("user/campaigns-story", {
      pageTitle: "Historia kampanii",
      oldCampaigns,
    });
  } catch (error) {
    console.log(error);
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};

export const postNonExcel = async (req, res, next) => {
  const presentCampaign = req.user.campaign;

  if (!presentCampaign) {
    return res.redirect("/");
  }

  const allExpenses = presentCampaign.calculateAllExpenses();

  const employeesData = [];
  presentCampaign.employeesData.forEach((employee, index) => {
    const employeeData = {
      name: employee.employeeId.name,
      surname: employee.employeeId.surname,
      payment: presentCampaign.calculateEmployeeMonthSalary(index),
      daysWorked:
        employee.workdays.daysNormal.length +
        employee.workdays.daysDelegation.length,
      randomId: 10000000000 * Math.random().toFixed(10),
    };
    employeesData.push(employeeData);
  });

  const oldCampaign = new OldCampaigns({
    title: presentCampaign.title,
    ownerId: presentCampaign.ownerId,
    allExpenses,
    endtime: presentCampaign.endtime,
    employeesData,
  });
  try {
    await oldCampaign.save();
    await presentCampaign.deleteOne();
    return res.redirect("/campaigns-story");
  } catch (error) {
    console.log(error);
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};
