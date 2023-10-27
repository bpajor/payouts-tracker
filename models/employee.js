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
  isDriver: {
    type: Boolean,
    required: true,
  },
  driverAmount: {
    type: Number,
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
  randomId: {
    type: String,
    required: true,
  }
});

// employeeSchema.methods.addRandomId = function () {
// }

const Employee = mongoose.model("Employee", employeeSchema);
export { Employee };
