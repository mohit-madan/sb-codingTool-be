const express = require('express');
const router = express.Router();
const {uploadFile, deleteFile, getFile} = require('../controller/controller.documentFile');
const {createProject, projectDetails} = require('../controller/controller.project');

//upload project document file
router.post('/uploadFile', uploadFile );

//get project document file
router.post('/getFile', getFile );

//delete dumy project document file
router.post('/deleteFile', deleteFile );

//create new project 
router.post('/createProject', createProject);

//get details of project
router.post('/projectDetails', projectDetails);

module.exports = router;