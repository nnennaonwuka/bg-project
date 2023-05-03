const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userServices = require("../services/userServices");
const dotenv = require("dotenv");

dotenv.config();

//@desc REGISTER user
//@route POST /api/users/create
//@access public

const createUser = async (req, res) => {
  try {
    //input necessary data
    const { fullname, email, password, role } = req.body;
    if (!(fullname && email && password && role)) {
      return res.status(400).send(`All fields are mandatory`);
    }

    //check for email duplicity
    const emailcheck = await userServices.duplicateEmail(req);

    //hash password
    const hashedPassword = await bcrypt.hash(
      req.body.password + process.env.BCRYPT_PASSWORD,
      10
    );

    //connect to database
    const conn = await pool.connect();
    const sql = `INSERT INTO users (fullname, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *;`;
    const values = [fullname, email, hashedPassword, role];
    const result = await conn.query(sql, values);
    const rows = result.rows[0];
    conn.release();
    res.status(201).send(`You are now a user`);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

//@desc LOGIN user
//@route POST api/users/login
//@access public

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send("All fields are mandatory");
    }
    // checks if user is in database
    const conn = await pool.connect();
    const sql = `SELECT * FROM users WHERE email = $1;`;
    const result = await conn.query(sql, [email]);
    const user = result.rows[0];
    if (!email) {
      return res.status(400).send("email or password invalid");
    }
    //compare password with hashed password
    const hashedPassword = user.password;
    conn.release();
    if (
      !(await bcrypt.compare(
        password + process.env.BCRYPT_PASSWORD,
        hashedPassword
      ))
    ) {
      return res.status(401).send("Invalid email or password");
    }
    const token = jwt.sign({ user }, process.env.TOKEN_SECRET, {
      expiresIn: "2h",
    });
    res.status(200).send({ token, message: "You are logged in" });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

module.exports = { createUser, loginUser };
