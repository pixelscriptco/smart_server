'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('units', 'slug', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Slug of unit'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('units', 'slug');
  }
};
