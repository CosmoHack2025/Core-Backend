require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.PROJECT_EMAIL,
    pass: process.env.PROJECT_PASSWORD,
  },
});
module.exports = { transporter };