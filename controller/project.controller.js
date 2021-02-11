const User = require('../models/user.model');
const Project = require('../models/project.model');
const Question = require('../models/question.model');
const Response = require('../models/response.model');
const STATUS_CODE = require('../statusCode')
const logger = require('../logger')
const RESPONSE_MESSAGE = require('../responseMessage')
const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_ID,
    secretAccessKey: process.env.AWS_ACCESS_SECRET
 });

module.exports ={
    createProject: (req,res)=>{
        const {name, desc, key, coloumns, industry, type, tags} = req.body;
        const newProject = new Project({
            _id: new mongoose.Types.ObjectId(),
            name: name,
            desc: desc,
            docKey: key,
           industry: industry,
           type: type,
           tags: tags,
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
                        if(formate[formate.length - 1] === 'csv'){
                            const params ={
                                Bucket: process.env.AWS_DOCUMENT_BUCKET,
                                Key: key
                            }
                            s3.getObject(params, async(err,result) => {
                                if(err){
                                    res.status(STATUS_CODE.ServerError).send({err});
                                }else{
                                    const data = result.Body.toString("utf8").split('\r\n');
                                    let row = [];
                                    const promises = await coloumns.map(ele=>{
                                        const newQuestion = new Question({
                                            _id: new mongoose.Types.ObjectId(),
                                             desc: ele.question,
                                        }).save((err, question)=>{
                                            if(err){
                                                return res.status(STATUS_CODE.ServerError).send({err:err});
                                            }else{
                                                Project.findByIdAndUpdate(project._id, { $push: { listOfQuestion : question._id }},{ upsert: true, new: true }).
                                                exec((err, project)=>{
                                                    if(err){
                                                        return res.status(STATUS_CODE.ServerError).send({err:err});
                                                    }else{
                                                        let resNum = 0;
                                                        for(let i =1; i < data.length; i++){
                                                            row = data[i].split(',');
                                                            if( row[ele.coloumn] === undefined ||  row[ele.coloumn] =='' || row[ele.coloumn]=='\r\n'){
                                                                console.log(' ');
                                                            }else{
                                                                resNum++;
                                                                const newResponse = new Response({
                                                                    _id: new mongoose.Types.ObjectId(),
                                                                    resNum: resNum,
                                                                    desc: row[ele.coloumn],
                                                                    length: String(row[ele.coloumn]).length,
                                                                    questionId : question._id
                                                                }).save((err, response) => {
                                                                if(err){
                                                                    res.status(STATUS_CODE.ServerError).send({err});
                                                                }else{
                                                                    Question.findByIdAndUpdate(question._id, { $push: { listOfResponses : response._id }},{ upsert: true, new: true }).
                                                                    exec((err,result)=>{
                                                                        if(err) {return res.status(STATUS_CODE.ServerError).send({err:err})}
                                                                    });
                                                                }
                                                                }) 
                                                            }
                                                        }
                                                    }
                                                });
                                            }
                                        });

                                    })
                                    await Promise.all(promises).then(()=>
                                       res.status(STATUS_CODE.Created).send({message: RESPONSE_MESSAGE.projectCreated, projectId: project._id })
                                    )
                                    
                                }//eles body finish
                            })
                        }else{
                            res.status(STATUS_CODE.Ok).send({message: 'only .csv file logic implement'});
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
    },

    userSearch : async (req, res) => {
        const query = req.body.userQuery;
        if(query!==''){
            await User.find({
                $and:[{verified: true},
                    { $or:[
                        {name: { "$regex": query, "$options": 'i' }},
                        {email: { "$regex": query, "$options": 'i' }}
                    ]}]
            }, (err,users)=> { 
                    if(err){
                        logger.error(err);
                    }else{
                        res.status(STATUS_CODE.Ok).send(users);
                    }
                }
            );
        }else{
            res.status(STATUS_CODE.Ok).send(""); 
        }
    }
}