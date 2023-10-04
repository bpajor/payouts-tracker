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
    required: true
  },
  employeesData: [
    {
      employeeId: {
        type: Schema.Types.ObjectId,
        ref: "Employee",
      },
      workdays:
        {
          daysDelegation: [
            {type: String}
          ],
          daysNormal: [
            {type: String}
          ],
          daysDriver: [
            {type: String}
          ]
        },
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

campaignSchema.methods.updateCampaign = async function(ownerId) {
  const foundEmployees = await Employee.find().where("bossId").equals(ownerId);
  const foundEmployeesIds = [];
  foundEmployees.forEach(employee => foundEmployeesIds.push(employee._id))
  const populatedCampaign = await this.populate('employeesData.employeeId');
  let campaignEmployees = [];
  populatedCampaign.employeesData.forEach(employee => {
    campaignEmployees.push(employee);
  })
  this.employeesData = this.employeesData.filter(employee => )
  console.log(campaignEmployees);
}

const Campaign = mongoose.model("Campaign", campaignSchema);
export { Campaign };
