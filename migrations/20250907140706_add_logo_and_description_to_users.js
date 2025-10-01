'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'logo', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'URL or path to user logo image'
    });

    await queryInterface.addColumn('users', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'User or company description'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'logo');
    await queryInterface.removeColumn('users', 'description');
  }
};