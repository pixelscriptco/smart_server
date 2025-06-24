'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('users', [
      {
        name: 'Super Admin',
        email: 'superadmin@gmail.com',
        type: 'admin',
        mobile: '01234567890',
        password: bcrypt.hashSync('123456', 10),
        company: 'Super Admin',
        // role: 'super_admin',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  }
}; 