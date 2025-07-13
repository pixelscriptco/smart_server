'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('amenities', 'project_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.removeColumn('amenities', 'tower_id');
    await queryInterface.addIndex('amenities', ['project_id']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn('amenities', 'tower_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'towers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // 2. (Optional) Migrate data back if needed

    // 3. Remove project_id column and its index
    await queryInterface.removeIndex('amenities', ['project_id']);
    await queryInterface.removeColumn('amenities', 'project_id');
  }
};
