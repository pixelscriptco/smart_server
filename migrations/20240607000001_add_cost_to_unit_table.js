'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('units', 'cost', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Cost of the unit'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('units', 'cost');
  }
}; 