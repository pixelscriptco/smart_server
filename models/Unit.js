'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Unit extends Model {
    static associate(models) {
      Unit.belongsTo(models.UnitStatus, {
        foreignKey: 'status',
        as: 'unit_status' 
      });
      Unit.belongsTo(models.Floor, {
        foreignKey: 'floor_id',
        as: 'floor'
      });
      Unit.belongsTo(models.UnitPlan, {
        foreignKey: 'unit_plan_id',
        as: 'unit_plans'
      });
    }
  }

  Unit.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Name or number of the unit'
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Slug of the unit'
    },
    floor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the floor this unit belongs to'
    },
    unit_plan_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Reference to the plan this unit belongs to'
    },
    cost: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Cost of the unit'
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Current status of the unit'
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
    modelName: 'Unit',
    tableName: 'units',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['floor_id']
      },
      {
        fields: ['status']
      }
    ]
  });

  return Unit;
}; 