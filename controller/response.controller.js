const db = require('../mysql/mysqlDB');
const STATUS_CODE = require('../statusCode')

module.exports = {
    getResponse: (req, res)=>{
        const questionId = req.body.questionId;
        const {pageNumber, limit} = req.params;
        const totalResponse = 0;
        if(pageNumber==undefined) pageNumber = 1;
        if(limit==undefined) limit = 10;

        const countQuery = `SELECT COUNT(responses.id) as total FROM  responses INNER JOIN questions WHERE questions_id=${questionId}`;
        db.query(countQuery, (err, result)=>{
            if(err){
                res.status(STATUS_CODE.ServerError).send({err:err});
            }else{
                totalResponse = result[0].total;
            }
        });
        const totalNumOfPage = Math.ceil(totalResponse/limit);
        const offset = limit*(pageNumber-1);
        const queryString = `SELECT responses.description FROM responses INNER JOIN questions WHERE questions_id=${questionId}  LIMIT ${limit} OFFSET ${offset}`;
        db.query(queryString, (err, result)=>{
            if(err){
                res.status(STATUS_CODE.ServerError).send({err:err});
            }else{
                res.status(STATUS_CODE.Ok).send({ project:result, totalNumOfPage, currentPage: pageNumber, limit: limit});
            }
        });  
    },
    //need pagination ???
    sortByLength:(req, res)=> {
        const questionId = req.body.questionId;
        const {min, max} = req.params;
        if(min === undefined || min < 0) min = 0;
        if(max === undefined || max > 2147483647) max = 2147483647;
        const queryString = `SELECT code_word FROM codebooks WHERE question_id=${questionId} AND length BETWEEN ${min} AND ${max}`;
        db.query(queryString, (err, result)=>{
            if(err){
                res.status(STATUS_CODE.ServerError).send({err:err});
            }else{
                res.status(STATUS_CODE.Ok).send({ result:result});
            }
        }); 
    },
    //need pagination ???
    searchByCodeWord:(req, res)=>{
        const questionId = req.body.questionId;
        const pattern = req.params.pattern; 
        const queryString = `SELECT code_word FROM codebooks WHERE question_id=${questionId} AND code_word LIKE '%${pattern}%' ORDER BY code_word ASC`;
        db.query(queryString, (err, result)=>{
            if(err){
                res.status(STATUS_CODE.ServerError).send({err:err});
            }else{
                res.status(STATUS_CODE.Ok).send({ result:result});
            }
        }); 
    }
}