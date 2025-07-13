const db = require('../models');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const userController = {
  // Register a new user
  async register(req, res) {
    try {
      const { name, email, mobile, password, company } = req.body;

      // Check if user already exists
      const existingUser = await db.User.findOne({
        where: {
          [db.Sequelize.Op.or]: [
            { email },
            { mobile }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          message: 'User with this email or mobile already exists'
        });
      }

      // Create new user
      const user = await db.User.create({
        name,
        email,
        mobile,
        password,
        company,
        status: 'active',
        type: 'customer'
      });

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          company: user.company,
          status: user.status
        }
      });
    } catch (error) {
      res.status(400).json({
        message: 'Error registering user',
        error: error.message
      });
    }
  },

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;
      console.log('Login attempt for email:', email);

      if (!email || !password) {
        return res.status(400).json({
          message: 'Email and password are required'
        });
      }

      // Find user by email
      const user = await db.User.findOne({ where: { email,type: 'admin' } });
      if (!user) {
        console.log('User not found for email:', email);
        return res.status(401).json({
          message: 'Invalid email or password'
        });
      }

      // Check if user is active
      if (user.status !== 'active') {
        console.log('User account not active:', user.status);
        return res.status(401).json({
          message: 'Account is not active'
        });
      }

      // Validate password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        console.log('Invalid password for user:', email);
        return res.status(401).json({
          message: 'Invalid email or password'
        });
      }

      // Update last login
      await user.update({ last_login: new Date() });

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('Login successful for user:', email);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          company: user.company,
          status: user.status
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        message: 'Error during login',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  async loginCustomer(req, res) {
    try {
      const { email, password } = req.body;
      console.log('Login attempt for email:', email);

      if (!email || !password) {
        return res.status(400).json({
          message: 'Email and password are required'
        });
      }

      // Find user by email
      const user = await db.User.findOne({ where: { email, type: 'customer' } });
      if (!user) {
        console.log('User not found for email:', email);
        return res.status(401).json({
          message: 'Invalid email or password'
        });
      }

      // Check if user is active
      if (user.status !== 'active') {
        console.log('User account not active:', user.status);
        return res.status(401).json({
          message: 'Account is not active'
        });
      }

      // Validate password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        console.log('Invalid password for user:', email);
        return res.status(401).json({
          message: 'Invalid email or password'
        });
      }

      // Update last login
      await user.update({ last_login: new Date() });

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('Login successful for user:', email);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          company: user.company,
          status: user.status
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        message: 'Error during login',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get all users (admin only)
  async getAllUsers(req, res) {
    try {
      const users = await db.User.findAll({
        attributes: { exclude: ['password'] }
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({
        message: 'Error fetching users',
        error: error.message
      });
    }
  },

  // Get user by ID
  async getUserById(req, res) {
    try {
      const user = await db.User.findByPk(req.params.id, {
        attributes: { exclude: ['password'] }
      });
      
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({
        message: 'Error fetching user',
        error: error.message
      });
    }
  },

  // Update user
  async updateUser(req, res) {
    try {
      const user = await db.User.findByPk(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }

      // Update user fields
      const { name, email, mobile, company, status, password } = req.body;
      await user.update({
        name: name || user.name,
        email: email || user.email,
        mobile: mobile || user.mobile,
        company: company || user.company,
        status: status || user.status,
        ...(password && { password }) // Only update password if provided
      });

      res.json({
        message: 'User updated successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          company: user.company,
          status: user.status
        }
      });
    } catch (error) {
      res.status(400).json({
        message: 'Error updating user',
        error: error.message
      });
    }
  },

  // Delete user
  async deleteUser(req, res) {
    try {
      const user = await db.User.findByPk(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }

      await user.destroy();
      res.json({
        message: 'User deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error deleting user',
        error: error.message
      });
    }
  },

  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await db.User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }

      // Validate current password
      const isValidPassword = await user.validatePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(401).json({
          message: 'Current password is incorrect'
        });
      }

      // Update password
      await user.update({ password: newPassword });

      res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      res.status(400).json({
        message: 'Error changing password',
        error: error.message
      });
    }
  },

  // Verify email
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;
      const user = await db.User.findOne({
        where: { email_verification_token: token }
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid verification token' });
      }

      user.email_verified = true;
      user.email_verification_token = null;
      await user.save();

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error verifying email', error: error.message });
    }
  },

  // Request password reset
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;
      const user = await db.User.findOne({ where: { email } });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const resetToken = await user.generatePasswordResetToken();

      // Send password reset email
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      await transporter.sendMail({
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <p>You requested a password reset</p>
          <p>Click this <a href="${resetUrl}">link</a> to reset your password</p>
          <p>This link will expire in 1 hour</p>
        `
      });

      res.json({ message: 'Password reset email sent' });
    } catch (error) {
      res.status(500).json({ message: 'Error sending reset email', error: error.message });
    }
  },

  // Reset password
  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;
      const user = await db.User.findOne({
        where: {
          password_reset_token: token,
          password_reset_expires: {
            [db.Sequelize.Op.gt]: new Date()
          }
        }
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      user.password = password;
      user.password_reset_token = null;
      user.password_reset_expires = null;
      await user.save();

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error resetting password', error: error.message });
    }
  },

  // Update last login
  async updateLastLogin(req, res, next) {
    try {
      if (req.user) {
        await req.user.update({ last_login: new Date() });
      }
      next();
    } catch (error) {
      console.error('Error updating last login:', error);
      next();
    }
  },

  // Get current user
  async getCurrentUser(req, res) {
    try {
      if (!req.user) {
        console.error('No user found in request');
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // The user is already attached to the request by the auth middleware
      const user = req.user;      
      // Remove sensitive data
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        company: user.company,
        status: user.status,
        email_verified: user.email_verified,
        last_login: user.last_login,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      res.json(userData);
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ message: 'Error fetching user data' });
    }
  },

  // Get all users (admin only)
  async getClients(req, res) {
    try {
      const users = await db.User.findAll({
        where: { type: 'customer' },
        attributes: { exclude: ['password'] }
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({
        message: 'Error fetching clients',
        error: error.message
      });
    }
  },

  async updateClients(req, res){
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    try {
      const user = await db.User.findByPk(id);

      if (!user) {
        return res.status(404).json({ message: 'user not found' });
      }

      user.status = status;
      await user.save();

      res.status(200).json({
        success: true,
        message: `Status updated to ${status}`,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error update client',
        error: error.message
      });
    }
  },

  // Create a new client (customer)
  async createClient(req, res) {
    try {
      const { name, email, mobile, password, company, status } = req.body;

      // Check if user already exists
      const existingUser = await db.User.findOne({
        where: {
          [db.Sequelize.Op.or]: [
            { email },
            { mobile }
          ]
        }
      });
      if (existingUser) {
        return res.status(400).json({
          message: 'User with this email or mobile already exists'
        });
      }

      // Create new client (type: customer)
      const user = await db.User.create({
        name,
        email,
        mobile,
        password,
        company,
        status: status || 'active',
        type: 'customer'
      });

      res.status(201).json({
        message: 'Client created successfully',
        client: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          company: user.company,
          status: user.status
        }
      });
    } catch (error) {
      res.status(400).json({
        message: 'Error creating client',
        error: error.message
      });
    }
  },

  // Logout user
  async logout(req, res) {
    try {
      // Clear the session
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).json({
            message: 'Error during logout'
          });
        }

        // Clear the JWT token from client
        res.clearCookie('token');
        
        res.json({
          message: 'Logout successful'
        });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        message: 'Error during logout',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = userController; 