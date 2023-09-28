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
  employeesData: [
    {
      employeeId: {
        type: Schema.Types.ObjectId,
        ref: "Employee",
      },
      workdays: [
        {
          type: String,
        },
      ],
    },
  ],
});

campaignSchema.methods.addCampaign = async function (ownerId) {
  const foundEmployees = await Employee.find().where("bossId").equals(ownerId);
  const employees = [];
  foundEmployees.forEach((employee) => {
    employees.push({ employeeId: employee._id, workdays: [] });
  });
  this.employeesData = employees;
  console.log(this.employeesData);
  return this.save();
};

const Campaign = mongoose.model("Campaign", campaignSchema);
export { Campaign };
