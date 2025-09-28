const { Building, Tower, Project, Amenity, TowerPlan, Floor, Unit,FloorPlan, UnitPlan } = require('../models');
const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const config = require('../config/config');
const { where } = require('sequelize');

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
      cb(null, `towers/${uniqueSuffix}.${fileType}`);
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


const towerController = {
  // Get all towers
  async getAllTowers(req, res) {
    try {      
      const projectId = req.params.project_id;
      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: 'Project ID is required'
        });
      }
      console.log(projectId);
      
      const towers = await Tower.findAll({
        include: [
          {
            model: Building,
            as: 'building',
            where: { project_id: parseInt(projectId) }
          }
        ]
      });
      
      res.status(200).json({
        success: true,
        towers: towers
      });
    } catch (error) {
      console.error('Error fetching towers:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching towers',
        error: error.message
      });
    }
  },

  // Get tower by ID
  async getTowerById(req, res) {
    try {
      const order = req.query.order??0;
      
      const tower = await Tower.findByPk(req.params.id, {
        include: [
          {
            model: TowerPlan,
            as: 'tower_plans',
            where: { order: order },
            required: false, 
            order: [
              ['order', 'ASC']
            ]
          }
        ]
      });
      
      if (!tower) {
        return res.status(404).json({
          success: false,
          message: 'Tower not found'
        });
      }

      res.status(200).json({
        success: true,
        tower: tower
      });
    } catch (error) {
      console.error('Error fetching tower:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching tower',
        error: error.message
      });
    }
  },

  async getUnitsByTowerId(req, res){
    try {      
      const tower = await Tower.findByPk(req.params.id);
      
      if (!tower) {
        return res.status(404).json({
          success: false,
          message: 'Tower not found'
        });
      }

      const units = await Unit.findAll({
              attributes: ['id', 'name'],
              include: [
                {
                  model: Floor, 
                  as: 'floor',
                  required: true,
                  where: { tower_id: tower.id },
                }
              ]
            });
      res.status(200).json({
        success: true,
        units: units
      });
    } catch (error) {
      console.error('Error fetching tower:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching tower',
        error: error.message
      });
    }
  },

  // Create new tower
  async createTower(req, res) {
    try {
      uploadToS3(req, res, async function(err) {
        if (err) {
          console.error('Upload error:', err);
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        const { name, tower_id, image, svg, floors, order, direction, isExistingTower } = req.body;

        if (!name || !req.files?.image || !req.files?.svg || !direction ) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: name, image, svg, and direction are required'
          });
        }

        // Validate tower exists
        const tower = await Tower.findByPk(tower_id);
        if (!tower) {
          return res.status(404).json({
            success: false,
            message: 'Tower not found'
          });
        }

        // Get S3 URLs for uploaded files
        const image_url = req.files.image[0].location;
        const svg_url = req.files.svg[0].location;

        if (isExistingTower === 'true') {
          // Update existing TowerPlan
          const existingPlan = await TowerPlan.findOne({
            where: {
              tower_id: tower_id,
              order: order
            }
          });

          if (existingPlan) {
            // Update existing plan with new SVG and image
            await existingPlan.update({
              image_url,
              svg_url,
              direction
            });

            res.status(200).json({
              success: true,
              message: 'Tower plan updated successfully'
            });
          } else {
            // Create new TowerPlan if none exists for this order
            await TowerPlan.create({
              tower_id,
              image_url,
              svg_url,
              order,
              direction
            });

            res.status(201).json({
              success: true,
              message: 'Tower plan created successfully'
            });
          }
        } else {
          // Create new TowerPlan and floors
          const plan = await TowerPlan.create({
            tower_id,
            image_url,
            svg_url,
            order,
            direction
          });

          let tower_plans = await TowerPlan.findAll({where: {tower_id: tower_id}});

          // Create floors if floors data is provided
          if (tower_plans.length==1 && floors) {
            // const floorsData = JSON.parse(floors);
            // if (Array.isArray(floorsData) && floorsData.length > 0) {
            //   // If floors array is provided, create floors based on the data
            //   for (let index = 1; index <= floorsData.length; index++) {
            //     const floorName = 'Floor-' + index;
            //     await Floor.create({
            //       tower_id,
            //       name: floorName
            //     });
            //   }
            // } else {
              // Fallback: create floors based on tower floor_count
              const floor_count = tower.floor_count || 1;
              for (let index = 1; index <= floor_count; index++) {
                const floorName = 'Floor-' + index;
                await Floor.create({
                  tower_id,
                  name: floorName
                });
              }
            // }
          }

          res.status(201).json({
            success: true,
            message: 'Tower plan and floors created successfully'
          });
        }
      });
    } catch (error) {
      console.error('Error creating/updating tower:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating/updating tower',
        error: error.message
      });
    }
  },

  // Update tower
  async updateTower(req, res) {
    try {
      const { name, project_id, description, total_floors, active } = req.body;
      const tower = await Tower.findByPk(req.params.id);

      if (!tower) {
        return res.status(404).json({
          success: false,
          message: 'Tower not found'
        });
      }

      // If project_id is being updated, validate it exists
      if (project_id && project_id !== tower.project_id) {
        const project = await Project.findByPk(project_id);
        if (!project) {
          return res.status(404).json({
            success: false,
            message: 'Project not found'
          });
        }
      }

      await tower.update({
        name: name || tower.name,
        project_id: project_id || tower.project_id,
        description: description || tower.description,
        total_floors: total_floors || tower.total_floors,
        active: active !== undefined ? active : tower.active
      });

      res.status(200).json({
        success: true,
        data: tower,
        message: 'Tower updated successfully'
      });
    } catch (error) {
      console.error('Error updating tower:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating tower',
        error: error.message
      });
    }
  },

  // Delete tower
  async deleteTower(req, res) {
    try {
      const tower = await Tower.findByPk(req.params.id);

      if (!tower) {
        return res.status(404).json({
          success: false,
          message: 'Tower not found'
        });
      }

      await tower.destroy();

      res.status(200).json({
        success: true,
        message: 'Tower deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting tower:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting tower',
        error: error.message
      });
    }
  },

  async getAllFloors(req, res){
    try {

      const floors = await Floor.findAll({
        where: { tower_id: req.params.id },
        include: [
          {
            model: FloorPlan,
            as: 'floor_plan',
            attributes: ['id', 'name']
          }
        ]
      });

      if (!floors) {
        return res.status(404).json({
          success: false,
          message: 'Floors not found'
        });
      }

      res.status(200).json({
        success: true,
        floors: floors
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching floors',
        error: error.message
      });
    }
  },

  async addFloorPlan(req, res){
    try {
      const tower_id = req.params.id;
      if(!tower_id){
        return res.status(400).json({
          success: false,
          message: 'Tower id is required'
        });
      }

      const tower = await Tower.findByPk(tower_id);

      if(!tower){
        return res.status(400).json({
          success: false,
          message: 'Tower is not exist'
        });
      }

      const { floor_ids, floor_plan_id } = req.body;

      if (!floor_plan_id || !floor_ids) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: Floor Plan ids, and floors are required'
        });
      }

      await Floor.update(
        { floor_plan_id },
        { where: { id: floor_ids } }
      );

      const floors = await Floor.findAll({
        where: { id: floor_ids }
      });

      const unitsToCreate = [];

      for (const floor of floors) {
        const existingUnit = await Unit.findOne({
          where: { floor_id: floor.id }
        });
  
        if (existingUnit) {
          continue;
        }

        const floor_plan = await FloorPlan.findOne({
          where: {id: floor.floor_plan_id}
        })

        const floorNumRaw = floor.name.replace('Floor-', '');
        // const floorNumPadded = floorNumRaw.padStart(2, '0');
        for (let i = 1; i <= floor_plan.unit_count; i++) {
          const unitNumPadded = i.toString().padStart(2, '0');
          const unitName = `${tower.name}-${floorNumRaw}${unitNumPadded}`;

          unitsToCreate.push({
            name: unitName,
            floor_id: floor.id,
            status:1
          });
        }
      }

      if (unitsToCreate.length > 0) {
        await Unit.bulkCreate(unitsToCreate);
        console.log('Units created successfully for eligible floors.');
      } else {
        console.log('No new units created. All floors already have units.');
      }

      res.status(201).json({
        success: true,
        message: 'Tower Plan added successfully'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error adding floor plan',
        error: error.message
      });
    }
  },
  
};

module.exports = towerController; 