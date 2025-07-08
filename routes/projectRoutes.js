const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');

// Get dashboard statistics
router.post('/', auth, projectController.createProject);
router.get('/', auth, projectController.listProjects);
router.get('/companies', auth, projectController.listCompanies);

// Project routes
router.get('/:project_id', auth, projectController.getProjectById);
router.patch('/status/:project_id', auth, projectController.updateProjectStatus);
router.put('/:project_id', auth, projectController.updateProject);
router.delete('/:project_id', auth, projectController.deleteProject);

router.get('/:project_id/updates', auth, projectController.getProjectUpdates);
router.post('/:project_id/updates', auth, projectController.addProjectUpdates);
router.delete('/:project_id/updates/:update_id', auth, projectController.deleteProjectUpdates);
router.get('/:project_id/towers', auth, projectController.getTowersByProjectId);
router.get('/:id/plans', auth,projectController.getAllPlans);


module.exports = router; 