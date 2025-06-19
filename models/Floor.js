'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Floor extends Model {
    static associate(models) {
      Floor.hasMany(models.Unit, {
        foreignKey: 'floor_id',
        as: 'units'
      });
      Floor.belongsTo(models.FloorPlan, {
        foreignKey: 'floor_plan_id',
        as: 'floor_plan'
      });
      Floor.belongsTo(models.Tower, {
        foreignKey: 'tower_id',
        as: 'tower'
      });
    }
  }

  Floor.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Name or number of the floor'
    },
    tower_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the tower this floor belongs to'
    },
    floor_plan_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Reference to the floor plan this floor belongs to'
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
    modelName: 'Floor',
    tableName: 'floors',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['building_id']
      },
      {
        fields: ['level']
      },
      {
        fields: ['active']
      }
    ]
  });

  return Floor;
}; 