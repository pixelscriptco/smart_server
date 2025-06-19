'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('unit_status', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true
      },
      slug:{
        type: Sequelize.STRING,
        allowNull: false
      },
      color:{
        type: Sequelize.STRING,
        allowNull: false
      },
      active:{
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'true for active, false for inactive'
      }
    });

    // Add indexes
    await queryInterface.addIndex('unit_status', ['name']);
    await queryInterface.addIndex('unit_status', ['slug']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('unit_status');
  }
};