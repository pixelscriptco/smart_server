'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
        Booking.belongsTo(models.Project, {
            foreignKey: 'project_id',
            as: 'project'
        });
        Booking.belongsTo(models.Unit, {
            foreignKey: 'unit_id',
            as: 'unit'
        });
    }
  }

  Booking.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Name of the customer'
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Name of the customer'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Name of the customer'
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Name of the customer'
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the project this building belongs to'
    },
    unit_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Reference to the unit this booking belongs to'
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Booking status'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Booking',
    tableName: 'bookings',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['project_id']
      },
      {
        fields: ['unit_id']
      }
    ]
  });

  return Booking;
}; 