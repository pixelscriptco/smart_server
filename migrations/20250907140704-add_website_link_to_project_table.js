'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('projects','website_link',{
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'website link of project'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('projects','website_link');
  }
};
