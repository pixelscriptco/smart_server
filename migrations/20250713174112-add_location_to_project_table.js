'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('projects','location',{
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'location of project'
    });
    await queryInterface.addColumn('projects', 'latitude', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true,
    });
    await queryInterface.addColumn('projects', 'longitude', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('projects','location');
    await queryInterface.removeColumn('projects', 'latitude');
    await queryInterface.removeColumn('projects', 'longitude');
  }
};
