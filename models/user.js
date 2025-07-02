"use strict";
const { Model } = require("sequelize");
const { hashPassword } = require("../helpers/bcrypt");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasOne(models.Status, {
        foreignKey: "UserId",
      });
    }
  }
  User.init(
    {
      username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Username cannot be empty" },
          notNull: { msg: "Username is required" },
        },
      },
      email: {
        type: DataTypes.STRING,
        unique: { msg: "Email must be unique" },
        allowNull: false,
        validate: {
          isEmail: { msg: "Invalid email format" },
          notEmpty: { msg: "Email cannot be empty" },
          notNull: { msg: "Email is required" },
        },
      },
      password: { type: DataTypes.STRING, allowNull: true },
      googleSub: { type: DataTypes.STRING, allowNull: true },
      provider: { type: DataTypes.STRING, allowNull: true },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "user",
      },
    },
    {
      sequelize,
      modelName: "User",
      hooks: {
        beforeCreate: async (user, options) => {
          if (!user.password) {
            user.password = null; // Ensure password is null if not provided
          } else {
            // Hash the password if provided
            user.password = await hashPassword(user.password);
            user.username = user.username.toLowerCase(); // Normalize username to lowercase
          }
        },
        beforeUpdate: async (user, options) => {
          if (user.changed("password")) {
            // Hash the password if it has been changed
            user.password = await hashPassword(user.password);
          }
        },
      },
    }
  );
  return User;
};
