'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('amenities', {
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
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      image:{
        type: Sequelize.STRING,
        allowNull: false
      },
      vr_url:{
        type: Sequelize.STRING,
        allowNull: false
      },
      active:{
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '1 for active, 0 for inactive'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('amenities', ['name']);
    await queryInterface.addIndex('amenities', ['tower_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('amenities');
  }
};