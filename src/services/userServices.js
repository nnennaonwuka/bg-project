const pool = require("../db");
const dotenv = require("dotenv");

dotenv.config();

//checks if email already exists in database before sign up confirmation
const duplicateEmail = async (req) => {
  try {
    const email = req.body.email;
    const conn = await pool.connect();
    const sql = `SELECT * FROM users WHERE email = ($1);`;
    const result = await conn.query(sql, [email]);
    const rows = result.rows;
    conn.release();
    if (rows.length) {
      throw new Error(`email already exists`);
    }
  } catch (error) {
    throw error;
  }
};

module.exports = { duplicateEmail };
