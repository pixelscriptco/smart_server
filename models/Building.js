'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Building extends Model {
    static associate(models) {
        Building.belongsTo(models.Project, {
            foreignKey: 'project_id',
            as: 'project'
        });
        Building.hasMany(models.Tower, {
            foreignKey: 'building_id',
            as: 'towers'
        });
    }
  }

  Building.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Name of the building'
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the project this building belongs to'
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'URL to the building image'
    },
    svg_url: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'URL to the building SVG'
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
    modelName: 'Building',
    tableName: 'buildings',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['project_id']
      },
      {
        fields: ['active']
      }
    ]
  });

  return Building;
}; 