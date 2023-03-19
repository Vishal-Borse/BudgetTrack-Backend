const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Authenticate = require("./Middlewares/authUser");
const saltRounds = 10;
const User = require("./Models/userSchema");
const Transaction = require("./Models/transactionsSchema");
const PayRequest = require("./Models/payRequestsSchema");
const { findByIdAndUpdate } = require("./Models/userSchema");
const Port = process.env.PORT || 8081;
const app = express();
app.use(cookieParser());
mongoose.set("strictQuery", true);
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use(express.json());
dotenv.config();

mongoose.connect(process.env.URL);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

//post request for registration
app.post("/signup", async (req, res) => {
  const { userFirstName, userLastName, userEmail, userPassword } = req.body;
  try {
    if (!userFirstName || !userLastName || !userEmail || !userPassword) {
      return res.status(422).json({
        message: "Fill all fields",
      });
    }
    const existingUser = await User.findOne({
      email: userEmail,
    });
    if (existingUser) {
      return res.status(400).json({
        message: "User already Exist!",
      });
    }

    const hashedPassword = await bcrypt.hash(userPassword, saltRounds);

    const user = new User({
      firstName: userFirstName,
      lastName: userLastName,
      email: userEmail,
      password: hashedPassword,
      budget: 0,
      expenses: 0,
    });

    await User.create(user);
    res.status(201).json({
      message: "User created",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// post API request for login
app.post("/signin", async (req, res) => {
  const { userEmail, userPassword } = req.body;

  console.log(req.body);

  let token;
  try {
    if (!userEmail || !userPassword) {
      return res.status(422).json({
        message: "Fill all fields",
      });
    }
    const existingUser = await User.findOne({ email: userEmail });

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const matchPassword = await bcrypt.compare(
      userPassword,
      existingUser.password
    );

    if (!matchPassword) {
      return res.status(400).json({
        message: "Invalid Credinals",
      });
    }

    token = jwt.sign({ userId: existingUser._id }, process.env.SECRETKEY1);

    res.cookie("jwtoken", token, {
      expires: new Date(Date.now() + 25892000000),
      httpOnly: true,

      sameSite: process.env["NODE_ENV"] === "production" ? "none" : "lax", // must be 'none' to enable cross-site delivery
      secure: process.env["NODE_ENV"] === "production", // must be true if sameSite='none',
    });

    res.status(201).json({
      message: "User Logged in successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "something went wrong",
    });
  }
});

//post API for adding amount into account
app.post("/dashboard/addamount", Authenticate, async (req, res) => {
  const { amount } = req.body;
  try {
    const user = await User.findOne({ _id: req.userid });

    const newBudget = user.budget + Number(amount);

    const result = await User.updateOne(
      { _id: req.userid },
      { budget: Math.round(newBudget) },
      { new: true }
    );

    res.status(201).json({
      message: "Amont added successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
});

//POST API for adding new friend to friendList
app.post("/dashboard/addfriend", Authenticate, async (req, res) => {
  const { friendEmail } = req.body;

  try {
    const isUser = await User.findOne({ email: friendEmail });
    if (isUser) {
      if (req.useremail != friendEmail) {
        const result = await User.findByIdAndUpdate(
          { _id: req.userid },
          { $push: { friends: friendEmail } }
        );
        res.status(201).json({
          message: "New Friend added successfully",
        });
      } else {
        res.status(400).json({
          message: "Sorry! User can't be a Friend",
        });
      }
    } else {
      res.status(400).json({
        message: "This Person is not our user",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
});

//POST API for creating personal transaction
app.post("/dashboard/personaltransaction", Authenticate, async (req, res) => {
  const { transactionPurpose, transactionAmount, transactionCategory } =
    req.body;

  try {
    if (req.rootUser.budget > 0 && req.rootUser.budget > transactionAmount) {
      const newTransaction = new Transaction({
        userId: req.userid,
        purpose: transactionPurpose,
        userEmail: req.useremail,
        amount: Math.round(Number(transactionAmount)),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        type: "personal",
        category: transactionCategory,
      });

      const result = await Transaction.create(newTransaction);

      const newExpense = req.rootUser.expenses + Number(transactionAmount);
      await User.findByIdAndUpdate(
        { _id: req.userid },
        { expenses: Math.round(newExpense) }
      );

      res.status(201).json({
        message: "Personal Transaction Created successfully",
      });
    } else {
      res.status(500).json({
        message: "You Don't have Sufficent Balance",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
});

app.post("/dashboard/grouptransaction", Authenticate, async (req, res) => {
  const {
    transactionPurpose,
    transactionAmount,
    transactionCategory,
    allMembers,
  } = req.body;

  const splitAmount = Math.round(
    Number(transactionAmount) / (allMembers.length + 1)
  );

  try {
    console.log(splitAmount);
    const newTransaction = new Transaction({
      userId: req.userid,
      purpose: transactionPurpose,
      userEmail: req.useremail,
      amount: splitAmount,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      type: "group",
      category: transactionCategory,
      members: allMembers,
    });

    const result = await Transaction.create(newTransaction);
    const newExpense = Math.round(req.rootUser.expenses + splitAmount);
    await User.findByIdAndUpdate({ _id: req.userid }, { expenses: newExpense });

    console.log(result);

    for (var i = 0; i < allMembers.length; i++) {
      const user = await User.findOne({ email: allMembers[i] });
      const newPayRequest = new PayRequest({
        userId: user._id,
        purpose: transactionPurpose,
        createdBy: req.useremail,
        userEmail: user.email,
        amount: splitAmount,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        type: "group",
        category: transactionCategory,
        totalMembers: allMembers.length + 1,
      });
      await PayRequest.create(newPayRequest);
    }

    res.status(201).json({
      message:
        "Personal Transaction Created successfully and Pay Requests send Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
});

app.post("/dashboard/deletetransaction", Authenticate, async (req, res) => {
  const { transactionId, transactionAmount } = req.body;
  try {
    const result = await Transaction.findByIdAndDelete({ _id: transactionId });

    console.log(result);
    const newExpense = Math.round(
      req.rootUser.expenses - Number(transactionAmount)
    );
    console.log(newExpense);

    await User.findByIdAndUpdate({ _id: req.userid }, { expenses: newExpense });
    res.status(201).json({
      message: "Transaction Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
});

app.post("/dashboard/clearpayrequest", Authenticate, async (req, res) => {
  const { payrequestId } = req.body;
  try {
    const result = await PayRequest.findById({ _id: payrequestId });

    if (req.rootUser.budget > result.amount && req.rootUser.budget > 0) {
      const newTransaction = new Transaction({
        userId: result.userId,
        purpose: result.purpose,
        userEmail: result.userEmail,
        amount: result.amount,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        type: result.type,
        category: result.category,
      });
      console.log("Result amount :" + result.amount);
      const response = await Transaction.create(newTransaction);
      console.log(req.rootUser.expenses);
      const newExpense = Math.round(req.rootUser.expenses + result.amount);
      console.log(newExpense);

      await User.findByIdAndUpdate(
        { _id: req.userid },
        { expenses: newExpense }
      );

      await PayRequest.findByIdAndDelete({ _id: payrequestId });
      res.status(201).json({
        message: "Payrequest cleared successfully",
      });
    } else {
      res.status(500).json({
        message: "You Don't Have Sufficient Balance",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
});

app.get("/dashboard/gettransactions", Authenticate, async (req, res) => {
  const result = await Transaction.find({ userId: req.userid });
  res.send(result);
});

app.get("/dashboard/getpayrequests", Authenticate, async (req, res) => {
  const result = await PayRequest.find({ userId: req.userid });
  res.send(result);
});

app.get("/dashboard/getfriends", Authenticate, async (req, res) => {
  try {
    res.send(req.rootUser.friends);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
});
//GET API for accessing the dashboard
app.get("/dashboard", Authenticate, async (req, res) => {
  res.send(req.rootUser);
});

app.get("/dashboard/logout", async (req, res) => {
  res.clearCookie("jwtoken", {
    path: "/",
    httpOnly: true,

    sameSite: process.env["NODE_ENV"] === "production" ? "none" : "lax", // must be 'none' to enable cross-site delivery
    secure: process.env["NODE_ENV"] === "production",
  }); // must be true if sameSite='none', });

  res.status(200).json({
    message: "user Logged out",
  });
});
app.listen(Port, () => {
  console.log("listening on port 8081");
});
