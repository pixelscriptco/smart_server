module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable('tower_plans', {
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
        order:{
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'To show correct order when click on next'
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
      await queryInterface.addIndex('tower_plans', ['tower_id']);
      await queryInterface.addIndex('tower_plans', ['order']);
    },
  
    down: async (queryInterface, Sequelize) => {
      await queryInterface.dropTable('tower_plans');
    }
  }; 