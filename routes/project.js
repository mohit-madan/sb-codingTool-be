const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../auth_config/auth');
const {uploadFile, deleteFile, getFile} = require('../controller/controller.documentFile');
const {createProject, projectDetails} = require('../controller/controller.project');

//upload project document file
router.post('/uploadFile', authenticateUser, uploadFile );

//get project document file
router.post('/getFile', authenticateUser, getFile );

//delete dumy project document file
router.post('/deleteFile', authenticateUser, deleteFile );

//create new project 
router.post('/createProject', authenticateUser, createProject);

//get details of project
router.post('/projectDetails', authenticateUser, projectDetails);

module.exports = router;