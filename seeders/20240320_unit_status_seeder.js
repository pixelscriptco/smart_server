'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('unit_status', [
      {
        name: 'Available',
        description: 'Unit is available for sale or rent',
        slug: 'available',
        color: '#53fa53',
        active: true
      },
      {
        name: 'Booked',
        description: 'Unit has been booked',
        slug: 'booked', 
        color: '#f86262',
        active: true
      },
      {
        name: 'Hold',
        description: 'Unit is currently hold',
        slug: 'hold',
        color: '#1cd2eb',
        active: true
      },
      {
        name: 'Blocked',
        description: 'Unit is reserved but not yet sold/rented',
        slug: 'blocked',
        color: '#faa064',
        active: true
      }
    //   {
    //     name: 'Under Maintenance',
    //     description: 'Unit is currently under maintenance',
    //     slug: 'under-maintenance',
    //     color: '#008000',
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     name: 'Not Available',
    //     description: 'Unit is not available for any reason',
    //     slug: 'not-available',
    //     color: '#008000',
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('unit_status', null, {});
  }
}; 