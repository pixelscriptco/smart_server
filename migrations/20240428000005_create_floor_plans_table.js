module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable('floor_plans', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
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
        unit_count: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Count of units in floor'
        },
        svg_url: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'URL for selction view'
        },
        image_url: {
          type: Sequelize.TEXT,
          allowNull: false,
          comment: 'Plan details'
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
      await queryInterface.addIndex('floor_plans', ['project_id']);
      await queryInterface.addIndex('floor_plans', ['name']);
    },
  
    down: async (queryInterface, Sequelize) => {
      await queryInterface.dropTable('floor_plans');
    }
  }; 