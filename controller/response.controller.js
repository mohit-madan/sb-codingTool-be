const STATUS_CODE = require('../statusCode');
const Project = require('../models/project.model');
const Question = require('../models/question.model');
const Response = require('../models/response.model');
const Codebook = require('../models/codebook.model');
const {cacheTime} = require('../constant');
//initialize cache
const REDIS_PORT = process.env.PORT || 6379 ;
const redis = require('redis');
const client = redis.createClient(REDIS_PORT);
client.on('error', err => console.error(err));



module.exports = {

    getResponse: (req, res)=>{
        const id = req.body.projectId;
        const questionId = req.body.questionId;
        const {pageNumber, limit} = req.params;
        if(pageNumber==undefined) pageNumber = 1;
        if(limit==undefined) limit = 10;
        const start = (pageNumber-1)*limit;
        client.get(`${id}`,async (err, data) =>{
            if(err){
                res.send({err});
            }else{
                if(data){
                    console.log("fetch data from cache");
                    res.send(JSON.parse(data).listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.slice(start, start+limit));
                }else{
                    console.log("load data from database");
                    await Project.findById(id).
                        populate({ path: 'listOfQuestion', model: Question,
                        populate:[
                            {
                                path: 'listOfResponses', 
                                model:Response,
                                populate:{path: 'codebook', model: Codebook}
                            },
                            {
                                path:"codebook",
                                model:Codebook
                            }
                            ]
                        }).exec((err, data) => {
                            if(err){
                                res.send({err:err});
                            }else{
                                console.log("load data from database : " + data);
                                client.setex(`${id}`,cacheTime, JSON.stringify(data));
                                res.send(data.listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.slice(start, start+limit));
                            }
                    }); 
                }
            }
        }) 
    },


    sortByLength:(req, res)=> {
        const id = req.body.projectId;
        const questionId = req.body.questionId;
        const {min, max} = req.params;
        if(min === undefined || min < 0) min = 0;
        if(max === undefined || max > 2147483647) max = 2147483647;
        client.get(`${id}`, async (err, data) => {
            if(err){
                res.send({err});
            }else{
                if(data){
                    console.log("fetch data from cache");
                    const sortData = await JSON.parse(data).listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.filter(ele=>ele.codebook.length>=min && ele.codebook.length<=max);
                    res.send(sortData);
                }else{
                    console.log("load data from database");
                    await Project.findById(id).
                        populate({ path: 'listOfQuestion', model: Question,
                        populate:[
                            {
                                path: 'listOfResponses', 
                                model:Response,
                                populate:{path: 'codebook', model: Codebook}
                            },
                            {
                                path:"codebook",
                                model:Codebook
                            }
                            ]
                        }).exec((err, data) => {
                            if(err){
                                res.send({err:err});
                            }else{
                                console.log("load data from database : " + data);
                                client.setex(`${id}`,cacheTime, JSON.stringify(data));
                                res.send(data.listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.filter(ele=>ele.codebook.length>=min && ele.codebook.length<=max));
                            }
                    }); 
                }
            }

        })
    },


    searchByCodeWord:(req, res)=>{
        const id = req.body.projectId;
        const questionId = req.body.questionId;
        const pattern = req.params.pattern; 
        client.get(`${id}`, async (err, data) => {
            if(err){
                res.send({err});
            }else{
                if(data){
                    console.log("fetch data from cache");
                    const sortData = await JSON.parse(data).listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.filter(ele=>!ele.codebook.codeword.search(new RegExp(pattern, "i")));
                    res.send(sortData);
                }else{
                    console.log("load data from database");
                    await Project.findById(id).
                        populate({ path: 'listOfQuestion', model: Question,
                        populate:[
                            {
                                path: 'listOfResponses', 
                                model:Response,
                                populate:{path: 'codebook', model: Codebook}
                            },
                            {
                                path:"codebook",
                                model:Codebook
                            }
                            ]
                        }).exec((err, data) => {
                            if(err){
                                res.send({err:err});
                            }else{
                                console.log("load data from database : " + data);
                                client.setex(`${id}`,cacheTime, JSON.stringify(data));
                                res.send(data.listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.filter(ele=>!ele.codebook.codeword.search(new RegExp(pattern, "i"))));
                            }
                    }); 
                }
            }
        })   
    }

}