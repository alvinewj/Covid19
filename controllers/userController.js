require("dotenv").config();
const axios = require("axios");
const sequelize = require("../models/index");
const jwt = require("jsonwebtoken");
const SHA256 = require("crypto-js/sha256");
const uuid = require("uuid");
const Users = require("../models/user");
const UserModel = Users(sequelize.sequelize, sequelize.Sequelize.DataTypes);
//const _ = require("lodash");

const controllers = {
  register: (req, res) => {
    UserModel.findOne({
      where: {
        email: req.body.email,
      },
    })
      .then((result) => {
        if (result) {
          console.log(result);
          res.statusCode = 400;
          res.json({
            success: false,
            message: "Username already exists",
          });
          res.send;
        }
      })
      .then((response) => {
        const salt = uuid.v4();
        const combination = salt + req.body.password;
        const hash = SHA256(combination).toString();

        UserModel.create({
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          email: req.body.email,
          cellphone: req.body.cellphone,
          //slug: _.kebabCase(req.body.first_name + req.body.user_id),
          address: req.body.default_address,
          password: hash,
          pwsalt: salt,
        })
          .then((createResult) => {
            res.json({
              success: true,
              message: "New User is Registered",
            });
          })
          .catch((err) => {
            console.log(err);
            res.statusCode = 500;
            res.json({
              success: false,
              message: "unable to register due to unexpected error",
            });
          });
      })
      .catch((err) => {
        console.log(err);
        res.statusCode = 500;
        res.json({
          success: false,
          message: "unable to register due to unexpected error",
        });
      })
      .catch((err) => {
        console.log(err);
        res.statusCode = 500;
        res.json({
          success: false,
          message: "unable to register due to unexpected error",
        });
      });
  },

  login: (req, res) => {
    UserModel.findOne({
      where: {
        email: req.body.email,
      },
    })
      .then((result) => {
        console.log(result.pwsalt);
        // check if result is empty, if it is, no user, so login fail, return err as json response
        if (!result) {
          res.statusCode = 401;
          res.json({
            success: false,
            message: "Either username or password is wrong",
          });
          return;
        }

        // combine DB user salt with given password, and apply hash algo
        const hash = SHA256(result.pwsalt + req.body.password).toString();

        // check if password is correct by comparing hashes
        if (hash !== result.password) {
          res.statusCode = 401;
          res.json({
            success: false,
            message: "Either username or password is wrong",
          });
          return;
        }

        // login successful, generate JWT
        const token = jwt.sign(
          {
            email: result.email,
          },
          process.env.JWT_SECRET,
          {
            algorithm: "HS384",
            expiresIn: "1h",
          }
        );

        // decode JWT to get raw values
        const rawJWT = jwt.decode(token);

        // return token as json response
        res.json({
          success: true,
          token: token,
          expiresAt: rawJWT.exp,
          info: rawJWT,
        });
      })
      .catch((err) => {
        res.statusCode = 500;
        res.json({
          success: false,
          message: "unable to login due to unexpected error",
        });
      });
  },

  getUserProfile: (req, res) => {
    const authToken = req.headers.auth_token;
    const rawJWT = jwt.decode(authToken);
    const email = rawJWT.email;
    let user_id_local;

    return UserModel.findOne({
      where: { email: email },
    }).then((emailresponse) => {
      if (!emailresponse) {
        res.status(400).json({ message: "no such user in database" });
        res.send;
      } else {
        res.status(400).json({ message: "logged in" });
        user_id_local = emailresponse.id;
        console.log("i am inside the user profile");
      }
    });
  },
};

module.exports = controllers;
