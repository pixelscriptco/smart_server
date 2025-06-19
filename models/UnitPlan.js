'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UnitPlan extends Model {
    static associate(models) {
      UnitPlan.belongsTo(models.Project, {
        foreignKey: 'project_id',
        as: 'project'
      });
    }
  }

  UnitPlan.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Name of the Unit Plan'
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the project this plan belongs to'
    },
    plan: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Plan details'
    },
    vr_url: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'VR URL of the unit'
    },
    area: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Area of the unit'
    },
    type: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Type of the unit'
    },
    cost: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Cost of the unit'
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'To show if the plan is active'
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
    modelName: 'UnitPlan',
    tableName: 'unit_plans',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['project_id']
      }
    ]
  });

  return UnitPlan;
}; 