const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../auth_config/auth');
const {uploadFile, deleteFile, getFile} = require('../controller/documentFile.controller');
const {createProject, projectDetails} = require('../controller/project.controller');
const {getResponse, sortByLength, searchByCodeWord} = require('../controller/response.controller');

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
router.get('/response/:pageNumber/:limit', getResponse);

// sort by code word length
router.get('/sort/:min/:max', sortByLength);

// search by given pattern
router.get('/search/:pattern',  searchByCodeWord);

//insert data api (by machine learning)
const Question = require('../models/question.model');
const Project = require('../models/project.model');
const Response = require('../models/response.model');
const Codebook = require('../models/codebook.model');
const mongoose = require('mongoose');

router.get('/insert',async (req, res)=>{
    const data= req.body.data;
    await data.forEach(async ele=>{
        const newQuestion =await new Question({
            _id: new mongoose.Types.ObjectId(),
            desc: ele.question,
            percentageOfCoded: ele.percentageOfCoded
        }).save((err,question)=>{
            if(err) return res.send({err});
            else{
                Project.findByIdAndUpdate(req.body.projectId, { $push: { listOfQuestion : question._id }},{ upsert: true, new: true }).
                exec((err, project)=>{
                   if(err){
                     return res.send({err:err});
                   }else{
                       ele.responses.forEach(item=>{
                            const newCodebook = new Codebook({
                                _id: new mongoose.Types.ObjectId(),
                                projectId: req.body.projectId,
                                questionId: question._id,
                                codeword: item.codeword,
                                length: item.length
                            }).save((err, codebook)=>{
                                if(err) return res.send({err});
                                else{
                                    Project.findByIdAndUpdate(req.body.projectId, { $push: { codebook: codebook._id }},{ upsert: true, new: true }).
                                    exec((err,project)=>{
                                        if(err) return res.send({err});
                                        else{
                                            const newRes = new Response({
                                            _id: new mongoose.Types.ObjectId(),
                                            desc: item.response,
                                            questionId: question._id,
                                            codebook: codebook._id
                                        }).save((err, response)=>{
                                            if(err) return res.send({err});
                                            else{
                                                Question.findByIdAndUpdate(question._id, { $push: { listOfResponses : response._id , codebook: codebook._id}},{ upsert: true, new: true }).
                                                exec((err,result)=>{
                                                    if(err) {return res.send({err:err})}
                                                });
                                                
                                            }
                                        })
                                    }
                                    })
                                    
                                }
                            })
                       });
                   }
                });
            }
        })
    });
    res.send({"successfully":"yes"})
})


module.exports = router;