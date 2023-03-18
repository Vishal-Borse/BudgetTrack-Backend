const mongoose = require("mongoose");
mongoose.set("strictQuery", true);

const transactionsSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
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
    members: [
      {
        type: String,
      },
    ],
  },
  {
    collection: "transactions",
  }
);

const transactionModel = mongoose.model("Transaction", transactionsSchema);

module.exports = transactionModel;
