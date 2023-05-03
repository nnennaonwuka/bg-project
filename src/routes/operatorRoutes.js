const express = require("express");
const router = express.Router();

const {
  registerOperator,
  loginOperator,
  uploadImage,
  showProfile,
  updateProfile,
  deleteAccount,
  inputProduct,
} = require("../controllers/operatorController");
const {
  validateToken,
  validateOperatorToken,
} = require("../middleware/validateToken");
const multer = require("multer");
const pictures = multer({ dest: "./src/pictures/" });

router
  .route("/api/users/:user_id/operators/register")
  .post(validateToken, registerOperator);

router.route("/api/operators/:operator_id/login").post(loginOperator);

router
  .route("/api/operators/:operator_id/image")
  .put(validateToken, pictures.array("files"), uploadImage);

router
  .route("/api/operators/:operator_id/profile")
  .get(validateOperatorToken, showProfile);

router
  .route("/api/operators/:operator_id/update")
  .put(validateOperatorToken, updateProfile);

router
  .route("/api/operators/:operator_id/delete")
  .delete(validateOperatorToken, deleteAccount);

router
  .route("/api/operators/:operator_id/product")
  .post(validateOperatorToken, inputProduct);

module.exports = router;
