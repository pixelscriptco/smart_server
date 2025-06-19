const { Project, User } = require('../models');

exports.getStats = async (req, res) => {
  try {
    // Get total projects count
    const totalProjects = await Project.count();
    
    // Get active projects count
    const activeProjects = await Project.count({
      where: { status: 1 }
    });

    // Get total customers count
    const totalCustomers = await User.count({
      where: { type: 'customer' }
    });

    // Get active customers count (customers with active projects)
    const activeCustomers = await User.count({
      where: { type: 'customer' },
      include: [{
        model: Project,
        where: { status: 1 },
        required: true
      }]
    });

    res.json({
      success: true,
      data: {
        projects: {
          total: totalProjects,
          active: activeProjects
        },
        customers: {
          total: totalCustomers,
          active: activeCustomers
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      message: 'Error fetching dashboard stats',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 