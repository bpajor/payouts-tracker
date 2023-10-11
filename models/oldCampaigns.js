import mongoose from "mongoose";

const Schema = mongoose.Schema;

const oldCampaignsSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    allExpenses: {
        type: Number,
        required: true
    },
    endtime: {
        type: Date,
        required: true
    }
})

const OldCampaigns = mongoose.model("OldCampaign", oldCampaignsSchema);
export { OldCampaigns };