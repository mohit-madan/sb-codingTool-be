const User = require('../models/user.model');
const Project = require('../models/project.model');
const Question = require('../models/question.model');
const Response = require('../models/response.model');
const STATUS_CODE = require('../statusCode')
const RESPONSE_MESSAGE = require('../responseMessage')
const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_ID,
    secretAccessKey: process.env.AWS_ACCESS_SECRET
 });

module.exports ={
    createProject: (req,res)=>{
        const {name, desc, key } = req.body;
        const newProject = new Project({
            _id: new mongoose.Types.ObjectId(),
            name: name,
            desc: desc,
            docKey: key
        }).save((err, project)=>{
            if(err){
                res.status(STATUS_CODE.ServerError).send({err:err});
            }else{
                //there add project._id to user project list then send back response
                User.findByIdAndUpdate(req.user._id, { $push: { projects : project._id }},{ upsert: true, new: true }).
                exec(async(err, user)=>{
                    if(err){
                       res.status(STATUS_CODE.ServerError).send({err:err});
                    }else{
                        //here fetch data from document file (question, [respones]) and store to database
                        const formate = key.split('.');
                        if(data[data.length - 1] === 'csv'){
                            const params ={
                                Bucket: process.env.AWS_DOCUMENT_BUCKET,
                                Key: key
                            }
                            s3.getObject(params, async(err,result) => {
                                if(err){
                                    res.send({err});
                                }else{
                                    const data = result.Body.toString("utf8").split('\r\n');
                                    const newQuestion = new Question({
                                        _id: new mongoose.Types.ObjectId(),
                                        desc: data[0],
                                    }).save(async (err, question) => {
                                        Project.findByIdAndUpdate(project._id, { $push: { listOfQuestion : question._id }},{ upsert: true, new: true }).
                                        exec((err, project)=>{
                                        if(err){
                                            return res.send({err:err});
                                        }else{
                                            let i = 1;
                                            for( i ; i <data.length-1;i++){
                                                const newResponse = new Response({
                                                    _id: new mongoose.Types.ObjectId(),
                                                    resNum: i,
                                                    desc: data[i],
                                                    length: data[i].length,
                                                    questionId : question._id
                                                }).save((err, response) => {
                                                    if(err){
                                                        res.send({err});
                                                    }else{
                                                        Question.findByIdAndUpdate(question._id, { $push: { listOfResponses : response._id }},{ upsert: true, new: true }).
                                                        exec((err,result)=>{
                                                            if(err) {return res.send({err:err})}
                                                        });
                                                    }
                                                })
                                            }
                                            if(i == data.length-1){
                                                res.status(STATUS_CODE.Created).send({message: RESPONSE_MESSAGE.projectCreated, projectId: project._id });
                                            }
                                        }
                                    });
                                    })
                                }
                            })
                        }else{
                            res.send({message: 'only .csv file logic implement'});
                        }
                    }
                }); 
            }
        })
    },

    projectDetails: (req, res) => {
        const id = req.body.id;
        Project.findById(id, (err, project)=>{
            if(err){
                res.status(STATUS_CODE.ServerError).send({err:err});
             }else{
                res.status(STATUS_CODE.Ok).send({project: project });
             }
        }) 
    }
}