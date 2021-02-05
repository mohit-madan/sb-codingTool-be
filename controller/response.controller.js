const STATUS_CODE = require('../statusCode');
const Project = require('../models/project.model');
const Question = require('../models/question.model');
const Response = require('../models/response.model');
const Codeword = require('../models/codeword.model');
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
                    const result = await JSON.parse(data).listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.slice(start, Number(start)+Number(limit))
                    res.send(result.map(({resNum, desc, length, codewords})=>({resNum, desc, length, codewords})));
                }else{
                    console.log("load data from database");
                    await Project.findById(id).
                        populate({ path: 'listOfQuestion', model: Question,
                        populate:
                            {
                                path: 'listOfResponses', 
                                model:Response,
                                options: { sort: { 'resNum': 'asc' }},
                                populate:{path: 'codewords', model: Codeword}
                            }
                        }).exec(async(err, data) => {
                            if(err){
                                res.send({err:err});
                            }else{
                                console.log("load data from database : " + data);
                                client.setex(`${id}`,cacheTime, JSON.stringify(data));
                                const result = await data.listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.slice(start, Number(start)+Number(limit));
                                res.send(result.map(({resNum, desc, length, codewords})=>({resNum, desc, length, codewords})));
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
                    const sortData = await JSON.parse(data).listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.filter(ele=>ele.length>=min && ele.length<=max);
                    res.send(sortData.map(({resNum, desc, length, codewords})=>({resNum, desc, length, codewords})))
                }else{
                    console.log("load data from database");
                    await Project.findById(id).
                        populate({ path: 'listOfQuestion', model: Question,
                        populate:
                            {
                                path: 'listOfResponses', 
                                model:Response,
                                options: { sort: { 'resNum': 'asc' }},
                                populate:{path: 'codewords', model: Codeword}
                            }
                        }).exec((err, data) => {
                            if(err){
                                res.send({err:err});
                            }else{
                                console.log("load data from database : " + data);
                                client.setex(`${id}`,cacheTime, JSON.stringify(data));
                                res.send(data.listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.filter(ele=>ele.length>=min && ele.length<=max));
                                res.send(sortData.map(({resNum, desc, length, codewords})=>({resNum, desc, length, codewords})))
                            }
                    }); 
                }
            }

        })
    },

    searchByResponse:(req, res)=>{
        const id = req.body.projectId;
        const questionId = req.body.questionId;
        var pattern = req.params.pattern; 
        client.get(`${id}`, async (err, data) => {
            if(err){
                res.send({err});
            }else{
                if(data){
                    console.log("fetch data from cache");
                    const sortData = await JSON.parse(data).listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.filter(({resNum, desc, length, codewords})=>{
                        pattern = pattern.toLowerCase();
                        if(desc.toLowerCase().indexOf(pattern) != -1){
                            return true;
                        }else return false;
                    }).map(({resNum, desc, length, codewords, fIndex, lIndex})=>{
                        pattern = pattern.toLowerCase();
                        fIndex = desc.toLowerCase().indexOf(pattern);
                        lIndex = fIndex + pattern.length-1;
                        return {resNum, desc, length, codewords, fIndex, lIndex};
                    })
                    res.send(sortData)
                }else{
                    console.log("load data from database");
                    await Project.findById(id).
                        populate({ path: 'listOfQuestion', model: Question,
                        populate:
                            {
                                path: 'listOfResponses', 
                                model:Response,
                                options: { sort: { 'resNum': 'asc' }},
                                populate:{path: 'codewords', model: Codeword}
                            }
                        }).exec(async(err, data) => {
                            if(err){
                                res.send({err:err});
                            }else{
                                console.log("load data from database : " + data);
                                client.setex(`${id}`,cacheTime, JSON.stringify(data));
                                const sortData = await data.listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.filter(({resNum, desc, length, codewords})=>{
                                    pattern = pattern.toLowerCase();
                                    if(desc.toLowerCase().indexOf(pattern) != -1){
                                        return true;
                                    }else return false;
                                }).map(({resNum, desc, length, codewords, fIndex, lIndex})=>{
                                    pattern = pattern.toLowerCase();
                                    fIndex = desc.toLowerCase().indexOf(pattern);
                                    lIndex = fIndex + pattern.length-1;
                                    return {resNum, desc, length, codewords, fIndex, lIndex};
                                })
                                res.send(sortData)
                            }
                    }); 
                }
            }
        })   
    },

    
    searchByExactResponse:(req, res)=>{
        const id = req.body.projectId;
        const questionId = req.body.questionId;
        const pattern = req.params.pattern; 
        client.get(`${id}`, async (err, data) => {
            if(err){
                res.send({err});
            }else{
                if(data){
                    console.log("fetch data from cache");
                    const sortData = await JSON.parse(data).listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.filter(({resNum, desc, length, codewords})=>{
                        var regExp = new RegExp("^" + pattern + "$", 'i'); 
                        if(desc.search(regExp)!=-1){
                            return true;
                        }else return false;
                    }).map(({resNum, desc, length, codewords})=>{
                        return {resNum, desc, length, codewords};
                    })
                    res.send(sortData)
                }else{
                    console.log("load data from database");
                    await Project.findById(id).
                        populate({ path: 'listOfQuestion', model: Question,
                        populate:
                            {
                                path: 'listOfResponses', 
                                model:Response,
                                options: { sort: { 'resNum': 'asc' }},
                                populate:{path: 'codewords', model: Codeword}
                            }
                        }).exec(async(err, data) => {
                            if(err){
                                res.send({err:err});
                            }else{
                                console.log("load data from database : " + data);
                                client.setex(`${id}`,cacheTime, JSON.stringify(data));
                                const sortData = data.listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.filter(({resNum, desc, length, codewords})=>{
                                    var regExp = new RegExp("^" + pattern + "$", 'i'); 
                                    if(desc.search(regExp)!=-1){
                                        return true;
                                    }else return false;
                                }).map(({resNum, desc, length, codewords})=>{
                                    return {resNum, desc, length, codewords};
                                })
                                res.send(sortData)
                            }
                    }); 
                }
            }
        })   
    }

}