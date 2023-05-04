const jwt = require("jsonwebtoken");
const pool = require("../db");

const getUserID = (req) => {
  try {
    const token = req.headers.authorization;
    const decodedToken = jwt.decode(token);
    const tableExports = [decodedToken.user.user_id];
    return tableExports;
  } catch (error) {
    throw new Error(error.message);
  }
};

//restricts non-operators from filling in biodata
const getUsersData = async (req, role, res) => {
  try {
    const user_id = getUserID(req);
    const conn = await pool.connect();
    const sql = "SELECT * FROM users WHERE role = 'operator' AND user_id = $1";
    const result = await conn.query(sql, user_id);
    const rows = result.rows;
    conn.release();
    if (!rows.length) {
      throw new Error("Only operators may fill this form");
    }
    return rows;
  } catch (error) {
    if (res) {
      return res.status(401).send({ error: error.message });
    } else {
      throw new Error(error.message);
    }
  }
};

//checks datatype
const checkphonenumberDataType = (phonenumber) => {
  if (!/^\d+$/.test(phonenumber)) {
    throw new Error("phonenumber field only accepts numbers");
  }
};

const checkNINDataType = (nin) => {
  if (!/^\d+$/.test(nin)) {
    throw new Error("nin field only accepts numbers");
  }
};

//checks figure length
const checkphonenumberLength = (phonenumber) => {
  if (!/^\d{11}$/.test(phonenumber)) {
    throw new Error("phonenumber cannot exceed eleven figures");
  }
};

const checkNINLength = (nin) => {
  if (!/^\d{11}$/.test(nin)) {
    throw new Error("nin cannot exceed eleven figures");
  }
};

//checks sex of operator
const checkSex = (sex) => {
  if (sex !== "male" && sex !== "female") {
    throw new Error("sex can only be male or female");
  }
};

//checks nationality
const checkNationality = (nationality) => {
  if (nationality !== "Nigerian") {
    throw new Error("service only available for nigerians");
  }
};

//validates lga and state
const checkState = async (state, res) => {
  try {
    const conn = await pool.connect();
    const sql = "SELECT * FROM state WHERE state = $1";
    const result = await conn.query(sql, [state]);
    const state_data = result.rows[0];
    conn.release();
    if (!state_data) {
      throw new Error("Only Nigerian states allowed");
    }
    return state_data;
  } catch (error) {
    if (res) {
      return res.status(401).send({ error: error.message });
    } else {
      throw new Error(error.message);
    }
  }
};

const checkLGA = async (lga, state_id, res) => {
  try {
    const conn = await pool.connect();
    const sql = "SELECT * FROM lga WHERE lga = $1 AND state_id = $2";
    const values = [lga, state_id];
    const result = await conn.query(sql, values);
    const lga_data = result.rows;
    conn.release();
    if (!lga_data || !lga_data.length) {
      throw new Error("This LGA does not belong to the state");
    }
    return lga_data;
  } catch (error) {
    if (res) {
      return res.status(401).send({ error: error.message });
    } else {
      throw new Error(error.message);
    }
  }
};

//checks image
const checkImage = async (originalname, operator_id, res) => {
  try {
    const conn = await pool.connect();
    const sql =
      "SELECT * FROM operators WHERE operator_id = $1 AND image_name IS NOT NULL";
    const values = [operator_id];
    const result = await conn.query(sql, values);
    const image = result.rows[0];
    conn.release();
    if (!image) {
      throw new Error("Operator is not verified");
    }
    const conn1 = await pool.connect();
    const sql1 =
      "UPDATE operators SET isverified = true WHERE operator_id = $1 AND image_name IS NOT NULL";
    const values1 = [operator_id];
    const result1 = await conn1.query(sql1, values1);
    conn1.release();
    if (result1.rowCount === 0) {
      throw new Error("Failed to update operator verification status");
    }
    return image;
  } catch (error) {
    if (res) {
      return res.status(401).send({ error: error.message });
    } else {
      throw error;
    }
  }
};

//checks if operator is verified
const verifyOperator = async (id, res) => {
  try {
    const conn = await pool.connect();
    const sql = "SELECT * FROM operators WHERE id = $1 AND isverified = true";
    const values = [id];
    const result = await conn.query(sql, values);
    const rows = result.rows;
    conn.release();
    if (!rows) {
      throw new Error("You are not a verified operator");
    }
    return rows;
  } catch (error) {
    if (res) {
      return res.status(401).send({ error: error.message });
    } else {
      throw new Error(error.message);
    }
  }
};

const getOperatorID = (req) => {
  try {
    const token = req.headers.authorization;
    const decodedToken = jwt.decode(token);
    const tableExports = [decodedToken.id];
    return tableExports;
  } catch (error) {
    throw new Error(error.message);
  }
};

//checks product
const product = async (product_name, res) => {
  try {
    const conn = await pool.connect();
    const sql = "SELECT * FROM products WHERE product_name = $1";
    const result = await conn.query(sql, [product_name]);
    const rows = result.rows[0];
    conn.release();
    if (!rows) {
      throw new Error("invalid product");
    }
    return rows;
  } catch (error) {
    if (res) {
      return res.status(401).send({ error: error.message });
    } else {
      throw new Error(error.message);
    }
  }
};

const seed = async (seed_name, product_id, res) => {
  try {
    console.log("seed_name: ", seed_name);
    console.log("product_id: ", product_id);

    const conn = await pool.connect();
    const sql = "SELECT * FROM seeds WHERE seed_name = $1 AND product_id = $2";
    const values = [seed_name, product_id];
    const result = await conn.query(sql, values);
    const rows = result.rows[0];
    conn.release();

    console.log("seed query result: ", rows);

    if (!rows) {
      throw new Error("this seed does not belong to your product");
    }
    return rows;
  } catch (error) {
    if (res) {
      return res.status(401).send({ error: error.message });
    } else {
      throw new Error(error.message);
    }
  }
};

module.exports = {
  getUserID,
  getUsersData,
  checkphonenumberDataType,
  checkNINDataType,
  checkphonenumberLength,
  checkNINLength,
  checkSex,
  checkState,
  checkLGA,
  verifyOperator,
  checkImage,
  getOperatorID,
  checkNationality,
  product,
  seed,
};
