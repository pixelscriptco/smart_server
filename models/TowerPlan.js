'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TowerPlan extends Model {
    static associate(models) {
      TowerPlan.belongsTo(models.Tower, {
        foreignKey: 'tower_id',
        as: 'tower'
      });
    }
  }

  TowerPlan.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tower_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the tower this plan belongs to'
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
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'To show correct order when click on next'
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
    modelName: 'TowerPlan',
    tableName: 'tower_plans',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['tower_id']
      }
    ]
  });

  return TowerPlan;
}; 