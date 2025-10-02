const { Project, Unit,Building,Tower, User,Booking,UnitPlan,Floor,UnitStatus,ProjectUpdate } = require('../models');
const { Op, where } = require('sequelize');
const jwt = require('jsonwebtoken');
const path = require('path');
const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const config = require('../config/config');

// Configure AWS S3 Client
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey
  }
});

// Configure multer for S3 upload
const uploadImages = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: config.aws.bucketName,
    // acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `updates/${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    // Accept images and videos only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|mp4|mov|webm|avi|mkv)$/i)) {
      return cb(new Error('Only image and video files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  }
}).single('file');
// Login user
exports.login = async(req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ where: { email,type: 'customer' } });
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
};

// Get authenticated user details
exports.getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email','mobile', 'company', 'type']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details',
      error: error.message
    });
  }
};

// Update unit price and status (with user verification)
exports.updateProfile = async (req, res) => {
  try {
    const id = req.user.id;
    const { name, company, mobile } = req.body;

    // Validate input
    if (!name && !company) {
      return res.status(400).json({
        success: false,
        message: 'Name or Company must be provided for update'
      });
    }

    // Verify unit belongs to user's project
    const user = await User.findOne({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or unauthorized'
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (company) updateData.company = company;
    if (mobile) updateData.mobile = mobile;

    const [updated] = await User.update(updateData, {
      where: { id }
    });

    // Get updated unit data
    const updatedProfile = await User.findByPk(id);

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedProfile
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// List projects for authenticated user
exports.listProjects = async (req, res) => {
  try {
    const user_id = req.user.id; // Get user_id from authenticated user

    const projects = await Project.findAll({
      where: { user_id },
      include: [{
        model: User,
        attributes: ['company']
      }],
      order: [['created_at', 'DESC']]
    });

    // For each project, get min and max price from Unit model
    const projectsWithPriceRange = await Promise.all(
      projects.map(async (project) => {
        const min_price = await UnitPlan.min('cost', { where: { project_id: project.id } });
        const max_price = await UnitPlan.max('cost', { where: { project_id: project.id } });
        if(min_price && max_price){
          return {
            ...project.toJSON(),
            min_price,
            max_price
          };
        }else{
          return {
            ...project.toJSON()
          };
        }
      })
    );

    res.json({
      success: true,
      data: projectsWithPriceRange
    });
  } catch (error) {
    console.error('Error listing projects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
      error: error.message
    });
  }
};

exports.getProject = async(req, res) => {
  try {
    const user_id = req.user.id;
    const id = req.params.project_id;

    const project = await Project.findOne({
      where: { user_id, id},
      include: [{
        model: User,
        attributes: ['company']
      }],
      include: [{
        model: Building,
        as: 'buildings',
        include: [
          {
            model: Tower,
            as: 'towers'
          }
        ]
      }],
      order: [['created_at', 'DESC']]
    });

    // Merge all towers from all buildings into one array
    const allTowers = project.buildings.flatMap(building => building.towers);

    // Optionally remove buildings from the response
    const projectData = {
      ...project.toJSON(),
      towers: allTowers
    };

    delete projectData.buildings;

    res.json({
      success: true,
      project: projectData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
      error: error.message
    });
  }
};

exports.getAllStates = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get total projects count
    const totalProjects = await Project.count({ where: { user_id}});
    
    // Get active projects count
    const activeProjects = await Project.count({
      where: { user_id,status: 1 }
    });

    const confirmedBooking = await Booking.count({
      where: { status: 'confirmed' },
      include: [
        {
          model: Project,
          as: 'project', // required since you used alias in the association
          where: { user_id },
          attributes: []
        }
      ]
    });

    const pendingBooking= await Booking.count({
      where: { status: 'pending' },
      include: [
        {
          model: Project,
          as: 'project',
          where: { user_id },
          attributes: []
        }
      ]
    });
    

    res.json({
      success: true,
      data: {
        projects: {
          total: totalProjects,
          active: activeProjects
        },
        bookings: {
          confirmed: confirmedBooking,
          pending: pendingBooking
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

// List units for a specific project (with user verification)
exports.listUnits = async (req, res) => {
  try {
    const { project_id } = req.params;
    const user_id = req.user.id;
    const { floor_id,status, search } = req.query;

    // Verify project belongs to user
    const project = await Project.findOne({
      where: { 
        id: project_id,
        user_id 
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or unauthorized'
      });
    }

    let whereClause = { };
    console.log(status);
    
    // Add status filter if provided
    if (status && status != '0') {
      whereClause.status = parseInt(status);
    }
    
    if (floor_id) {
      whereClause.floor_id = floor_id;
    }

    // Add search filter if provided
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const units = await Unit.findAll({
      where: whereClause,
      order: [['id', 'ASC']],
      include: [
        {
          model: UnitPlan,
          as:'unit_plans',
          where: { status:1,project_id: project_id},
          attributes: ['id','plan','type', 'area','name','cost']
        },
        {
          model: UnitStatus,
          as: 'unit_status',
          attributes: ['id', 'name', 'color']
        }
      ],
    });

    res.json({
      success: true,
      units: units
    });
  } catch (error) {
    console.error('Error listing units:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching units',
      error: error.message
    });
  }
};

// Update unit price and status (with user verification)
exports.updateUnit = async (req, res) => {
  try {
    const { unit_id } = req.params;
    const user_id = req.user.id;
    const { price, status } = req.body;

    // Validate input
    if (!price && !status) {
      return res.status(400).json({
        success: false,
        message: 'Price or status must be provided for update'
      });
    }

    // Verify unit belongs to user's project
    const unit = await Unit.findOne({
      include: [{
        model: Project,
        where: { user_id }
      }],
      where: { id: unit_id }
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found or unauthorized'
      });
    }

    const updateData = {};
    if (price) updateData.price = price;
    if (status) updateData.status = status;

    const [updated] = await Unit.update(updateData, {
      where: { id: unit_id }
    });

    // Get updated unit data
    const updatedUnit = await Unit.findByPk(unit_id);

    res.json({
      success: true,
      message: 'Unit updated successfully',
      data: updatedUnit
    });
  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating unit',
      error: error.message
    });
  }
};

// Get unit details (with user verification)
exports.getUnitDetails = async (req, res) => {
  try {
    const { unit_id } = req.params;
    const user_id = req.user.id;

    const unit = await Unit.findOne({
      where: { id: unit_id },
      include: [{
        model: UnitPlan,
        as:'unit_plans',
        where: { status:1 },
        attributes: ['id','type', 'area','vr_url','name','cost']
      }]
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found or unauthorized'
      });
    }

    res.json({
      success: true,
      unit: unit
    });
  } catch (error) {
    console.error('Error fetching unit details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unit details',
      error: error.message
    });
  }
};

exports.updateUnitStaus = async(req, res) => {
  const { unit_id } = req.params;
  const { status } = req.body;
  if (![1,2,3].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const unit = await Unit.findByPk(unit_id);
  if (!unit) return res.status(404).json({ message: 'Unit not found' });
  unit.status = status;
  await unit.save();
  res.json({ success: true, unit });
},

// List all bookings with pagination and search
exports.listBookings = async (req, res) => {
  const user_id = req.user.id;
  const { page, limit, search,status,type } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const whereClause = {};

  // Search by customer name, email, or mobile
  if (search) {
    whereClause[Op.or] = [
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { mobile: { [Op.like]: `%${search}%` } }
    ];
  }

  if (status) {
    whereClause.status = status;
  }
  if (req.query.type) {
    whereClause.type = req.query.type;
  }

  try {
    const { count, rows } = await Booking.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['name', 'description'],
          where: { user_id }, // Only include bookings for projects owned by this user
        },
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'name','slug']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      bookings: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error listing bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

exports.updateBookingStatus = async (req, res) => {
  const user_id = req.user.id;
  const { booking_id } = req.params;
  const { status } = req.body;
  if (!['pending','confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  try {
    // Find the booking and ensure it belongs to a project owned by the user
    const booking = await Booking.findOne({
      where: { id: booking_id },
      include: [{
        model: Project,
        as: 'project',
        where: { user_id },
        attributes: []
      }]
    });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found or unauthorized' });
    }
    booking.status = status;
    await booking.save();
    
    // Map booking status to unit status numbers
    let unitStatus;
    switch (status) {
      case 'pending':
        unitStatus = 1;
        break;
      case 'confirmed':
        unitStatus = 2;
        break;
      case 'cancelled':
        unitStatus = 1;
        break;
      default:
        unitStatus = 1;
    }

    await Unit.update({status: unitStatus}, {where: {id: booking.unit_id}});
    res.json({ success: true, booking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, message: 'Error updating booking status', error: error.message });
  }
};

exports.getFloors = async (req, res) => {
  try {
    const { tower_id } = req.params;
    if (!tower_id) {
      return res.status(400).json({ success: false, message: 'tower_id is required' });
    }
    
    const floors = await Floor.findAll({
      where: { tower_id },
      attributes:['id','name'],
      order: [['id', 'ASC']]
    });
    res.json({ success: true, floors });
  } catch (error) {
    console.error('Error fetching floors:', error);
    res.status(500).json({ success: false, message: 'Error fetching floors', error: error.message });
  }
};

exports.updatePrice = async (req, res) => {
  try {
    const { unit_id } = req.params;
    const { cost } = req.body;
    const user_id = req.user.id;

    if (!cost) {
      return res.status(400).json({ success: false, message: 'Cost is required' });
    }

    // Verify unit belongs to user's project
    const unit = await Unit.findOne({
      where: { id: unit_id }
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found or unauthorized'
      });
    }

    unit.cost = cost;
    await unit.save();

    res.json({
      success: true,
      message: 'Unit cost updated successfully',
      data: unit
    });
  } catch (error) {
    console.error('Error updating unit cost:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating unit cost',
      error: error.message
    });
  }
};

exports.getProjectUpdates = async(req,res)=>{
  const projectId = req.params.project_id;
  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: 'Project ID is required'
    });
  }
  try {
    const updates = await ProjectUpdate.findAll({
      where: { project_id:projectId },
      order: [['created_at', 'DESC']]
    })

    res.status(200).json({
      success: true,
      updates: updates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching updates',
      error: error.message
    });
  }
};

exports.addProjectUpdates = async(req,res)=>{
  const projectId = req.params.project_id;
  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: 'Project ID is required'
    });
  }
  try {
    uploadImages(req, res, async function(err) {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err
        });
      }

      const { name, status } = req.body;
      const project = await Project.findByPk(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      const projectUpdate = await ProjectUpdate.create({
        name,
        project_id:req.params.project_id,
        image_url:req.file ? req.file.location : null,
        status
      })

      res.status(201).json({
        success: true,
        data: projectUpdate,
        message: 'Project Updates created successfully'
      });
      
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching updates',
      error: error.message
    });
  }
};

exports.deleteProjectUpdates = async(req,res)=>{
  if(!req.params.project_id || !req.params.update_id){
    return res.status(400).json({
      success: false,
      message: 'Project ID and Update ID is required'
    });
  }

  try {
    const projectUpdate = await ProjectUpdate.findByPk(req.params.update_id);
    if(projectUpdate){
      projectUpdate.active = false;
      projectUpdate.save();
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting updates',
      error: error.message
    });
  }
};

// Book a unit
exports.bookUnit = async (req, res) => {
  try {
    const { email, first_name, last_name, mobile, project_id, unit_id } = req.body;

    // Validate required fields
    if (!email || !first_name || !last_name || !mobile || !project_id || !unit_id) {
      return res.status(400).json({
        success: false,
        message: 'All fields (email, first_name, last_name, mobile, project_id, unit_id) are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate mobile format (assuming 10 digits)
    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be 10 digits'
      });
    }
    let id = project_id;
    // Check if project exists
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if unit exists and belongs to the project
    const unit = await Unit.findOne({
      where: { 
        id: unit_id
      }
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found or does not belong to the specified project'
      });
    }

    // Check if unit is available (status 1 = available)
    if (unit.status !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Unit is not available for booking'
      });
    }

    // Check if there's already a pending or confirmed booking for this unit
    const existingBooking = await Booking.findOne({
      where: {
        unit_id: unit_id,
        status: ['pending', 'confirmed']
      }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Unit is already booked'
      });
    }

    // Create booking
    const booking = await Booking.create({
      email,
      first_name,
      last_name,
      mobile,
      project_id,
      unit_id,
      status: 'pending',
    });

    // Update unit status to pending (status 1 = available, 2 = booked)
    await Unit.update(
      { status: 1 }, // Keep as available until confirmed
      { where: { id: unit_id } }
    );

    res.status(201).json({
      success: true,
      message: 'Unit booked successfully',
      data: {
        booking_id: booking.id,
        unit_id: booking.unit_id,
        project_id: booking.project_id,
        status: booking.status,
        customer: {
          first_name: booking.first_name,
          last_name: booking.last_name,
          email: booking.email,
          mobile: booking.mobile
        }
      }
    });

  } catch (error) {
    console.error('Error booking unit:', error);
    res.status(500).json({
      success: false,
      message: 'Error booking unit',
      error: error.message
    });
  }
};