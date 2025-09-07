'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('projects','location_image',{
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'location image of project'
    });
    await queryInterface.addColumn('projects','location_title',{
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'location title of project'
    });
    await queryInterface.addColumn('projects','location_description',{
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'location description of project'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('projects','location_image');
    await queryInterface.removeColumn('projects', 'location_title');
    await queryInterface.removeColumn('projects', 'location_description');
  }
};
