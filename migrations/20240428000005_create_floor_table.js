'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('floors', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tower_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'towers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      floor_plan_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'floor_plans',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
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
    await queryInterface.addIndex('floors', ['tower_id']);
    await queryInterface.addIndex('floors', ['name']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('floors');
  }
};