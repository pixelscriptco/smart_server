'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Amenity extends Model {
    static associate(models) {
      Amenity.belongsTo(models.Tower, {
        foreignKey: 'tower_id',
        as: 'tower'
      });
    }
  }

  Amenity.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Name of the amenity'
    },
    tower_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the tower this amenity belongs to'
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Image of the amenity'
    },
    vr_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'VR URL of the amenity'
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether the amenity is active'
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
    modelName: 'Amenity',
    tableName: 'amenities',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['tower_id']
      }
    ]
  });

  return Amenity;
}; 