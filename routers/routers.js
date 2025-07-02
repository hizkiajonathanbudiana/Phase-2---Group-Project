const express = require("express");
const router = express.Router();

const statusController = require("../controllers/statusController");
const userController = require("../controllers/userController");
const aiController = require("../controllers/aiController.js");
const {
  protectorLogin,
  protectorVerify,
} = require("../middlewares/middlewares");

const axios = require("axios");

router.get("/quotes", async (req, res, next) => {
  console.log("masuk ke router quotes");

  try {
    const { data } = await axios.get("http://api.quotable.io/quotes/random");
    const quote = Array.isArray(data) ? data[0] : data;
    res.status(200).json({
      content: quote.content,
      author: quote.author,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", userController.loginHandler);
router.post("/register", userController.registerHandler);
router.post("/google", userController.googleLogin);

router.post("/password/forgot", userController.ForgotPasswordHandler);

router.post("/password/reset", userController.resetPasswordHandler);

console.log("masuk ke router verify");

router.use(protectorLogin);
router.get("/auth/me", (req, res) => {
  res.status(200).json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    isVerified: req.user.isVerified,
    role: req.user.role || "user",
  });
});

router.post("/logout", (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
  });
  res.status(200).json({ message: "Logout successful" });
});

router.post("/verify", userController.verifyCodeHandler);

router.post("/verify/send", userController.sendVerificationEmail);

router.use(protectorVerify);

router.get("/status", statusController.getStatus);

router.post("/ai", aiController.generateChat);

module.exports = router;
