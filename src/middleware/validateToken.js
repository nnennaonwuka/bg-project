const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const validateToken = (req, res, next) => {
  try {
    const accesstoken = req.headers.authorization;
    if (!accesstoken) {
      return res.status(400).send("Please input a token");
    }
    jwt.verify(accesstoken, process.env.TOKEN_SECRET);
    return next();
  } catch (error) {
    res.status(401).json(`Invalid token- ${error}`);
  }
};

const validateOperatorToken = (req, res, next) => {
  try {
    const accesstoken = req.headers.authorization;
    if (!accesstoken) {
      return res.status(400).send("Please input a token");
    }
    jwt.verify(accesstoken, process.env.TOKEN_SECRET);
    return next();
  } catch (error) {
    res.status(401).json(`Invalid token- ${error}`);
  }
};

module.exports = { validateToken, validateOperatorToken };
