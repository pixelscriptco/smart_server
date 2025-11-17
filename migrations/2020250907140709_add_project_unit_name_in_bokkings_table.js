'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('bookings', 'project_name', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Path to animated walkthrough video file'
    });

    await queryInterface.addColumn('bookings', 'unit_name', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Description of the home location, neighborhood, amenities, and surroundings'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('bookings', 'project_name');
    await queryInterface.removeColumn('bookings', 'unit_name');
  }
};
