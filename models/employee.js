import mongoose from "mongoose";

const Schema = mongoose.Schema;

const employeeSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  surname: {
    type: String,
    required: true,
  },
  hourlyRate: {
    type: Number,
    required: true,
  },
  isDelegation: {
    type: Boolean,
    required: true,
  },
  dailyHours: {
    type: Number,
    required: true,
  },
  bossId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Employee = mongoose.model("Employee", employeeSchema);
export { Employee };
