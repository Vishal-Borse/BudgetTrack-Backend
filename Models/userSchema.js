const mongoose = require("mongoose");
mongoose.set("strictQuery", true);

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },

    friends: [
      {
        type: String,
      },
    ],
    budget: {
      type: Number,
      required: true,
    },
    expenses: {
      type: Number,
      required: true,
    },
  },
  {
    collection: "userDetails",
  }
);

const model = mongoose.model("User", userSchema);

module.exports = model;
