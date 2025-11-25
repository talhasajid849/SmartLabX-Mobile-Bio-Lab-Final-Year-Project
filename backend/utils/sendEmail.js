const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
require('dotenv').config();


const sendMail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMPT_HOST,
      port: parseInt(process.env.SMPT_PORT || '587'),
      service: process.env.SMPT_SERVICE,
      auth: {
        user: process.env.SMPT_MAIL,
        pass: process.env.SMPT_PASSWORD,
      },
    });

    const { email, subject, template, data } = options;

    // Get the path to the email template
    const templatePath = path.join(__dirname, '../mails', template);

    // Render the EJS template with data
    const html = await ejs.renderFile(templatePath, data);

    const mailOptions = {
      from: process.env.SMPT_MAIL,
      to: email,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = sendMail;
