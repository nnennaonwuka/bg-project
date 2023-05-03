const express = require("express");
const router = express.Router();

const { createUser, loginUser } = require("../controllers/userController");

router.route("/api/users/create").post(createUser);

router.route("/api/users/login").post(loginUser);

module.exports = router;
