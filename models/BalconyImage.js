'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BalconyImage extends Model {
    static associate(models) {
      BalconyImage.belongsTo(models.UnitPlan, {
        foreignKey: 'unit_plan_id',
        as: 'unit_plan'
      });
    }
  }

  BalconyImage.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    unit_plan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'unit_plans',
        key: 'id'
      }
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    modelName: 'BalconyImage',
    tableName: 'balcony_images',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['unit_plan_id']
      }
    ]
  });

  // BalconyImage.associate = function(models) {
  //   BalconyImage.belongsTo(models.UnitPlan, {
  //     foreignKey: 'unit_plan_id',
  //     as: 'unitPlan'
  //   });
  // };

  return BalconyImage;
}; 