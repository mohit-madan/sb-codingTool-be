const express = require('express');
const router = express.Router();
const {uploadFile, deleteFile} = require('../controller/controller.documentFile');
const {createProject, projectDetails} = require('../controller/controller.project');

//upload project document file
router.post('/uploadFile', uploadFile );

//delete dumy project document file
router.post('/deleteFile', deleteFile );

//create new project 
router.post('/createProject', createProject);

//get details of project
router.post('/projectDetails', projectDetails);

module.exports = router;