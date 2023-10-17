import { validationResult } from "express-validator";
import { Employee } from "../models/employee.js";
import postAddEditEmployee from "../helpers/employeeAddEdit.js";
import { Campaign } from "../models/campaign.js";
import { ObjectId } from "mongodb";
import fs from "fs";
import ExcelJs from "exceljs";
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
    const employees = presentCampaign.extractEmployeesData();
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
    const employee = presentCampaign.extractEmployeeData(req.params.employeeId);

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
        (employee.employeeId.isDriver
          ? employee.employeeId.driverAmount *
            (employee.workdays.daysNormal.length +
              employee.workdays.daysDelegation.length)
          : 0);
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
  const presentCampaign = req.user.campaign;

  let allExpenses = 0;
  presentCampaign.employeesData.forEach((employee) => {
    allExpenses +=
      employee.employeeId.hourlyRate *
        employee.employeeId.dailyHours *
        (employee.workdays.daysNormal.length +
          employee.workdays.daysDelegation.length) +
      presentCampaign.delegationAmount *
        employee.workdays.daysDelegation.length +
      (employee.employeeId.isDriver
        ? employee.employeeId.driverAmount *
          (employee.workdays.daysDelegation.length +
            employee.workdays.daysNormal.length)
        : 0) +
      employee.bonusAmount;
  });

  const employeesData = [];
  presentCampaign.employeesData.forEach((employee) => {
    const employeeData = {
      name: employee.employeeId.name,
      surname: employee.employeeId.surname,
      payment:
        employee.employeeId.hourlyRate *
          employee.employeeId.dailyHours *
          (employee.workdays.daysNormal.length +
            employee.workdays.daysDelegation.length) +
        presentCampaign.delegationAmount *
          employee.workdays.daysDelegation.length +
        (employee.employeeId.isDriver ? employee.employeeId.driverAmount : 0) +
        employee.bonusAmount,
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

  await oldCampaign.save();

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

  presentCampaign.employeesData.forEach((employee, index) => {
    console.log(presentCampaign);
    const rowIndex = index + 2;
    worksheet.getCell(`A${rowIndex}`).value = rowIndex - 1;
    worksheet.getCell(`B${rowIndex}`).value = employee.employeeId.name;
    worksheet.getCell(`C${rowIndex}`).value = employee.employeeId.surname;
    worksheet.getCell(`D${rowIndex}`).value =
      employee.workdays.daysNormal.length +
      employee.workdays.daysDelegation.length;
    worksheet.getCell(`E${rowIndex}`).value = employee.employeeId.hourlyRate;
    worksheet.getCell(`F${rowIndex}`).value = employee.employeeId.dailyHours;
    worksheet.getCell(`G${rowIndex}`).value =
      employee.employeeId.hourlyRate *
      employee.employeeId.dailyHours *
      (employee.workdays.daysNormal.length +
        employee.workdays.daysDelegation.length);
    worksheet.getCell(`H${rowIndex}`).value =
      employee.workdays.daysDelegation.length *
      presentCampaign.delegationAmount;
    worksheet.getCell(`I${rowIndex}`).value = employee.employeeId.isDriver
      ? employee.employeeId.driverAmount *
        (employee.workdays.daysNormal.length +
          employee.workdays.daysDelegation.length)
      : 0;
    worksheet.getCell(`J${rowIndex}`).value = employee.bonusAmount;
    // worksheet.getCell(`K${rowIndex}`).value =
    //   employee.employeeId.hourlyRate *
    //     employee.employeeId.dailyHours *
    //     (employee.workdays.daysNormal.length +
    //       employee.workdays.daysDelegation.length) +
    //   employee.workdays.daysDelegation.length *
    //     presentCampaign.delegationAmount +
    //   (employee.employeeId.isDriver
    //     ? employee.employeeId.driverAmount *
    //       (employee.workdays.daysNormal.length +
    //         employee.workdays.daysDelegation.length)
    //     : 0) +
    //   employee.bonusAmount;
  });

  const employeeSumCells = [];
  presentCampaign.employeesData.forEach((employee, index) => {
    const rowIndex = index + 2;
    employeeSumCells.push([worksheet.getCell(`K${rowIndex}`)]);
  });

  employeeSumCells.forEach((cell, index) => {
    let formula_string = `G${index + 2}+H${index + 2}+I${index + 2}+J${
      index + 2
    }+`;
    // for (let i = 0; i <= presentCampaign.employeesData.length - 1; i++) {
    //   formula_string += `G${index + 2}+H${index + 2}+I${index + 2}+J${
    //     index + 2
    //   }+`;
    // }
    formula_string = formula_string.slice(0, -1);
    cell[0].value = { formula: formula_string };
    cell[0].font = { bold: true };
  });

  const sumCells = [
    worksheet.getCell(`F${presentCampaign.employeesData.length + 2}`),
    worksheet.getCell(`G${presentCampaign.employeesData.length + 2}`),
    worksheet.getCell(`H${presentCampaign.employeesData.length + 2}`),
    worksheet.getCell(`I${presentCampaign.employeesData.length + 2}`),
    worksheet.getCell(`J${presentCampaign.employeesData.length + 2}`),
    worksheet.getCell(`K${presentCampaign.employeesData.length + 2}`),
  ];

  sumCells.forEach((cell, index) => {
    cell.font = { bold: true };
    if (!index) {
      cell.value = "Razem";
      return;
    }
    let formula_string = "";

    for (let i = 2; i <= presentCampaign.employeesData.length + 1; i++) {
      formula_string += `${String.fromCharCode(index + 70)}${i}+`;
    }
    formula_string = formula_string.slice(0, -1);
    cell.value = { formula: formula_string };
  });

  // sumCells.forEach((cell, index) => {
  //   switch (index) {
  //     case 0:
  //       cell.value = "Razem";
  //       break;

  //     case 1:
  //       let pureSalary = 0;
  //       presentCampaign.employeesData.forEach((employee) => {
  //         pureSalary +=
  //           employee.employeeId.hourlyRate *
  //           employee.employeeId.dailyHours *
  //           (employee.workdays.daysNormal.length +
  //             employee.workdays.daysDelegation.length);
  //       });
  //       cell.value = pureSalary;
  //       break;

  //     case 2:
  //       let pureDelegation = 0;
  //       presentCampaign.employeesData.forEach((employee) => {
  //         pureDelegation +=
  //           presentCampaign.delegationAmount *
  //           employee.workdays.daysDelegation.length;
  //       });
  //       cell.value = pureDelegation;
  //       break;

  //     case 3:
  //       let pureDriver = 0;
  //       presentCampaign.employeesData.forEach((employee) => {
  //         pureDriver += employee.employeeId.isDriver
  //           ? employee.employeeId.driverAmount *
  //             (employee.workdays.daysNormal.length +
  //               employee.workdays.daysDelegation.length)
  //           : 0;
  //       });
  //       cell.value = pureDriver;
  //       break;

  //     case 4:
  //       let pureBonus = 0;
  //       presentCampaign.employeesData.forEach((employee) => {
  //         pureBonus += employee.bonusAmount;
  //       });
  //       cell.value = pureBonus;
  //       break;

  //     case 5:
  //       // cell.value = allExpenses;
  //       let formula_string = "";
  //       for (let i = 2; i <= presentCampaign.employeesData.length + 1; i++) {
  //         formula_string += `K${i}+`;
  //       }
  //       formula_string = formula_string.slice(0, -1);
  //       cell.value = { formula: formula_string };
  //       break;
  //   }
  //   cell.font = { bold: true };
  // });

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  workbook.calcProperties.fullCalcOnLoad = true;

  try {
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
      console.log(req.user);
    });

    fileStream.on("error", (err) => {
      throw new Error(err);
    });

    3;
  } catch (error) {
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
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
};
