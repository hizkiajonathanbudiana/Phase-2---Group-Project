const express = require("express");
const router = express.Router();

const statusController = require("../controllers/statusController");
const userController = require("../controllers/userController");
const aiController = require("../controllers/aiController.js");
const {
  protectorLogin,
  protectorVerify,
} = require("../middlewares/middlewares");

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

const isProd = process.env.NODE_ENV === "production";

router.post("/logout", (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "None" : "Lax",
    path: "/",
    domain: isProd ? ".hizkiajonathanbudiana.my.id" : undefined,
  });
  res.status(200).json({ message: "Logout successful" });
});

router.post("/verify", userController.verifyCodeHandler);

router.post("/verify/send", userController.sendVerificationEmail);

router.use(protectorVerify);

router.get("/status", statusController.getStatus);

module.exports = router;
