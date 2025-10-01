'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('projects', 'location_logo', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'URL or path to location logo image for the project'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('projects', 'location_logo');
  }
};
