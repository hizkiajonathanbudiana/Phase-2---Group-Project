const { Status, User } = require("../models");

class statusController {
  static async getStatus(req, res, next) {
    try {
      const status = await Status.findAll({
        include: [{ model: User }],
        order: [["solved", "DESC"]],
      });

      console.log(status);

      res.status(200).json({ status });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = statusController;
