const projectUpdateRoutes = require('./routes/projectUpdateRoutes');

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

app.use('/api', projectUpdateRoutes); 