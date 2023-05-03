const pool = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const {
  getUserID,
  getUsersData,
  checkphonenumberDataType,
  checkNINDataType,
  checkphonenumberLength,
  checkNINLength,
  checkNationality,
  checkSex,
  checkState,
  checkLGA,
  verifyOperator,
  checkImage,
  getOperatorID,
  product,
  seed,
} = require("../services/operatorServices");

dotenv.config();

//@desc REGISTER operator
//@route POST /api/users/:user_id/operators/register
//@access private

const registerOperator = async (req, res) => {
  try {
    const user_id = parseInt(getUserID(req));

    //checks if user is allowed to fill in biodata
    const role = await getUsersData(req);

    //input required fields
    const { nationality, state, lga, sex, date_of_birth, nin, phonenumber } =
      req.body;
    if (
      !(
        phonenumber &&
        nationality &&
        state &&
        lga &&
        sex &&
        date_of_birth &&
        nin
      )
    ) {
      return res.status(400).send(`All fields are mandatory`);
    }

    //checks if phonenumber and nin field contains only integers
    checkphonenumberDataType(phonenumber);
    checkNINDataType(nin);

    //checks phonenumber and nin length
    checkphonenumberLength(phonenumber);
    checkNINLength(nin);

    //checks sex
    checkSex(sex);

    //checks nationality
    checkNationality(nationality);

    //checks state
    const stateValidation = await checkState(state);

    //checks lga
    const state_id = await stateValidation.state_id;
    const lgaValidation = await checkLGA(lga, state_id);

    //ensuring an operator cannot sign up twice
    const conn1 = await pool.connect();
    const sql1 = "SELECT * FROM operators WHERE phonenumber = $1 OR nin = $2";
    const values1 = [phonenumber, nin];
    const result1 = await conn1.query(sql1, values1);
    const registeredOperators = result1.rows;
    conn1.release();
    if (registeredOperators.length > 0) {
      return res.status(409).send(`Operator already exists`);
    }

    //connect to database
    const conn = await pool.connect();
    const sql = `INSERT INTO operators (fullname, password, email, phonenumber, nationality, state, lga, sex, date_of_birth, nin, user_id)
    SELECT fullname, password, email, $1, $2, $3, $4, $5, $6, $7, user_id
    FROM users
    WHERE role = 'operator' AND user_id = $8`;
    const values = [
      phonenumber,
      nationality,
      state,
      lga,
      sex,
      date_of_birth,
      nin,
      user_id,
    ];

    const result = await conn.query(sql, values);
    const rows = result.rows[0];
    conn.release();
    return res.status(201).send({
      rows,
      message: "please upload an image to complete registration",
    });
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

//@desc upload an image
//@route PUT /api/operators/:operator_id/image
//@access private
const multer = require("multer");
const pictures = multer({ dest: "./src/pictures/" });

const uploadImage = async (req, res) => {
  try {
    //ensures user is logged in and an operator
    const user_id = parseInt(getUserID(req));
    const role = await getUsersData(req);

    //unpacks parameters
    const { operator_id } = req.params;

    //connect to database
    const conn = await pool.connect();

    //check if operator exists
    const operatorSQL =
      "SELECT * FROM operators WHERE operator_id = $1 AND user_id = $2;";
    const operatorSQLResult = await conn.query(operatorSQL, [
      operator_id,
      user_id,
    ]);
    if (operatorSQLResult.rows.length === 0) {
      return res
        .status(404)
        .send("please register biodata before uploading image");
    }
    const operators = operatorSQLResult.rows[0];

    //converts the path key in the file object to binary format to be stored in the database
    const fs = require("fs");
    let originalname;

    for (const fileitem of req.files) {
      const originalname = fileitem.originalname;
      const file = fs.readFileSync(fileitem.path);

      //check if a file is uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).send("No file uploaded");
      }

      //check if file has appropriate extension
      const allowedExtensions = [".png", ".jpg", ".jpeg"];
      const extension = originalname
        .substring(originalname.lastIndexOf("."))
        .toLowerCase();
      if (!allowedExtensions.includes(extension)) {
        return res
          .status(415)
          .send("please upload an image with a .png or .jpg extension");
      }

      //uploads file to the database
      const sql =
        'UPDATE operators SET "file" = $1, image_name = $2 WHERE operator_id = $3 RETURNING *;';
      const values = [file, originalname, operator_id];
      const result = await conn.query(sql, values);
      const rows = result.rows[0];
    }

    //verifies operator
    await checkImage(originalname, operator_id);

    conn.release();
    res.json({
      message: "Image uploaded successfully, you are a verified operator",
    });
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

//@desc LOGIN as an operator
//@route POST /api/operators/:operator_id/login
//@access private

const loginOperator = async (req, res) => {
  try {
    const { operator_id } = req.params;
    const { email, password } = req.body;
    if (!(email && password)) {
      res.status(400).send("All fields are mandatory");
    }

    //checks if operator is verified
    verifyOperator(operator_id);

    //logs in operator
    const conn = await pool.connect();
    const sql = `SELECT * FROM operators WHERE email = $1;`;
    const result = await conn.query(sql, [email]);
    const operator = result.rows[0];
    if (!operator.email) {
      return res.status(404).send("email or password invalid");
    }

    //compare with hashed password
    const hashedPassword = operator.password;

    conn.release();
    if (
      !(await bcrypt.compare(
        password + process.env.BCRYPT_PASSWORD,
        hashedPassword
      ))
    ) {
      return res.status(404).send("email or password invalid");
    }
    const payload = {
      id: operator.id,
      operator_id: operator.operator_id,
      email: operator.email,
    };
    const token = jwt.sign(payload, process.env.TOKEN_SECRET, {
      expiresIn: "2h",
    });

    res.status(200).send({ token, message: "You are logged in" });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

//@desc shows profile
//@route GET /api/operators/:operator_id/profile
//@access PRIVATE

const showProfile = async (req, res) => {
  try {
    const id = parseInt(getOperatorID(req));
    console.log(id);

    //checks if operator is verified
    const verifiedOperator = await verifyOperator(id);

    //connect to database
    const conn = await pool.connect();
    const sql = "SELECT * FROM operators WHERE id = $1;";
    const result = await conn.query(sql, [id]);
    const rows = result.rows;
    conn.release();
    res.status(200).send(rows);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

//@desc updates profile
//@route PUT /api/operators/:operator_id/update
//@access PRIVATE
const updateProfile = async (req, res) => {
  try {
    const id = parseInt(getOperatorID(req));

    //checks if operator is verified
    const verifiedOperator = await verifyOperator(id);
    const { phonenumber, email } = req.body;

    if (!phonenumber || !email) {
      return res.send("please specify a field to update");
    }
    //connect to database
    const conn = await pool.connect();
    const sql =
      "UPDATE operators SET email = $1, phonenumber = $2 WHERE id = $3;";
    const values = [email, phonenumber, id];
    const result = await conn.query(sql, values);
    const rows = result.rows[0];
    conn.release();
    return res
      .status(201)
      .send({ rows, message: "your profile has been updated" });
  } catch (error) {
    res.status(500).send({ error });
  }
};

//@desc delete profile
//@route DELETE /api/operators/:operator_id/delete
//@access PRIVATE

const deleteAccount = async (req, res) => {
  try {
    const id = parseInt(getOperatorID(req));

    //checks if operator is verified
    const verifiedOperator = await verifyOperator(id);

    //connect to database
    const conn = await pool.connect();
    const sql = "DELETE FROM operators WHERE id = $1;";
    const result = await conn.query(sql, [id]);
    const rows = result.rows[0];
    conn.release();
    return res
      .status(201)
      .send({ rows, message: "your profile has been deleted" });
  } catch (error) {
    res.status(500).send({ error });
  }
};

//@desc input product
//@route POST /api/operators/:operator_id/product
//@access PRIVATE

const inputProduct = async (req, res) => {
  try {
    const id = parseInt(getOperatorID(req));

    //checks if operator is verified
    const verifiedOperator = await verifyOperator(id);

    const { operator_id, product_name, seed_name } = req.body;
    if (!(operator_id && product_name && seed_name)) {
      return res.status(400).send("All fields are mandatory");
    }

    //checks if product is valid
    const checkProduct = await product(product_name);

    //checks if seed is valid
    const product_id = await checkProduct.product_id;
    const seedValidation = await seed(seed_name, product_id);

    const conn = await pool.connect();
    const sql =
      "INSERT INTO operator_product (operator_id, product_name, seed_name) VALUES ($1, $2, $3) RETURNING *;";
    const values = [operator_id, product_name, seed_name];
    const result = await conn.query(sql, values);
    const rows = result.rows[0];
    conn.release();
    return res.send(rows);
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

module.exports = {
  registerOperator,
  uploadImage,
  loginOperator,
  showProfile,
  updateProfile,
  deleteAccount,
  inputProduct,
};
