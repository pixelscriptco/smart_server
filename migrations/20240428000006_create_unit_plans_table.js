module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('unit_plans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      project_id:{
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Reference to the project id'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Type of room plan (e.g., 4BHK)'
      },
      area: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: 'Area in square feet'
      },
      cost: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Cost in square feet'
      },
      vr_url: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'URL for virtual reality view'
      },
      plan: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Plan details or URL'
      },
      status: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '1 for active, 0 for inactive'
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
    await queryInterface.addIndex('unit_plans', ['project_id']);
    await queryInterface.addIndex('unit_plans', ['type']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('unit_plans');
  }
}; 