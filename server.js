const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const config = require('./config/config');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/buildings', require('./routes/buildingRoutes'));
app.use('/api/towers', require('./routes/towerRoutes'));
app.use('/api/floors', require('./routes/floorsRoutes'));
app.use('/api/units', require('./routes/unitRoutes'));
app.use('/api/enquiries', require('./routes/enquiryRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/client', require('./routes/clientRoutes'));

app.use('/app', require('./routes/appRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  // console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = config.server.port || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

startServer(); 