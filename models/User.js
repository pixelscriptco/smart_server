'use strict';
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { Model } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Project, { foreignKey: 'user_id' });
    }
  }

  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^[0-9]{10}$/i  // Validates for 10 digit phone number
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100]  // password length between 6 and 100 characters
      }
    },
    company: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    type:{
      type: DataTypes.ENUM('admin', 'customer'),
      defaultValue: 'customer'
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    email_verification_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    password_reset_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    password_reset_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
        // Generate email verification token
        user.email_verification_token = Math.random().toString(36).substring(2, 15) + 
                                      Math.random().toString(36).substring(2, 15);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    },
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['status']
      }
    ]
  });

  // Instance method to check password
  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

  // Class method to find user by email
  User.findByEmail = async function(email) {
    return await this.findOne({ where: { email } });
  };

  User.prototype.generatePasswordResetToken = async function() {
    this.password_reset_token = Math.random().toString(36).substring(2, 15) + 
                              Math.random().toString(36).substring(2, 15);
    this.password_reset_expires = new Date(Date.now() + 3600000); // 1 hour
    await this.save();
    return this.password_reset_token;
  };

  User.findByPasswordResetToken = async function(token) {
    return await this.findOne({
      where: {
        password_reset_token: token,
        password_reset_expires: {
          [Sequelize.Op.gt]: new Date()
        }
      }
    });
  };

  return User;
}; 