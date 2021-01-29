const User = require('../models/user.model');
const db = require('../mysql/mysqlDB');
const STATUS_CODE = require('../statusCode')
const RESPONSE_MESSAGE = require('../responseMessage')

module.exports ={
    createProject: (req,res)=>{
        const {name, desc, key } = req.body;
        const queryString = `INSERT INTO projects (name, description, doc_key) VALUES ('${name}', '${desc}', '${key}')`;
        db.query(queryString, (err, project) => {
            if(err){
                res.status(STATUS_CODE.ServerError).send({err:err});
            }else{
                //there add project._id to user project list then send back response
                User.findByIdAndUpdate(req.user._id, { $push: { projects : project.insertId }},{ upsert: true, new: true }).
                exec((err, user)=>{
                   if(err){
                      res.status(STATUS_CODE.ServerError).send({err:err});
                   }else{
                      res.status(STATUS_CODE.Created).send({message: RESPONSE_MESSAGE.projectCreated, projectId:project.insertId});
                   }
                }); 
            }
        })
    },
    projectDetails: (req, res) => {
        const id = req.body.id;
        const queryString =`SELECT * FROM projects WHERE id=?`;
        db.query(queryString, [id], (err, project)=>{
            if(err){
                res.status(STATUS_CODE.ServerError).send({err:err});
            }else{
                res.status(STATUS_CODE.Ok).send({project:project});
            }

        })
    }
}