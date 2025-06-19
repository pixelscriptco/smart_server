 'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('towers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      building_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'buildings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      floor_count: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('towers', ['building_id']);
    await queryInterface.addIndex('towers', ['name']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('towers');
  }
};