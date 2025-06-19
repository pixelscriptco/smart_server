'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UnitStatus extends Model {
    static associate(models) {
      // Define associations here
      UnitStatus.hasMany(models.Unit, {
        foreignKey: 'status',
        as: 'units_with_status' // Optional change to avoid future confusion
      });
    }
  }

  UnitStatus.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Name of the status'
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Description of the status'
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'URL-friendly version of the name'
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Color code for the status'
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether the status is active'
    }
  }, {
    sequelize,
    modelName: 'UnitStatus',
    tableName: 'unit_status',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['slug']
      },
      {
        fields: ['active']
      }
    ]
  });

  return UnitStatus;
}; 