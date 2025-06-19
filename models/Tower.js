'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Tower extends Model {
    static associate(models) {
      Tower.belongsTo(models.Building, {
        foreignKey: 'building_id',
        as: 'building'
      });
      Tower.hasMany(models.Amenity, {
        foreignKey: 'tower_id',
        as: 'amenities'
      });
      Tower.hasMany(models.TowerPlan, {
        foreignKey: 'tower_id',
        as: 'tower_plans'
      }); 
      Tower.hasMany(models.Floor, {
        foreignKey: 'tower_id',
        as: 'floors'
      });
    }
  }

  Tower.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Name of the tower'
    },
    building_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the building this tower belongs to'
    }, 
    floor_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Number of floors in the tower'
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
    modelName: 'Tower',
    tableName: 'towers',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['building_id']
      },
      {
        fields: ['name']
      }
    ]
  });

  return Tower;
}; 