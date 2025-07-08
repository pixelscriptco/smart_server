module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('tower_plans', 'direction', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Direction of the tower plan (e.g., North, South, etc.)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('tower_plans', 'direction');
  }
}; 