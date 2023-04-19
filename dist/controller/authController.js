"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.register = exports.logout = exports.googleAuthHandler = exports.disableUser = exports.default = exports.UserLogin = exports.GetUsers = exports.GetUserById = exports.DeleteUserById = void 0;
var _hashPassword = _interopRequireDefault(require("../utils/hashPassword.js"));
var _index = _interopRequireDefault(require("../database/models/index.js"));
var _bcrypt = _interopRequireDefault(require("bcrypt"));
var _jwt = _interopRequireDefault(require("../utils/jwt.js"));
var _userServices = require("../services/user.services.js");
var _userToken = _interopRequireDefault(require("../utils/userToken.js"));
var _sendEmail = _interopRequireDefault(require("../utils/sendEmail"));
var _jsend = _interopRequireDefault(require("jsend"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const UserLogin = async (req, res) => {
  const {
    email,
    password
  } = req.body;
  try {
    // Check if user with the given email exists
    const user = await _index.default.User.findOne({
      where: {
        email
      }
    });
    if (!user) {
      return res.status(401).json(_jsend.default.fail({
        message: "Invalid Credentials😥"
      }));
    } else if (user.status === "disabled") {
      return res.status(401).json(_jsend.default.fail({
        message: "User is disabled😥"
      }));
    }

    // Compare the given password with the hashed password in the database
    const passwordMatches = await _bcrypt.default.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json(_jsend.default.fail({
        message: "Invalid Credentials😥"
      }));
    }

    // If the email and password are valid, generate a JWT token
    const token = (0, _userToken.default)(user);

    // Set the token in a cookie with HttpOnly and Secure flags
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 3600000 // 1 hour
    });

    res.status(200).json(_jsend.default.success({
      message: "Login Successful",
      token
    }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(_jsend.default.error({
      message: "Opps 😰 server error"
    }));
  }
};

// Function to create a new user with a Google account
exports.UserLogin = UserLogin;
const googleAuthHandler = async (req, res) => {
  const {
    value
  } = req.user.emails[0];
  const {
    familyName
  } = req.user.name;
  const {
    id
  } = req.user;

  // Create a new user object with the Google account data
  const newUser = {
    name: familyName,
    email: value,
    password: "password",
    roleId: 2,
    googleId: id,
    status: "active"
  };

  // Check if user already exists
  const user = await (0, _userServices.getUserByGoogleId)(newUser.googleId);
  if (user) {
    // User already exists, generate JWT and redirect
    const {
      id,
      email,
      name,
      password,
      roleId,
      googleId
    } = user;
    const userToken = _jwt.default.generateToken({
      id: id,
      email: email,
      name: name,
      password: password,
      roleId: roleId,
      status: "active",
      googleId: googleId
    }, "1h");
    res.cookie("jwt", userToken);
    return res.redirect(`/api/callback?key=${userToken}`);
  } else {
    // User does not exist, create new user and generate JWT
    const saltRounds = 10;
    const hashedPassword = await _bcrypt.default.hash(newUser.password, saltRounds);
    newUser.password = hashedPassword;
    const {
      id,
      email,
      name,
      password,
      roleId,
      googleId
    } = await (0, _userServices.registerGoogle)(newUser);
    const userToken = _jwt.default.generateToken({
      id: id,
      email: email,
      name: name,
      password: password,
      roleId: roleId,
      status: "active",
      googleId: googleId
    }, "1h");
    res.cookie("jwt", userToken);
    return res.redirect(`/api/callback?key=${userToken}`);
  }
};
// get the user from the database
exports.googleAuthHandler = googleAuthHandler;
const GetUsers = async (req, res) => {
  try {
    const users = await _index.default.User.findAll();
    return res.status(200).json({
      status: "success",
      data: {
        users
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// get the user from the database by id
exports.GetUsers = GetUsers;
const GetUserById = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const user = await _index.default.User.findOne({
      where: {
        id: id
      }
    });
    if (user) {
      return res.status(200).json({
        user
      });
    }
    return res.status(404).send("User with the specified ID does not exists");
  } catch (error) {
    return res.status(500).send(error.message);
  }
};
//delete the user from the database by id
exports.GetUserById = GetUserById;
const DeleteUserById = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const deleted = await _index.default.User.destroy({
      where: {
        id: id
      }
    });
    if (deleted) {
      return res.status(204).send("User deleted");
    }
    throw new Error("User not found");
  } catch (error) {
    return res.status(500).send(error.message);
  }
};
exports.DeleteUserById = DeleteUserById;
const logout = (req, res) => {
  try {
    res.clearCookie("jwt");
    // Send success response
    res.status(200).json({
      message: "Logout successful"
    });
    res.redirect("/");
  } catch (error) {
    console.error(error);
    // Send error response
    res.status(500).json({
      message: "Internal server error"
    });
  }
};
exports.logout = logout;
const disableUser = async (req, res) => {
  const {
    status,
    reason,
    email
  } = req.body;
  try {
    const user = await _index.default.User.findOne({
      where: {
        email: email
      }
    });
    if (!user) {
      return res.status(404).json({
        message: `user with email : ${email} does not exit `
      });
    } else {
      user.status = status;
      await user.save();
      if (user) {
        const to = user.email;
        const text = `
        Subject: Notification of account deactivation

        Dear User,
        
        We regret to inform you that your account on our website has been ${status} due to a ${reason}. Our team has conducted a thorough investigation and found evidence of unauthorized activity on your account.
        
        As a result, we have taken the necessary steps to protect the security and integrity of our platform by deactivating your account. We take the security of our website and our users very seriously, and we will not tolerate any illegal activities or harmful behavior.
        
        Please note that you will no longer be able to access your account or any associated services. If you have any questions or concerns about this decision, please do not hesitate to contact us at predators@gmail.com.
        
        Thank you for your understanding and cooperation.
        
        Best regards,
        
        The E-commerce ATLP-Predators project team`;
        _sendEmail.default.sendEmail(to, "account status", text);
        return res.status(200).json({
          message: `User account ${status} successfully  `
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};
exports.disableUser = disableUser;
const register = async (req, res) => {
  const {
    name,
    email,
    password
  } = req.body;

  // Validate user input
  if (!name || !email || !password) {
    return res.status(400).send('Invalid input');
  }
  try {
    // hash password
    const hashedPassword = await (0, _hashPassword.default)(password);

    // Create user in the database (using Sequelize ORM)
    const user = await _index.default.User.create({
      name,
      email,
      roleId: 2,
      password: hashedPassword
    });
    res.status(200).json({
      message: user
    }); // /!\use jsend

    // Send confirmation email
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server error');
  }
};
exports.register = register;
var _default = {
  googleAuthHandler,
  GetUsers,
  GetUserById,
  DeleteUserById,
  logout,
  disableUser,
  register,
  UserLogin
};
/* eslint-disable consistent-return */
// imports
exports.default = _default;