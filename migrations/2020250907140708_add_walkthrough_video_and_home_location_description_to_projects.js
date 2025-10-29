'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('projects', 'walkthrough_video', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Path to animated walkthrough video file'
    });

    await queryInterface.addColumn('projects', 'home_location_description', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Description of the home location, neighborhood, amenities, and surroundings'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('projects', 'walkthrough_video');
    await queryInterface.removeColumn('projects', 'home_location_description');
  }
};
