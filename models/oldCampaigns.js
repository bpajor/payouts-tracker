import mongoose from "mongoose";

const Schema = mongoose.Schema;

const oldCampaignsSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  allExpenses: {
    type: Number,
    required: true,
  },
  endtime: {
    type: Date,
    required: true,
  },
  employeesData: [
    {
      name: {
        type: String,
        required: true,
      },
      surname: {
        type: String,
        required: true,
      },
      payment: {
        type: Number,
        required: true,
      },
      daysWorked: {
        type: Number,
        required: true,
      },
      randomId: {
        type: Number
      }
    },
  ],
});

const OldCampaigns = mongoose.model("OldCampaigns", oldCampaignsSchema);
export { OldCampaigns };
