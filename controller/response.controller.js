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

function ASC( a, b ) {
    if ( a.desc < b.desc ){
      return -1;
    }else{
      return 1;
    }
}

function DESC( a, b ) {
    if ( a.desc >  b.desc ){
      return -1;
    }else{
      return 1;
    }
}

const fiterByLengthAscOrder = async(questionId, result)=>{
        const data = await result.listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.sort((a, b) => parseFloat(a.length) -parseFloat(b.length));
        return data.map(({resNum, desc, length, codewords})=>({resNum, desc, length, codewords}));
}

const fiterByLengthDescOrder = async(questionId, result)=>{
    const data = await result.listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.sort((a, b) => parseFloat(b.length) - parseFloat(a.length));
    return data.map(({resNum, desc, length, codewords})=>({resNum, desc, length, codewords}));
}

const fiterByResponseAscOrder = async(questionId, result)=>{
    const data = await result.listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.sort(ASC);
    return data.map(({resNum, desc, length, codewords})=>({resNum, desc, length, codewords}));
}

const fiterByResponseDescOrder = async(questionId, result)=>{
    const data = await result.listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.sort(DESC);
    return data.map(({resNum, desc, length, codewords})=>({resNum, desc, length, codewords}));
}

const fiterByResponsePatternMatch = async(questionId, pattern, result)=>{
    return result.listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.filter(({resNum, desc, length, codewords})=>{
        pattern = pattern.toLowerCase();
        if(desc.toLowerCase().indexOf(pattern) != -1){
            return true;
        }else return false;
    }).map(({resNum, desc, length, codewords, fIndex, lIndex})=>{
        pattern = pattern.toLowerCase();
        fIndex = desc.toLowerCase().indexOf(pattern);
        lIndex = fIndex + pattern.length-1;
        return {resNum, desc, length, codewords, fIndex, lIndex};
    });
}

const fiterByResponsePatternExactMatch = async(questionId, pattern, result)=>{
    return result.listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.filter(({resNum, desc, length, codewords})=>{
    var regExp = new RegExp("^" + pattern + "$", 'i'); 
       if(desc.search(regExp)!=-1){
         return true;
       }else return false;
    }).map(({resNum, desc, length, codewords})=>{
       return {resNum, desc, length, codewords};
    })
}

const fiterByResponseOnCodewordMatch = async(questionId, codeword, result)=>{
    return result.listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.filter(({resNum, desc, length, codewords})=>{
    var regExp = new RegExp("^" + codeword + "$", 'i'); 
       if(codewords.length>0){
        codewords.map(it=>{
            if( it.tag.search(regExp)!=-1) return true;
        })
       }
       return false;
    }).map(({resNum, desc, length, codewords})=>{
       return {resNum, desc, length, codewords};
    })
}

const fiterByResponseWhichHaveNotAnyCodeword = async(questionId, codeword, result)=>{
    return result.listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.filter(({resNum, desc, length, codewords})=>{
        if(codewords.length===0){
            return true
        }
        return false;
    }).map(({resNum, desc, length, codewords})=>{
           return {resNum, desc, length, codewords};
    })
}


    

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
        });
    },

    filterResponse : (req, res)=>{
        const {projectId, questionId, filters} = req.body;
        const {pageNumber, limit} = req.params;
        if(pageNumber==undefined) pageNumber = 1;
        if(limit==undefined) limit = 10;
        const start = (pageNumber-1)*limit;
        client.get(`${projectId}`,async (err, data) =>{
            if(err){
                res.send({err});
            }else{
                if(data){
                    console.log("fetch data from cache");
                    let result = await JSON.parse(data);
                    const promises =filters.map(async iterate=>{
                        if(iterate.filter === 1){ //sort By Response Base On Length Asc Order
                            result = await fiterByLengthAscOrder(questionId, result);
                        }else if(iterate.filter ===2){ //sort By Response Base On Length Asc Order
                            result = await fiterByLengthDescOrder(questionId, result);  
                        }else if(iterate.filter ===3){ //sort By Response Base On Alphabet Asc Order
                            result = await fiterByResponseAscOrder(questionId, result);
                        }else if(iterate.filter ===4){ //sort By Response Base On Alphabet Desc Order
                            result = await fiterByResponseDescOrder(questionId, result);
                        }else if(iterate.filter ===5){ //sort By Response Base On Pattern Including
                            result = await fiterByResponsePatternMatch(questionId, iterate.pattern, result);
                        }else if(iterate.filter ===6){ //sort By Response Base On ExactPattern Match
                            result = await fiterByResponsePatternExactMatch(questionId, iterate.pattern, result);
                        }else if(iterate.filter === 7){ //sort By Response Base On Codeword Match
                            result = await fiterByResponseOnCodewordMatch(questionId, iterate.codeword, result);
                        }else if(iterate.filter ===9) {// sort By Response Which Have Not Any Codeword
                            result = await fiterByResponseWhichHaveNotAnyCodeword(questionId, iterate._result);
                        }
                    });
                    await Promise.all(promises)
                    res.send(result.slice(start, Number(start)+Number(limit)));
                }else{
                    console.log("load data from database");
                    await Project.findById(projectId).
                        populate({ path: 'listOfQuestion', model: Question,
                        populate:
                            {
                                path: 'listOfResponses', 
                                model:Response,
                                options: { sort: { 'resNum': 'asc' }},
                                populate:{path: 'codewords', model: Codeword}
                            }
                        }).exec(async(err, result) => {
                            if(err){
                                res.send({err:err});
                            }else{
                                console.log("load data from database : " + result);
                                client.setex(`${projectId}`,cacheTime, JSON.stringify(result));
                                const promises =filters.map(async iterate=>{
                                    if(iterate.filter === 1){ //sort By Response Base On Length Asc Order
                                        result = await fiterByLengthAscOrder(questionId, result);
                                    }else if(iterate.filter ===2){ //sort By Response Base On Length Asc Order
                                        result = await fiterByLengthDescOrder(questionId, result);  
                                    }else if(iterate.filter ===3){ //sort By Response Base On Alphabet Asc Order
                                        result = await fiterByResponseAscOrder(questionId, result);
                                    }else if(iterate.filter ===4){ //sort By Response Base On Alphabet Desc Order
                                        result = await fiterByResponseDescOrder(questionId, result);
                                    }else if(iterate.filter ===5){ //sort By Response Base On Pattern Including
                                        result = await fiterByResponsePatternMatch(questionId, pattern, result);
                                    }else if(iterate.filter ===6){ //sort By Response Base On ExactPattern Match
                                        result = await fiterByResponsePatternExactMatch(questionId, iterate.pattern, result);
                                    }else if(iterate.filter === 7){ //sort By Response Base On Codeword Match
                                        result = await fiterByResponseOnCodewordMatch(questionId, iterate.codeword, result);
                                    }else if(iterate.filter ===9) {// sort By Response Which Have Not Any Codeword
                                        result = await fiterByResponseWhichHaveNotAnyCodeword(questionId, iterate._result);
                                    }
                                });
                                await Promise.all(promises)
                                res.send(result.slice(start, Number(start)+Number(limit)));
                                
                            }
                    }); 
                }
            }
        });
    }
    // const sortData = await JSON.parse(data).listOfQuestion.find(ele=>ele._id==questionId).listOfResponses.filter(ele=>ele.length>=min && ele.length<=max);
   
}