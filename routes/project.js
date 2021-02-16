const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../auth_config/auth');
const {uploadFile, deleteFile, getFile} = require('../controller/documentFile.controller');
const {createProject, projectDetails, userSearch, questionCodebook} = require('../controller/project.controller');
const {getResponse, operatorResponse} = require('../controller/response.controller');

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

// search user by name email phone (make sure account is verified)
router.post('/userSearch', userSearch);

// getResponse in pagination
router.post('/response/:pageNumber/:limit', getResponse);

// operator Response in pagination
router.post('/operator/:pageNumber/:limit', operatorResponse);

router.post('/questionCodebook', questionCodebook);

module.exports = router;