'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('project_updates', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      image_url: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      status: {
        type: Sequelize.ENUM('planned', 'in-progress', 'completed'),
        defaultValue: 'in-progress'
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('project_updates', ['name']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('project_updates');
  }
}; 