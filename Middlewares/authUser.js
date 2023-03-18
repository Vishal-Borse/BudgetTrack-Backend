const jwt = require("jsonwebtoken");
const User = require(".././Models/userSchema");
// var cookieParser = require("cookie-parser");
// app.use(cookieParser());

const Authenticate = async (req, res, next) => {
  try {

    const token = req.cookies.jwtoken;
    const user = jwt.verify(token, process.env.SECRETKEY1);

    const rootUser = await User.findOne({ _id:user.userId  });

    console.log(rootUser);

    if (!rootUser) {
      res.send("User not found");
    }

    req.rootUser = rootUser;
    req.userid = user.userId;
    req.useremail = rootUser.email;

    next();
  } catch (error) {
    console.log(error);
    res.status(401).send("Unauthorized User");
  }
};

module.exports = Authenticate;
