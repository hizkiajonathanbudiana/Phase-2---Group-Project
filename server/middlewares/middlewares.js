const { verifyToken } = require("../helpers/jwt");
const { User, Status } = require("../models");

const protectorLogin = async (req, res, next) => {
  try {
    const token =
      req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token provided, please login" });
    }
    const decoded = await verifyToken(token);

    const user = await User.findOne({
      where: {
        id: decoded.id,
      },
      include: [
        {
          model: Status,
        },
      ],
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified,
      solved: user.Status?.solved || 0,
      role: user.role || "user",
    };
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    next(error);
  }
};

const protectorVerify = async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await User.findOne({ where: { id } });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "User not verified" });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protectorLogin,
  protectorVerify,
};
