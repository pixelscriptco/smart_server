const { Building, Floorplan, Unit, Floor, UnitStatus, Project, UnitPlan,Booking, BalconyImage } = require('../models');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

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
const uploadToS3 = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: config.aws.bucketName,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileType = file.fieldname === 'image'? 'jpg' : 'svg';
      cb(null, `units/${uniqueSuffix}.${fileType}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'image') {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
    } else if (file.fieldname === 'svg') {
      if (!file.originalname.match(/\.svg$/)) {
        return cb(new Error('Only SVG files are allowed!'), false);
      }
    }

    cb(null, true);
  },
  limits: {
    fileSize: 30 * 1024 * 1024 // 30MB limit
  }
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'svg', maxCount: 1 }
]);

// Configure multer for S3 upload
const upload3DImages = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: config.aws.bucketName,
    // acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `balcony/${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(obj|fbx|stl|dae)$/)) {
      return cb(new Error('Only 3d image files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 20MB limit
  }
}).single('image');

const unitController = {
  // Register a new Unit
  async createUnit(req, res) {
    try {
      const { name, floor_id, status_id, description } = req.body;

      // Validate floor exists
      const floor = await Floor.findByPk(floor_id);
      if (!floor) {
        return res.status(404).json({
          success: false,
          message: 'Floor not found'
        });
      }

      // Validate status exists
      const status = await UnitStatus.findByPk(status_id);
      if (!status) {
        return res.status(404).json({
          success: false,
          message: 'Unit status not found'
        });
      }

      // Check if unit name already exists in floor
      const existingUnit = await Unit.findOne({
        where: {
          floor_id,
          name
        }
      });

      if (existingUnit) {
        return res.status(400).json({
          success: false,
          message: 'Unit name already exists in this floor'
        });
      }

      const unit = await Unit.create({
        name,
        floor_id,
        status_id,
        description
      });

      res.status(201).json({
        success: true,
        data: unit,
        message: 'Unit created successfully'
      });
    } catch (error) {
      console.error('Error creating unit:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating unit',
        error: error.message
      });
    }
  },

  async saveFloorplan(req, res) {
    try {
      const { building_id } = req.params;
      const { image, svg, rects } = req.body;

      // Validate building exists
      const building = await Building.findByPk(building_id);
      if (!building) {
        return res.status(404).json({ message: 'Building not found' });
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../uploads/floorplans');
      await fs.mkdir(uploadsDir, { recursive: true });

      // Generate unique filename
      const filename = `${uuidv4()}.png`;
      const imagePath = path.join(uploadsDir, filename);

      // Save image file
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      await fs.writeFile(imagePath, base64Data, 'base64');

      // Create floorplan record
      const floorplan = await Floorplan.create({
        image_path: `/uploads/floorplans/${filename}`,
        svg_content: svg,
        rects_data: rects,
        building_id
      });

      res.status(201).json({
        message: 'Floor plan saved successfully',
        floorplan
      });
    } catch (error) {
      console.error('Error saving floor plan:', error);
      res.status(500).json({ message: 'Error saving floor plan' });
    }
  },

  async updateStatus(req, res){
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

  async getFloorplan(req, res) {
    try {
      const { building_id } = req.params;

      const floorplan = await Floorplan.findOne({
        where: { building_id },
        order: [['created_at', 'DESC']]
      });

      if (!floorplan) {
        return res.status(404).json({ message: 'Floor plan not found' });
      }

      res.json(floorplan);
    } catch (error) {
      console.error('Error getting floor plan:', error);
      res.status(500).json({ message: 'Error getting floor plan' });
    }
  },

  async deleteFloorplan(req, res) {
    try {
      const { building_id } = req.params;

      const floorplan = await Floorplan.findOne({
        where: { building_id }
      });

      if (!floorplan) {
        return res.status(404).json({ message: 'Floor plan not found' });
      }

      // Delete image file
      const imagePath = path.join(__dirname, '..', floorplan.image_path);
      await fs.unlink(imagePath).catch(() => {}); // Ignore if file doesn't exist

      // Delete database record
      await floorplan.destroy();

      res.json({ message: 'Floor plan deleted successfully' });
    } catch (error) {
      console.error('Error deleting floor plan:', error);
      res.status(500).json({ message: 'Error deleting floor plan' });
    }
  },

  // Get all units
  async getAllUnits(req, res) {
    try {
      const units = await Unit.findAll({
        include: [
          {
            model: Floor,
            as: 'floor',
            attributes: ['id', 'name', 'level']
          },
          {
            model: UnitStatus,
            as: 'status',
            attributes: ['id', 'name', 'color']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: units
      });
    } catch (error) {
      console.error('Error fetching units:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching units',
        error: error.message
      });
    }
  },

  // Get all units
  async getAllUnitPlans(req, res) {
    try {
      const unit_plans = await UnitPlan.findAll({
        where:{status:1},
        include: [
          {
            model: BalconyImage,
            as: 'balcony_images',
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: unit_plans
      });
    } catch (error) {
      console.error('Error fetching unit plans:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching unit plans',
        error: error.message
      });
    }
  },

  async uploadBalcony3dImage(req, res){
    try {
      upload3DImages(req, res, async function(err) {
        if (err) {
          console.error('Upload error:', err);
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }
        
        const { image,planId,balconyId } = req.body;
        const balconyImage = await BalconyImage.findByPk(balconyId);

        if (!balconyImage) {
          return res.status(404).json({
            success: false,
            message: 'BalconyImage not found'
          });
        }

        await balconyImage.update({
          image: req.file ? req.file.location : null
        });

        res.status(200).json({
          success: true,
          data: balconyImage,
          message: 'Balcony Image updated successfully'
        });
    })
    } catch (error) {
      console.error('Error adding balcony image', error);
      res.status(500).json({
        success: false,
        message: 'Error adding balcony image',
        error: error.message
      });
    }
  },
  // Get unit by ID
  async getUnitById(req, res) {
    try {
      const unit = await Unit.findByPk(req.params.id, {
        include: [
          {
            model: Floor,
            as: 'floor',
            attributes: ['id', 'name']
          },
          {
            model: UnitPlan,
            as: 'unit_plans',
            attributes: ['id', 'type', 'area', 'vr_url', 'plan','cost']
          },
          {
            model: UnitStatus,
            as: 'unit_status',
            attributes: ['id', 'name', 'color']
          }
        ]
      });

      if (!unit) {
        return res.status(404).json({
          success: false,
          message: 'Unit not found'
        });
      }

      res.status(200).json({
        success: true,
        data: unit
      });
    } catch (error) {
      console.error('Error fetching unit:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching unit',
        error: error.message
      });
    }
  },

  // Update unit
  async updateUnit(req, res) {
    try {
      const { name, floor_id, status_id, description, active } = req.body;
      const unit = await Unit.findByPk(req.params.id);

      if (!unit) {
        return res.status(404).json({
          success: false,
          message: 'Unit not found'
        });
      }

      // If floor_id is being updated, validate it exists
      if (floor_id && floor_id !== unit.floor_id) {
        const floor = await Floor.findByPk(floor_id);
        if (!floor) {
          return res.status(404).json({
            success: false,
            message: 'Floor not found'
          });
        }
      }

      // If status_id is being updated, validate it exists
      if (status_id && status_id !== unit.status_id) {
        const status = await UnitStatus.findByPk(status_id);
        if (!status) {
          return res.status(404).json({
            success: false,
            message: 'Unit status not found'
          });
        }
      }

      // If name is being updated, check for duplicates in the floor
      if (name && name !== unit.name) {
        const existingUnit = await Unit.findOne({
          where: {
            floor_id: floor_id || unit.floor_id,
            name
          }
        });

        if (existingUnit) {
          return res.status(400).json({
            success: false,
            message: 'Unit name already exists in this floor'
          });
        }
      }

      await unit.update({
        name: name || unit.name,
        floor_id: floor_id || unit.floor_id,
        status_id: status_id || unit.status_id,
        description: description || unit.description,
        active: active !== undefined ? active : unit.active
      });

      res.status(200).json({
        success: true,
        data: unit,
        message: 'Unit updated successfully'
      });
    } catch (error) {
      console.error('Error updating unit:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating unit',
        error: error.message
      });
    }
  },

  // Delete unit
  async deleteUnit(req, res) {
    try {
      const unit = await Unit.findByPk(req.params.id);

      if (!unit) {
        return res.status(404).json({
          success: false,
          message: 'Unit not found'
        });
      }

      await unit.destroy();

      res.status(200).json({
        success: true,
        message: 'Unit deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting unit:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting unit',
        error: error.message
      });
    }
  },
  async createUnitPlan(req, res){
    try {
      uploadToS3(req, res, async function(err) {
        if (err) {
          console.error('Upload error:', err);
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }
        
        const { name, project_id, area, cost, type, vr_url, balcony_entries } = req.body;

        if (!name || !req.files?.image || !area || !cost || !type) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: name, image, area, cost and type are required'
          });
        }

        // Validate project exists
        const project = await Project.findByPk(project_id);
        if (!project) {
          return res.status(404).json({ message: 'Project not found' });
        }
        
        // Get S3 URLs for uploaded files
        const plan = req.files.image[0].location;

        // Create unitplan record
        const unitPlan = await UnitPlan.create({
          name,
          project_id,
          plan,
          vr_url,
          area,
          cost,
          type
        });

        // If balcony entries are provided, store them
        if (req.body.balcony_entries) {
          const balcony_entries = JSON.parse(req.body.balcony_entries);
          if (balcony_entries.length > 0) {
            balcony_entries.forEach(async (entry) => {
              await BalconyImage.create({
                unit_plan_id: unitPlan.id,
                image_url: null, // Placeholder since we're not uploading actual images
                image_type: entry.type || 'normal',
                name: entry.name || null
              });
            });
          }
        }

        res.status(200).json({
          success: true,
          message: 'Unit plan created successfully'
        });
      })
    } catch (error) {
      console.error('Error creating unit plan:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating unit plan',
        error: error.message
      });
    }
  },

  async getEnquiries(req, res){
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const where = {};
      if (search) {
        const { Op, where } = require('sequelize');
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { message: { [Op.iLike]: `%${search}%` } }
        ];
      }
      const { count, rows } = await Booking.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        offset,
        limit: parseInt(limit),
        include: [
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'name']
          },
          {
            model: Unit,
            as: 'unit',
            attributes: ['id', 'name']
          }
        ]
      });
      
      res.json({
        success: true,
        enquiries: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      });
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      res.status(500).json({ success: false, message: 'Error fetching enquiries' });
    }
  }
};

module.exports = unitController; 