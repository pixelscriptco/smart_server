'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('blocked_unit', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      mobile: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      channel: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      unit_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'units',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('blocked', 'booked', 'hold'),
        defaultValue: 'blocked'
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

  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
}; 