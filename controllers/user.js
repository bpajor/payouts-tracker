import { validationResult } from "express-validator";
import { Employee } from "../models/employee.js";
import postAddEditEmployee from "../helpers/employeeAddEdit.js";
import { Campaign } from "../models/campaign.js";
import { ObjectId } from "mongodb";
// import pkg from "dialog";
// import pkg from "electron";
import * as reader from "xlsx/xlsx.mjs";
import fs from "fs";
import ExcelJs from "exceljs";
import pkg from "electron";

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
  console.log(req.params);
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
    if (!employee) {
      throw new Error("Employee not found");
    }
    if (employee.bossId.toString() !== req.user._id.toString()) {
      const error = new Error("Forbidden operation");
      error.httpStatusCode = 403;
      return next(error);
    }
    await employee.deleteOne();
    await req.user.campaign.updateCampaign();
    res.redirect("/employees");
  } catch (error) {
    console.log(error);
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};

export const getCampaign = async (req, res, next) => {
  const presentCampaign = await Campaign.where({
    ownerId: req.user._id,
  })
    .findOne()
    .populate("employeesData.employeeId");
  console.log(presentCampaign);
  let isCampaign = true;
  if (!presentCampaign) {
    isCampaign = false;
    return res.render("user/campaign", { pageTitle: "Kampania", isCampaign });
  }
  let allEmpSalarySum = 0;
  const topEmps = [];
  presentCampaign.employeesData.forEach((employee) => {
    const monthSalary =
      employee.bonusAmount +
      employee.employeeId.hourlyRate *
        employee.employeeId.dailyHours *
        (employee.workdays.daysNormal.length +
          employee.workdays.daysDelegation.length) +
      presentCampaign.delegationAmount *
        employee.workdays.daysDelegation.length +
      (employee.employeeId.isDriver ? employee.employeeId.driverAmount : 0);
    allEmpSalarySum += monthSalary;

    const emp = {
      name: employee.employeeId.name,
      surname: employee.employeeId.surname,
      monthSalary,
    };
    if (topEmps.length < 3) {
      topEmps.push(emp);
      topEmps.sort((empOne, empTwo) => {
        return empTwo.monthSalary - empOne.monthSalary;
      });
    } else {
      if (emp.monthSalary > topEmps[2].monthSalary) {
        topEmps[2] = emp;
      }
      topEmps.sort((empOne, empTwo) => {
        return empTwo.monthSalary - empOne.monthSalary;
      });
    }
  });
  res.render("user/campaign", {
    pageTitle: "Kampania",
    isCampaign,
    presentCampaign,
    allEmpSalarySum,
    topEmps,
  });
};

export const getAddCampaign = (req, res, next) => {
  res.render("user/add-campaign", { pageTitle: "Dodaj kampanię" });
};

export const postAddCampaign = async (req, res, next) => {
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
    let employees = [];
    presentCampaign.employeesData.forEach((employee) => {
      const employeeToPush = {
        ...employee.employeeId._doc,
        workdays: employee.workdays,
        bonusAmount: employee.bonusAmount,
      };
      employeeToPush.monthSalary =
        employee.bonusAmount +
        employee.employeeId.hourlyRate *
          employee.employeeId.dailyHours *
          (employee.workdays.daysNormal.length +
            employee.workdays.daysDelegation.length) +
        presentCampaign.delegationAmount *
          employee.workdays.daysDelegation.length +
        (employee.employeeId.isDriver ? employee.employeeId.driverAmount : 0);
      //   +
      // // (employee.employeeId.delegationAmount *
      // //   employee.workdays.daysDelegation.length);
      employees.push(employeeToPush);
    });
    console.log(employees[0].workdays.daysDelegation.length);
    return res.render("user/campaign-details", {
      pageTitle: "Szczegóły kampanii",
      employees: employees,
      campaignId: presentCampaign._id,
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
    employee.monthSalary =
      employee.bonusAmount +
      employee.employeeId.hourlyRate *
        employee.employeeId.dailyHours *
        (employee.workdays.daysNormal.length +
          employee.workdays.daysDelegation.length) +
      presentCampaign.delegationAmount *
        employee.workdays.daysDelegation.length +
      (employee.employeeId.isDriver ? employee.employeeId.driverAmount : 0);
    //   +
    // employee.employeeId.delegationAmount *
    //   employee.workdays.daysDelegation.length;

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

export const postUpdateEmployee = async (req, res, next) => {
  console.log(req.body);
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
    let employee;
    const employeeIndex = presentCampaign.employeesData.findIndex((emp) => {
      return emp.employeeId._id.toString() === req.params.employeeId.toString();
    });
    presentCampaign.employeesData[employeeIndex].workdays.daysDelegation = [
      ...selectedDelegationDays,
    ];
    presentCampaign.employeesData[employeeIndex].workdays.daysNormal = [
      ...selectedNormalDays,
    ];
    console.log(bonusAmount);
    presentCampaign.employeesData[employeeIndex].bonusAmount = bonusAmount;
    console.log(presentCampaign.employeesData[employeeIndex.workdays]);
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
  // res.render("user/end-campaign", { pageTitle: "Strona główna" });
  try {
    const presentCampaign = await Campaign.where({
      ownerId: req.user._id,
    })
      .findOne()
      .populate("employeesData.employeeId");
    let employees = [];
    presentCampaign.employeesData.forEach((employee) => {
      const employeeToPush = {
        ...employee.employeeId._doc,
        workdays: employee.workdays,
        bonusAmount: employee.bonusAmount,
      };
      employeeToPush.monthSalary =
        employee.bonusAmount +
        employee.employeeId.hourlyRate *
          employee.employeeId.dailyHours *
          (employee.workdays.daysNormal.length +
            employee.workdays.daysDelegation.length) +
        presentCampaign.delegationAmount *
          employee.workdays.daysDelegation.length +
        (employee.employeeId.isDriver ? employee.employeeId.driverAmount : 0);
      //   +
      // // (employee.employeeId.delegationAmount *
      // //   employee.workdays.daysDelegation.length);
      employeeToPush.randomId = 10000000000 * Math.random().toFixed(10);
      employees.push(employeeToPush);
    });
    return res.render("user/end-campaign", {
      pageTitle: "Zakończ kampanię",
      employees: employees,
      campaignId: presentCampaign._id,
    });
  } catch (error) {
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};

export const getCreateExcelFile = (req, res, next) => {
  res.render("user/create-excel-file", {
    pageTitle: "test",
  });
};

// export const postCreateExcelFile = async (req, res, next) => {
//   console.log("test");
//   const workbook = new ExcelJs.Workbook();
//   console.log(workbook);
//   workbook.addWorksheet("MySheet");
//   try {
//     await workbook.xlsx.writeFile("./test.xlsx");
//   } catch (err) {
//     console.log(err);
//   }
// };

export const postCreateExcelFile = async (req, res, next) => {
  const workbook = new ExcelJs.Workbook();
  const worksheet = workbook.addWorksheet("Pracownicy");
  worksheet.getCell("A1").value = "Lp.";
  worksheet.getCell("B1").value = "Imię";
  worksheet.getCell("C1").value = "Nazwisko";
  worksheet.getCell("D1").value = "Dni";
  worksheet.getCell("E1").value = "Stawka";
  worksheet.getCell("F1").value = "Liczba godzin";
  worksheet.getCell("G1").value = "Kwota";
  worksheet.getCell("H1").value = "Delegacja";
  worksheet.getCell("I1").value = "Kierowca";
  worksheet.getCell("J1").value = "Premia";
  worksheet.getCell("K1").value = "Razem";

  const presentCampaign = req.user.campaign;
  presentCampaign.employeesData.forEach((employee, index) => {
    console.log(presentCampaign);
    const rowIndex = index + 2;
    worksheet.getCell(`A${rowIndex}`).value = rowIndex - 1;
    worksheet.getCell(`B${rowIndex}`).value = employee.employeeId.name;
    worksheet.getCell(`C${rowIndex}`).value = employee.employeeId.surname;
    worksheet.getCell(`D${rowIndex}`).value = employee.workdays.daysNormal.length + employee.workdays.daysDelegation.length;
    worksheet.getCell(`E${rowIndex}`).value = employee.employeeId.hourlyRate;
    worksheet.getCell(`F${rowIndex}`).value = employee.employeeId.dailyHours;
    worksheet.getCell(`G${rowIndex}`).value = employee.employeeId.hourlyRate * employee.employeeId.dailyHours * (employee.workdays.daysNormal.length + employee.workdays.daysDelegation.length);
    worksheet.getCell(`H${rowIndex}`).value = employee.workdays.daysDelegation.length;
    worksheet.getCell(`I${rowIndex}`).value = employee.employeeId.isDriver ? employee.employeeId.driverAmount : 0;
    worksheet.getCell(`J${rowIndex}`).value = employee.bonusAmount;
    worksheet.getCell(`K${rowIndex}`).value = employee.employeeId.hourlyRate * employee.employeeId.dailyHours * (employee.workdays.daysNormal.length + employee.workdays.daysDelegation.length) + presentCampaign.delegationAmount * employee.workdays.daysDelegation.length + (employee.employeeId.isDriver ? employee.employeeId.driverAmount : 0) + employee.bonusAmount;
  })

  worksheet.eachRow(row => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      }
  })});

  try {
    const filePath = `wypłaty_${presentCampaign.title}.xlsx`; // Ścieżka do pliku

    await workbook.xlsx.writeFile(filePath);

    // Poniżej zaczyna się proces wysyłania pliku do klienta
    const fileStream = fs.createReadStream(filePath);

    fileStream.on("open", () => {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename=wyplaty_${presentCampaign.title}.xlsx`);
      fileStream.pipe(res);
    });

    fileStream.on("error", (err) => {
      res
        .status(500)
        .send({
          success: false,
          message: "Wystąpił błąd podczas tworzenia pliku.",
        });
    });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .send({
        success: false,
        message: "Wystąpił błąd podczas tworzenia pliku.",
      });
  }
};
