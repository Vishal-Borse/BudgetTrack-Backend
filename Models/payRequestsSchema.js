const mongoose = require("mongoose");
mongoose.set("strictQuery", true);

const payRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    amount: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    totalMembers: {
      type: String,
      required: true,
    },
  },
  {
    collection: "payRequests",
  }
);

const payRequestModel = mongoose.model("PayRequests", payRequestSchema);

module.exports = payRequestModel;
