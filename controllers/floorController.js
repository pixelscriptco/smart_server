const { Project, FloorPlan, Floor, Tower, Unit,UnitStatus, UnitPlan } = require('../models');
const path = require('path');
const fs = require('fs').promises;

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
      const fileType = file.fieldname === 'image' ? 'jpg' : 'svg';
      cb(null, `floors/${uniqueSuffix}.${fileType}`);
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
    fileSize: 20 * 1024 * 1024 // 20MB limit
  }
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'svg', maxCount: 1 }
]);

const floorController = {
  // Register a new Floor
  async createFloor(req, res) {
    try {
      const { name, tower_id, level, description } = req.body;

      // Validate tower exists
      const tower = await Tower.findByPk(tower_id);
      if (!tower) {
        return res.status(404).json({
          success: false,
          message: 'Tower not found'
        });
      }

      // Check if level already exists in tower
      const existingFloor = await Floor.findOne({
        where: {
          tower_id,
          level
        }
      });

      if (existingFloor) {
        return res.status(400).json({
          success: false,
          message: 'Floor level already exists in this tower'
        });
      }

      const floor = await Floor.create({
        name,
        tower_id,
        level,
        description
      });

      res.status(201).json({
        success: true,
        data: floor,
        message: 'Floor created successfully'
      });
    } catch (error) {
      console.error('Error creating floor:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating floor',
        error: error.message
      });
    }
  },

  async saveFloorPlan(req, res) {
    try {
      uploadToS3(req, res, async function(err) {
        if (err) {
          console.error('Upload error:', err);
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        const { name, project_id, units } = req.body;


        if (!name || !req.files?.image || !req.files?.svg || !units) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: name, image, svg, and units are required'
          });
        }

        // Validate project exists
        const project = await Project.findByPk(project_id);
        if (!project) {
          return res.status(404).json({ message: 'Project not found' });
        }
        
        // Get S3 URLs for uploaded files
        const image_url = req.files.image[0].location;
        const svg_url = req.files.svg[0].location;
        const unit_count = units;
        
        // Create floorplan record
        const floorplan = await FloorPlan.create({
          name,
          project_id,
          image_url,
          svg_url,
          unit_count
        });


        res.status(201).json({
          message: 'Floor plan saved successfully',
          floorplan
        });

      })
    } catch (error) {
      console.error('Error saving floor plan:', error);
      res.status(500).json({ message: 'Error saving floor plan' });
    }
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

  // Get all floors
  async getAllFloors(req, res) {
    try {
      const floors = await Floor.findAll({
        include: [
          {
            model: Tower,
            as: 'tower',
            attributes: ['id', 'name']
          }
        ],
        order: [['level', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: floors
      });
    } catch (error) {
      console.error('Error fetching floors:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching floors',
        error: error.message
      });
    }
  },

  // Get floor by ID
  async getFloorById(req, res) {
    try {
      const floor = await Floor.findByPk(req.params.id, {
        include: [
          {
            model: Tower,
            as: 'tower',
            attributes: ['id', 'name']
          },
          {
            model: Unit,
            as: 'units',
            attributes: ['id', 'name', 'status_id']
          }
        ]
      });

      if (!floor) {
        return res.status(404).json({
          success: false,
          message: 'Floor not found'
        });
      }

      res.status(200).json({
        success: true,
        data: floor
      });
    } catch (error) {
      console.error('Error fetching floor:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching floor',
        error: error.message
      });
    }
  },

  // Update floor
  async updateFloor(req, res) {
    try {
      const { name, tower_id, level, description, active } = req.body;
      const floor = await Floor.findByPk(req.params.id);

      if (!floor) {
        return res.status(404).json({
          success: false,
          message: 'Floor not found'
        });
      }

      // If tower_id is being updated, validate it exists
      if (tower_id && tower_id !== floor.tower_id) {
        const tower = await Tower.findByPk(tower_id);
        if (!tower) {
          return res.status(404).json({
            success: false,
            message: 'Tower not found'
          });
        }
      }

      // If level is being updated, check for duplicates
      if (level && level !== floor.level) {
        const existingFloor = await Floor.findOne({
          where: {
            tower_id: tower_id || floor.tower_id,
            level
          }
        });

        if (existingFloor) {
          return res.status(400).json({
            success: false,
            message: 'Floor level already exists in this tower'
          });
        }
      }

      await floor.update({
        name: name || floor.name,
        tower_id: tower_id || floor.tower_id,
        level: level || floor.level,
        description: description || floor.description,
        active: active !== undefined ? active : floor.active
      });

      res.status(200).json({
        success: true,
        data: floor,
        message: 'Floor updated successfully'
      });
    } catch (error) {
      console.error('Error updating floor:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating floor',
        error: error.message
      });
    }
  },

  // Delete floor
  async deleteFloor(req, res) {
    try {
      const floor = await Floor.findByPk(req.params.id);

      if (!floor) {
        return res.status(404).json({
          success: false,
          message: 'Floor not found'
        });
      }

      // Check if floor has any units
      const unitCount = await Unit.count({
        where: { floor_id: floor.id }
      });

      if (unitCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete floor with existing units'
        });
      }

      await floor.destroy();

      res.status(200).json({
        success: true,
        message: 'Floor deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting floor:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting floor',
        error: error.message
      });
    }
  },

  async getAllFloorPlans(req, res){
    try {
      const floorPlans = await FloorPlan.findAll({
        where: { project_id: req.params.project_id },
      });
      if (!floorPlans) {
        return res.status(404).json({
          success: false,
          message: 'Floor Plans not found'
        });
      }

      res.status(200).json({
        success: true,
        floorPlans: floorPlans
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching floor plans',
        error: error.message
      });
    }
  },

  async getFloorPlan (req, res){
    try {
      const floor = await Floor.findOne({
        where: { id: req.params.floor_id },
        include: [
          {
            model: FloorPlan,
            as: 'floor_plan'
          }
        ],
      });
      if (!floor) {
        return res.status(404).json({
          success: false,
          message: 'Floor not found'
        });
      }

      res.status(200).json({
        success: true,
        floor: floor
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching floor plan',
        error: error.message
      });
    }
  },

  async getUnits(req, res){
    try {
      const units = await Unit.findAll({
        where: { floor_id: req.params.floor_id },
        include: [
          {
            model: UnitStatus,
            as: 'unit_status'
          },
          {
            model: UnitPlan,
            as: 'unit_plans',
            required: false
          }
        ]
      });

      if (!units) {
        return res.status(200).json({
          success: false,
          message: 'Floor not found'
        });
      }

      res.status(200).json({
        success: true,
        units: units
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching floor plan',
        error: error.message
      });
    }
  },

  async mapFloorUnit(req, res) {
    try {
      const { unit_id, unit_plan_id } = req.body;

      if (!unit_id || !unit_plan_id) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: unit_id and unit_plan_id are required'
        });
      }

      const unit = await Unit.findByPk(unit_id);
      if (!unit) {
        return res.status(404).json({
          success: false,
          message: 'Unit not found'
        });
      }

      const unitPlan = await UnitPlan.findByPk(unit_plan_id);
      if (!unitPlan) {
        return res.status(404).json({
          success: false,
          message: 'Unit plan not found'
        });
      }

      await unit.update({
        unit_plan_id: unit_plan_id,
        cost: unitPlan.cost
      });

      res.status(200).json({
        success: true,
        message: 'Unit plan mapped successfully',
        unit
      });
    } catch (error) {
      console.error('Error mapping unit plan:', error);
      res.status(500).json({
        success: false,
        message: 'Error mapping unit plan',
        error: error.message
      });
    }
  }

};

module.exports = floorController; 