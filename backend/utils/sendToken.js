const jwt = require("jsonwebtoken");

const sendToken = (user, statusCode, res) => {
  // Use correct ID for admin
  const userId = user.users_id;

  const token = jwt.sign(
    { id: userId, role: user.role, email: user.email },
    process.env.JWT_TOKEN,
    { expiresIn: "24h" }
  );

  const isProd = process.env.NODE_ENV === "production";
  const options = {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd ? true : false,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

    res
      .status(statusCode)
      .cookie("token", token, options)
      .json({ success: true, user, token });
  }


module.exports = sendToken;
