const Project =  require('../models/model.project');
const User = require('../models/model.user');
const mongoose = require('mongoose');
const STATUS_CODE = require('../statusCode')
const RESPONSE_MESSAGE = require('../responseMessage')

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
                exec((err, user)=>{
                   if(err){
                      res.status(STATUS_CODE.ServerError).send({err:err});
                   }else{
                      res.status(STATUS_CODE.Created).send({message: RESPONSE_MESSAGE.projectCreated, project:project});
                   }
                });
            }
        });
    },
    projectDetails: (req, res) => {
        const id = req.body.id;
        Project.findById(id).
        exec((err, project)=>{
            if(err){
                res.status(STATUS_CODE.ServerError).send({err:err});
            }else{
                res.status(STATUS_CODE.Ok).send({project:project});
            }
        });
    }
}