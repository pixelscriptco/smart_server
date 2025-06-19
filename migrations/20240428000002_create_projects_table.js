 

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('projects', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id:{
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      logo: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      project_url:{
        type: Sequelize.TEXT,
        allowNull: true
      },
      url:{
        type: Sequelize.TEXT,
        allowNull: false
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
    await queryInterface.addIndex('projects', ['name']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('projects');
  }
};