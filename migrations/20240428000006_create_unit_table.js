'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('units', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      floor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'floors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      unit_plan_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'unit_plans',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status:{
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'unit_status',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
    await queryInterface.addIndex('units', ['floor_id']);
    await queryInterface.addIndex('units', ['name']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('units');
  }
};