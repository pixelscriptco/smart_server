const { Building, Tower, Project } = require('../models');
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
      const fileType = file.fieldname === 'image' ? 'jpg' : 'svg';
      cb(null, `buildings/${uniqueSuffix}.${fileType}`);
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

const buildingController = {
  async createBuilding(req, res) {
    try {
      uploadToS3(req, res, async function(err) {
        if (err) {
          console.error('Upload error:', err);
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        const { name, project_id, towers } = req.body;
        // const floorPlanData = JSON.parse(req.body.floorPlan);

        if (!name || !req.files?.image || !req.files?.svg || !towers) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: name, image, svg, and towers are required'
          });
        }

        
        // Get S3 URLs for uploaded files
        const image_url = req.files.image[0].location;
        const svg_url = req.files.svg[0].location;

        // Create building record in database
        const building = await Building.create({
          name,
          image_url,
          svg_url,
          project_id: parseInt(project_id, 10)
        });


        // Convert the string back to an array
        const towers_data = JSON.parse(towers);

        for (const tower of towers_data) {
          await Tower.create({
            name: tower.name,
            floor_count: tower.floorCount,
            building_id: building.id
          });
        }

        res.status(201).json({
          success: true,
          message: 'Building created successfully',
          building: {
            id: building.id,
            name: building.name,
            image: building.image_url,
            svg: building.svg_url,
          }
        });
      });
    } catch (error) {
      console.error('Error creating building:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating building',
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

  async getBuildings(req, res) {
    try {
      const { project_id } = req.params;

      const project = await Project.findByPk(project_id);

      const buildings = await Building.findAll({
        where: { project_id },
        order: [['created_at', 'DESC']]
      });

      if (!buildings) {
        return res.status(404).json({ message: 'Buildings' });
      }
      res.status(200).json({
        success: true,
        project:project.name,
        buildings: buildings
      });
    } catch (error) {
      console.error('Error getting building:', error);
      res.status(500).json({ message: 'Error getting building' });
    }
  },

  async getTowers(req, res) {
    try {
      const { building_id } = req.params;

      const towers = await Tower.findAll({
        where: { building_id },
        order: [['created_at', 'DESC']]
      });

      if (!towers) {
        return res.status(404).json({ message: 'Towers list is empty' });
      }
      res.status(200).json({
        success: true,
        towers: towers
      });
    } catch (error) {
      console.error('Error getting tower:', error);
      res.status(500).json({ message: 'Error getting towers' });
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
  }
};

module.exports = buildingController; 