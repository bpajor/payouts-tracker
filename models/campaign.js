import mongoose from "mongoose";
import { Employee } from "./employee.js";

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
  console.log(this.employeesData);
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
    this.employeesData.push({ employeeId: employee._id, workdays: [] });
  });
  return await this.save();
};

const Campaign = mongoose.model("Campaign", campaignSchema);
export { Campaign };
