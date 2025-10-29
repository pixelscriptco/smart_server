const { Project, Tower, Building,UnitPlan,ProjectUpdate, User, Amenity } = require('../models');
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

// Configure multer for S3 upload for both logo and qr_code
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: config.aws.bucketName,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      if (file.fieldname === 'logo') {
        cb(null, `logo/${uniqueSuffix}${path.extname(file.originalname)}`);
      } else if (file.fieldname === 'qr_code') {
        cb(null, `qr_code/${uniqueSuffix}${path.extname(file.originalname)}`);
      } else if (file.fieldname === 'location_image') {
        cb(null, `location/${uniqueSuffix}${path.extname(file.originalname)}`);
      }else if (file.fieldname === 'location_logo') {
        cb(null, `location_logo/${uniqueSuffix}${path.extname(file.originalname)}`);
      } else {
        cb(null, `${file.fieldname}/${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    }
  }),
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  }
}).fields([
  { name: 'logo', maxCount: 1 },
  { name: 'qr_code', maxCount: 1 },
  { name: 'location_image', maxCount: 1 },
  { name: 'location_logo', maxCount: 1 },
]);

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
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  }
}).single('image');

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
      cb(null, `projects/${uniqueSuffix}.${fileType}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  }
}).fields([
  { name: 'image', maxCount: 1 }
]);

const projectController = {
  // Register a new Project
  async createProject(req, res) {
    try {      
      upload(req, res, async function(err) {
        if (err) {
          console.error('Upload error:', err);
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        const { name, description, company_id, project_url, registration_number,website_link,location,latitude,longitude,location_title,location_description,home_location_description,walkthrough_video } = req.body;
        const logoFile = req.files && req.files.logo && req.files.logo[0];
        const qrCodeFile = req.files && req.files.qr_code && req.files.qr_code[0];
        const locationImageFile = req.files && req.files.location_image && req.files.location_image[0];
        const locationLogoFile = req.files && req.files.location_logo && req.files.location_logo[0];

        if (!name || !company_id) {
          return res.status(400).json({ message: 'Missing required fields.' });
        }
        
        // Create project with logo and qr_code URL from S3
        const project = await Project.create({
          name,
          description,
          website_link,
          status: 1,
          user_id: company_id,
          url: name.replace(/\s+/g, ''),
          project_url: project_url,
          logo: logoFile ? logoFile.location : null,
          registration_number: registration_number || null,
          qr_code: qrCodeFile ? qrCodeFile.location : null,
          walkthrough_video: walkthrough_video || null,
          home_location_description: home_location_description || null,
          location: location ? location : null,
          location_title: location_title ? location_title : null,
          location_description: location_description ? location_description : null,
          location_image: locationImageFile ? locationImageFile.location : null,
          latitude: latitude ? JSON.parse(latitude) : null,
          longitude: longitude ? JSON.parse(longitude) : null,
          location_logo: locationLogoFile ? locationLogoFile.location : null,
        });

        res.status(201).json({
          success: true,
          data: project,
          message: 'Project created successfully'
        });
      });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating project',
        error: error.message
      });
    }
  },

  async deleteProject(req, res) {
    try {
      const { project_id } = req.params;

      const project = await Project.findOne({
        where: { building_id }
      });

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Delete database record
      await project.destroy();

      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Error deleting Project:', error);
      res.status(500).json({ message: 'Error deleting Project' });
    }
  },

  // Get all projects
  async listProjects(req, res) {
    try {      
      const projects = await Project.findAll({
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            attributes: ['company','url'] // get only company from user
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: projects
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching projects',
        error: error.message
      });
    }
  },

  // Get project by ID
  async getProjectById(req, res) {
    try {
      const project = await Project.findByPk(req.params.project_id);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      res.status(200).json({
        success: true,
        project: project
      });
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching project',
        error: error.message
      });
    }
  },

  // Update project
  async updateProject(req, res) {
    try {
      upload(req, res, async function(err) {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        const { name, url, project_url, status, registration_number,description,location,latitude,longitude,location_title,location_description,location_image,website_link,home_location_description,walkthrough_video } = req.body;
        const logoFile = req.files && req.files.logo && req.files.logo[0];
        const qrCodeFile = req.files && req.files.qr_code && req.files.qr_code[0];
        const locationFile = req.files && req.files.location_image && req.files.location_image[0];
        const locationLogoFile = req.files && req.files.location_logo && req.files.location_logo[0];
        const project = await Project.findByPk(req.params.project_id);

        if (!project) {
          return res.status(404).json({
            success: false,
            message: 'Project not found'
          });
        }

        // If new logo is uploaded, delete old one from S3
        if (logoFile && project.logo) {
          const oldLogoKey = project.logo.split('/').pop();
          await s3Client.deleteObject({
            Bucket: config.aws.bucketName,
            Key: `projects/logos/${oldLogoKey}`
          }).promise();
        }
        // If new qr_code is uploaded, delete old one from S3
        if (qrCodeFile && project.qr_code) {
          const oldQrKey = project.qr_code.split('/').pop();
          await s3Client.deleteObject({
            Bucket: config.aws.bucketName,
            Key: `qr_code/${oldQrKey}`
          }).promise();
        }

        // If new qr_code is uploaded, delete old one from S3
        if (locationFile && project.location_image) {
          const oldLocationImage = project.location_image.split('/').pop();
          await s3Client.deleteObject({
            Bucket: config.aws.bucketName,
            Key: `location/${oldLocationImage}`
          }).promise();
        }

        // If new location logo is uploaded, delete old one from S3
        if (locationLogoFile && project.location_logo) {
          const oldLocationLogo = project.location_logo.split('/').pop();
          await s3Client.deleteObject({
            Bucket: config.aws.bucketName,
            Key: `location_logo/${oldLocationLogo}`
          }).promise();
        }

        // Update project
        await project.update({
          name: name || project.name,
          url: url || project.url,
          website_link:website_link || project.website_link,
          description: description || project.description,
          project_url: project_url || project.project_url,
          status: status || project.status,
          logo: logoFile ? logoFile.location : project.logo,
          registration_number: registration_number || project.registration_number,
          qr_code: qrCodeFile ? qrCodeFile.location : project.qr_code,
          walkthrough_video: walkthrough_video ? walkthrough_video : project.walkthrough_video,
          home_location_description: home_location_description || project.home_location_description,
          location: location ? location : project.location,
          location_image: locationFile?locationFile:project.location_image,
          location_title: location_title? location_title: project.location_title,
          location_description: location_description? location_description: project.location_description,
          latitude: latitude ? JSON.parse(latitude) : project.latitude,
          longitude: longitude ? JSON.parse(longitude) : project.longitude,
          location_logo: locationLogoFile ? locationLogoFile.location : project.location_logo
        });

        res.status(200).json({
          success: true,
          data: project,
          message: 'Project updated successfully'
        });
      });
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating project',
        error: error.message
      });
    }
  },

  // Update project status only
  async updateProjectStatus(req, res) {
    try {
      const { status } = req.body;
      const projectId = req.params.project_id;
      
      const project = await Project.findByPk(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Update only the status
      await project.update({
        status: status
      });

      res.status(200).json({
        success: true,
        data: project,
        message: 'Project status updated successfully'
      });
    } catch (error) {
      console.error('Error updating project status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating project status',
        error: error.message
      });
    }
  },

  // Delete project
  async deleteProject(req, res) {
    try {
      const project = await Project.findByPk(req.params.id);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Delete logo from S3 if exists
      if (project.logo) {
        const logoKey = project.logo.split('/').pop();
        await s3Client.deleteObject({
          Bucket: config.aws.bucketName,
          Key: `projects/logos/${logoKey}`
        }).promise();
      }

      await project.destroy();

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting project',
        error: error.message
      });
    }
  },

  // Get towers by project ID
  async getTowersByProjectId(req, res) {
    try {      
      const projectId = req.params.project_id;
      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: 'Project ID is required'
        });
      }
      const project = await Project.findByPk(projectId);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      const towers = await Tower.findAll({
        include: [
          {
            model: Building,
            as: 'building',
            where: { project_id: parseInt(projectId) }
          }
        ],
        order: [['created_at', 'DESC']]
      });
      
      res.status(200).json({
        success: true,
        project:project.name,
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

  async getProjectUpdates(req,res){
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
  },

  async addProjectUpdates(req,res){
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
            message: err.message
          });
        }

        const { name, status, image_url } = req.body;
        const project = await Project.findByPk(req.params.project_id);

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
  },

  async deleteProjectUpdates(req,res){
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
  },

  async getAllPlans(req, res){
    try {

      const plans = await UnitPlan.findAll({
        where: { project_id: req.params.id },
        order: [['created_at', 'DESC']]
      });

      if (!plans) {
        return res.status(404).json({
          success: false,
          message: 'Plans not found'
        });
      }

      res.status(200).json({
        success: true,
        plans: plans
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching plans',
        error: error.message
      });
    }
  },

  async listCompanies(req, res){
    try {      
      const companies = await User.findAll({
        attributes: ['id', 'company'],
        where: { type:'customer', status:'active' }
      });

      res.status(200).json({
        success: true,
        companies: companies
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error listing companies',
        error: error.message
      });
    }
  },
  // Get project amenities
  async getProjectAmenities(req, res) {
    try {
      const project = await Project.findOne({
        where: { id: req.params.id },
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      const amenities = await Amenity.findAll({
        where: { project_id: req.params.id },
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        amenities: amenities
      });
    } catch (error) {
      console.error('Error fetching project amenities:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching project amenities',
        error: error.message
      });
    }
  },

  // Create project amenity
  async createProjectAmenity(req, res) {
    try {
      uploadToS3(req, res, async function(err) {
        if (err) {
          console.error('Upload error:', err);
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        const { name, vr_url } = req.body;
        console.log(req.files.image[0].location);
        
        const image = req.files.image[0].location;
        const project = await Project.findByPk(req.params.id);

        if (!project) {
          return res.status(404).json({
            success: false,
            message: 'Project not found'  
          });
        }

        const amenity = await Amenity.create({
          name,
          image,
          vr_url,
          project_id: project.id
        });

        res.status(200).json({
          success: true,
          amenities: amenity
        });
      });
    } catch (error) {
      console.error('Error fetching project amenities:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching project amenities',
        error: error.message
      });
    }
  },  

  // Update project amenity
  async updateProjectAmenity(req, res) {
    try {
      const { name, vr_url } = req.body;
      const amenity = await Amenity.findByPk(req.params.amenityId);

      if (!amenity) {
        return res.status(404).json({
          success: false,
          message: 'Amenity not found'
        });
      } 

      await amenity.update({
        name,
        vr_url
      });

      res.status(200).json({
        success: true,
        message: 'Amenity updated successfully'
      });
      
    } catch (error) {
      console.error('Error updating project amenity:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating project amenity',
        error: error.message
      });
    }
  },

  // Delete project amenity
  async deleteProjectAmenity(req, res) {
    try {
      const amenity = await Amenity.findByPk(req.params.amenityId);

      if (!amenity) {
        return res.status(404).json({
          success: false,
          message: 'Amenity not found'
        });
      }

      await amenity.update({
        active: 0
      });

      res.status(200).json({
        success: true,
        message: 'Amenity deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting project amenity:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting project amenity',
        error: error.message
      });
    }
  },
};

module.exports = projectController; 