'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProjectUpdate extends Model {
    static associate(models) {
        ProjectUpdate.hasOne(models.Project, {
        foreignKey: 'id',
        as: 'project'
      });
    }
  }

  ProjectUpdate.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'project',
        key: 'id'
      }
    },
    name: {
        type: String,
        required: true
    },
    image_url: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['planned', 'in-progress', 'completed'],
        default: 'in-progress'
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
    modelName: 'ProjectUpdate',
    tableName: 'project_updates',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['status']
      }
    ]
  });

  return ProjectUpdate;
}; 