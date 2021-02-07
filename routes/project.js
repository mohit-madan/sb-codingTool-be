const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../auth_config/auth');
const {uploadFile, deleteFile, getFile} = require('../controller/documentFile.controller');
const {createProject, projectDetails} = require('../controller/project.controller');
const {getResponse, filterResponse} = require('../controller/response.controller');

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

// getResponse in pagination
router.post('/response/:pageNumber/:limit', getResponse);

// filter Response in pagination
router.post('/filter/:pageNumber/:limit', filterResponse);

module.exports = router;