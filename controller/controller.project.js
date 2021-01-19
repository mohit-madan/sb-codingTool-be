const Project =  require('../models/model.project');
const User = require('../models/model.user');
const mongoose = require('mongoose');

module.exports ={
    createProject: (req,res)=>{
        const {name, desc, docLink } = req.body;
        const newProject = new Project({
            _id: new mongoose.Types.ObjectId(),
            name: name,
            desc: desc,
            docLink: docLink
        }).save((err, project)=>{
            if(err){
                res.status('500').send({err:err});
            }else{
                //there add project._id to user project list then send back response
                // User.findByIdAndUpdate(req.user._id { $push: { projects : project._id }},{ upsert: true, new: true }).
                // exec((err, user)=>{
                //    if(err){
                //       res.status('500').send({err:err});
                //    }else{
                      res.status('201').send({message:'Project submit successfully', project:project});
                //    }
                // });
            }
        });
    },
    projectDetails: (req, res) => {
        const id = req.body.id;
        Project.findById(id).
        exec((err, project)=>{
            if(err){
                res.status('500').send({err:err});
            }else{
                res.status('200').send({project:project});
            }
        });
    }
}