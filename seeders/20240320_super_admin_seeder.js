'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('users', [
      {
        name: 'Super Admin',
        email: 'superadmin@gmail.com',
        type: 'admin',
        mobile: '01234567890',
        password: '123456',
        company: 'Super Admin',
        role: 'super_admin',
        active: true
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  }
}; 