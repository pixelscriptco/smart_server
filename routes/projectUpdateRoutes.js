const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ProjectUpdate = require('../models/ProjectUpdate');
const auth = require('../middleware/auth');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/project-updates';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'update-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
  }
});

// Get all updates for a project
router.get('/projects/:projectId/updates', auth, async (req, res) => {
  try {
    const updates = await ProjectUpdate.find({ project: req.params.projectId })
      .sort({ date: -1 })
      .populate('created_by', 'name email');
    
    res.json({ updates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new update
router.post('/projects/:projectId/updates', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const update = new ProjectUpdate({
      project: req.params.projectId,
      image_url: `/uploads/project-updates/${req.file.filename}`,
      description: req.body.description,
      status: req.body.status,
      created_by: req.user._id
    });

    const savedUpdate = await update.save();
    res.status(201).json(savedUpdate);
  } catch (error) {
    // Delete uploaded file if update creation fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ message: error.message });
  }
});

// Delete an update
router.delete('/projects/:projectId/updates/:updateId', auth, async (req, res) => {
  try {
    const update = await ProjectUpdate.findById(req.params.updateId);
    
    if (!update) {
      return res.status(404).json({ message: 'Update not found' });
    }

    // Delete the image file
    const imagePath = path.join(__dirname, '..', update.image_url);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await update.remove();
    res.json({ message: 'Update deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update an existing update
router.patch('/projects/:projectId/updates/:updateId', auth, upload.single('image'), async (req, res) => {
  try {
    const update = await ProjectUpdate.findById(req.params.updateId);
    
    if (!update) {
      return res.status(404).json({ message: 'Update not found' });
    }

    // Update fields
    if (req.body.description) update.description = req.body.description;
    if (req.body.status) update.status = req.body.status;
    
    // If new image is uploaded
    if (req.file) {
      // Delete old image
      const oldImagePath = path.join(__dirname, '..', update.image_url);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      update.image_url = `/uploads/project-updates/${req.file.filename}`;
    }

    const updatedUpdate = await update.save();
    res.json(updatedUpdate);
  } catch (error) {
    // Delete uploaded file if update fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 