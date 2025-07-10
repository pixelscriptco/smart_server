'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('projects', 'registration_number', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Registration Number of Project'
    });

    await queryInterface.addColumn('projects', 'qr_code', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'QR code of Project'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('projects', 'registration_number');
    await queryInterface.removeColumn('projects', 'qr_code');

  }
};
