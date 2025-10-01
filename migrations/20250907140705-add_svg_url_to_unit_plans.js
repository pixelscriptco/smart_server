'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('unit_plans', 'svg_url', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'URL for SVG floor plan image'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('unit_plans', 'svg_url');
  }
};
