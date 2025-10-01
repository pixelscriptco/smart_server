'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    static associate(models) {
      Project.hasMany(models.Building, {
        foreignKey: 'project_id',
        as: 'buildings'
      });
      Project.hasMany(models.Amenity, {
        foreignKey: 'project_id',
        as: 'amenities'
      });
      Project.hasMany(models.ProjectUpdate, {
        foreignKey: 'project_id',
        as: 'project_updates'
      });
      Project.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }

  Project.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Name of the project'
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Project URL or website'
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Path to project logo image'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of the project'
    },
    website_link: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'website link of the project'
    },
    project_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL to project vr video'
    },
    registration_number: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Registration number of the project'
    },
    qr_code: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Path to QR code image or QR code string'
    },
    location: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Geographical location of the project (e.g., address )'
    },
    location_title: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'location title of the project'
    },
    location_description: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Geographical location description of the project'
    },
    location_image: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'location image of the project'
    },
    location_logo: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'location logo of the project'
    },
    latitude: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Geographical latitude of the project'
    },
    longitude: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Geographical longitude of the project'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: '1',
      comment: 'Project status: active or inactive'
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
    modelName: 'Project',
    tableName: 'projects',
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

  return Project;
}; 