const express = require('express');
const router = express.Router();
const {uploadFile} = require('../controller/controller.upload');
const {createProject, projectDetails} = require('../controller/controller.project');

//upload project document file
router.post('/uploadFile', uploadFile );

//create new project 
router.post('/createProject', createProject);

//get details of project
router.post('/projectDetails', projectDetails);

module.exports = router;