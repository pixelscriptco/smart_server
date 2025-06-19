'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FloorPlan extends Model {
    static associate(models) {
      FloorPlan.belongsTo(models.Project, {
        foreignKey: 'project_id',
        as: 'project'
      });
    }
  }

  FloorPlan.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the project this plan belongs to'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Name of the Floor Plan'
    },
    svg_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'URL for selction view'
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Plan details'
    },
    unit_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Count of units'
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
    modelName: 'FloorPlan',
    tableName: 'floor_plans',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['project_id']
      }
    ]
  });

  return FloorPlan;
}; 