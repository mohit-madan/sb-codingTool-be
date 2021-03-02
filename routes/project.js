const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../auth_config/auth');
const {uploadFile, deleteFile, getFile} = require('../controller/documentFile.controller'); 
const {createProject, projectDetails, questionCodebook} = require('../controller/project.controller');
const {getResponse, operatorResponse} = require('../controller/response.controller');
const {userSearch, projectList} = require('../controller/dashBoard.controller');

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
router.post('/response', getResponse);

// operator Response in pagination
router.post('/operator', operatorResponse);

//get codebook of question
router.post('/questionCodebook', questionCodebook);
//get list of all project
router.post('/projectList', authenticateUser, projectList);

//get user all projects list
router.post('/projectList', authenticateUser, projectList);
//add projectList

module.exports = router;
