module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('balcony_images', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      unit_plan_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'unit_plans',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Reference to the unit plan this balcony image belongs to'
      },
      image_url: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'URL or path to the balcony image (3D or normal)'
      },
      image_type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: "Type of image: '3d' or 'normal'"
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Optional description for the image'
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
    await queryInterface.addIndex('balcony_images', ['unit_plan_id']);
    await queryInterface.addIndex('balcony_images', ['image_type']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('balcony_images');
  }
}; 