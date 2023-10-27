import mongoose from "mongoose";
import { Employee } from "./employee.js";
import ExcelJS from "exceljs";

const Schema = mongoose.Schema;

const campaignSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  endtime: {
    type: Date,
    required: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  delegationAmount: {
    type: Number,
    required: true,
  },
  employeesData: [
    {
      employeeId: {
        type: Schema.Types.ObjectId,
        ref: "Employee",
      },
      workdays: {
        daysDelegation: [{ type: String }],
        daysNormal: [{ type: String }],
        daysDriver: [{ type: String }],
      },
      bonusAmount: {
        type: Number,
      },
    },
  ],
});

campaignSchema.methods.addCampaign = async function (ownerId) {
  const foundEmployees = await Employee.find().where("bossId").equals(ownerId);
  const employees = [];
  foundEmployees.forEach((employee) => {
    employees.push({ employeeId: employee._id, workdays: [], bonusAmount: 0 });
  });
  this.employeesData = employees;
  return await this.save();
};

campaignSchema.methods.updateCampaign = async function () {
  const foundEmployees = await Employee.find()
    .where("bossId")
    .equals(this.ownerId);
  const foundEmployeesIds = [];
  foundEmployees.forEach((employee) =>
    foundEmployeesIds.push(employee._id.toString())
  );
  this.employeesData = this.employeesData.filter((employee) => {
    return foundEmployeesIds.includes(employee.employeeId._id.toString());
  });
  this.employeesData.forEach((employee) => {
    const employeeToDeleteIndex = foundEmployees.findIndex((foundEmployee) => {
      return (
        foundEmployee._id.toString() === employee.employeeId._id.toString()
      );
    });
    foundEmployees.splice(employeeToDeleteIndex, 1);
  });
  foundEmployees.forEach((employee) => {
    this.employeesData.push({
      employeeId: employee._id,
      workdays: [],
      bonusAmount: 0,
    });
  });
  return await this.save();
};

campaignSchema.methods.calculateEmployeeMonthSalary = function (index) {
  let monthSalary = 0;
  const employee = this.employeesData[index];
  monthSalary =
    employee.bonusAmount +
    employee.employeeId.hourlyRate *
      employee.employeeId.dailyHours *
      (employee.workdays.daysNormal.length +
        employee.workdays.daysDelegation.length) +
    this.delegationAmount * employee.workdays.daysDelegation.length +
    (employee.employeeId.isDriver
      ? employee.employeeId.driverAmount *
        (employee.workdays.daysNormal.length +
          employee.workdays.daysDelegation.length)
      : 0);

  return monthSalary;
};

campaignSchema.methods.calculateAllExpenses = function () {
  let allEmpSalarySum = 0;
  this.employeesData.forEach((employee, index) => {
    const monthSalary = this.calculateEmployeeMonthSalary(index);
    allEmpSalarySum += monthSalary;
  });
  return allEmpSalarySum;
};

campaignSchema.methods.calculateTopEmployees = function () {
  const topEmps = [];
  this.employeesData.forEach((employee, index) => {
    const monthSalary = this.calculateEmployeeMonthSalary(index);
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
  return topEmps;
};

campaignSchema.methods.extractEmployeesData = function () {
  const employees = [];
  this.employeesData.forEach((employee, index) => {
    const employeeToPush = {
      ...employee.employeeId._doc,
      workdays: employee.workdays,
      bonusAmount: employee.bonusAmount,
    };
    employeeToPush.monthSalary = this.calculateEmployeeMonthSalary(index);
    employeeToPush.randomId = 10000000000 * Math.random().toFixed(10);
    employees.push(employeeToPush);
  });
  return employees;
};

campaignSchema.methods.extractEmployeeData = function (employeeId) {
  let employee;
  const employeeIndex = this.employeesData.findIndex((emp) => {
    return emp.employeeId._id.toString() === employeeId.toString();
  });
  employee = { ...this.employeesData[employeeIndex]["_doc"] };
  if (!employee) {
    throw new Error("Employee not found");
  }
  employee.monthSalary = this.calculateEmployeeMonthSalary(employeeIndex);
  return employee;
};

campaignSchema.methods.updateEmployee = function (
  employeeId,
  bonusAmount,
  selectedDelegationDays,
  selectedNormalDays
) {
  const employeeIndex = this.employeesData.findIndex((emp) => {
    return emp.employeeId._id.toString() === employeeId.toString();
  });
  this.employeesData[employeeIndex].workdays.daysDelegation = [
    ...selectedDelegationDays,
  ];
  this.employeesData[employeeIndex].workdays.daysNormal = [
    ...selectedNormalDays,
  ];
  this.employeesData[employeeIndex].bonusAmount = bonusAmount;
};

campaignSchema.methods.createExcelFile = function () {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Pracownicy");
  worksheet.getCell("A1").value = "Lp.";
  worksheet.getCell("B1").value = "Imię";
  worksheet.getCell("C1").value = "Nazwisko";
  worksheet.getCell("D1").value = "Dni (delegacja)";
  worksheet.getCell("E1").value = "Stawka";
  worksheet.getCell("F1").value = "Liczba godzin";
  worksheet.getCell("G1").value = "Kwota";
  worksheet.getCell("H1").value = "Delegacja";
  worksheet.getCell("I1").value = "Kierowca";
  worksheet.getCell("J1").value = "Premia";
  worksheet.getCell("K1").value = "Razem";

  this.employeesData.forEach((employee, index) => {
    const rowIndex = index + 2;
    worksheet.getCell(`A${rowIndex}`).value = rowIndex - 1;
    worksheet.getCell(`B${rowIndex}`).value = employee.employeeId.name;
    worksheet.getCell(`C${rowIndex}`).value = employee.employeeId.surname;
    worksheet.getCell(`D${rowIndex}`).value = `${
      employee.workdays.daysNormal.length +
      employee.workdays.daysDelegation.length
    }(${employee.workdays.daysDelegation.length})`;
    worksheet.getCell(`E${rowIndex}`).value = employee.employeeId.hourlyRate;
    worksheet.getCell(`F${rowIndex}`).value = employee.employeeId.dailyHours;
    worksheet.getCell(`G${rowIndex}`).value =
      employee.employeeId.hourlyRate *
      employee.employeeId.dailyHours *
      (employee.workdays.daysNormal.length +
        employee.workdays.daysDelegation.length);
    worksheet.getCell(`H${rowIndex}`).value =
      employee.workdays.daysDelegation.length * this.delegationAmount;
    worksheet.getCell(`I${rowIndex}`).value = employee.employeeId.isDriver
      ? employee.employeeId.driverAmount *
        (employee.workdays.daysNormal.length +
          employee.workdays.daysDelegation.length)
      : 0;
    worksheet.getCell(`J${rowIndex}`).value = employee.bonusAmount;
  });

  const employeeSumCells = [];
  this.employeesData.forEach((employee, index) => {
    const rowIndex = index + 2;
    employeeSumCells.push([worksheet.getCell(`K${rowIndex}`)]);
  });

  employeeSumCells.forEach((cell, index) => {
    let formula_string = `G${index + 2}+H${index + 2}+I${index + 2}+J${
      index + 2
    }+`;
    formula_string = formula_string.slice(0, -1);
    cell[0].value = { formula: formula_string };
    cell[0].font = { bold: true };
  });

  const sumCells = [
    worksheet.getCell(`F${this.employeesData.length + 2}`),
    worksheet.getCell(`G${this.employeesData.length + 2}`),
    worksheet.getCell(`H${this.employeesData.length + 2}`),
    worksheet.getCell(`I${this.employeesData.length + 2}`),
    worksheet.getCell(`J${this.employeesData.length + 2}`),
    worksheet.getCell(`K${this.employeesData.length + 2}`),
  ];

  sumCells.forEach((cell, index) => {
    cell.font = { bold: true };
    if (!index) {
      cell.value = "Razem";
      return;
    }
    let formula_string = "";

    for (let i = 2; i <= this.employeesData.length + 1; i++) {
      formula_string += `${String.fromCharCode(index + 70)}${i}+`;
    }
    formula_string = formula_string.slice(0, -1);
    cell.value = { formula: formula_string };
  });

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
  return workbook;
};

const Campaign = mongoose.model("Campaign", campaignSchema);
export { Campaign };
