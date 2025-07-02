"use strict";

const { hashPassword } = require("../helpers/bcrypt");
const data = [
  {
    username: "admin",
    email: "hizkia.jonathanb@gmail.com",
    password: "admin123",
    isVerified: true,
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    username: "admin2",
    email: "rizkiramadhan32432@gmail.com",
    password: "admin123",
    isVerified: true,
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    for (const user of data) {
      user.password = await hashPassword(user.password);
      user.createdAt = new Date();
      user.updatedAt = new Date();
    }

    await queryInterface.bulkInsert("Users", data);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete("Users", null, {});
  },
};
