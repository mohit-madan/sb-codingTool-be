const db = require('../mysql/mysqlDB');
const STATUS_CODE = require('../statusCode')

module.exports = {
    getResponse: (req, res)=>{
        const questionId = req.body.questionId;
        const {pageNumber, limit} = req.params;
        const totalResponse = 0;
        if(pageNumber==undefined) pageNumber = 1;
        if(limit==undefined) limit = 10;

        const countQuery = `SELECT COUNT(responses.id) as total FROM  questions INNER JOIN responses WHERE id='${questionId}'`;
        db.query(countQuery, (err, result)=>{
            if(err){
                res.status(STATUS_CODE.ServerError).send({err:err});
            }else{
                totalResponse = result[0].total;
            }
        });
        const totalNumOfPage = Math.ceil(totalResponse/limit);
        const offset = limit*(pageNumber-1);
        const queryString = `SELECT responses.description FROM questions INNER JOIN responses WHERE id='${questionId}'  LIMIT '${limit}' OFFSET '${offset}'`;
        db.query(queryString, (err, result)=>{
            if(err){
                res.status(STATUS_CODE.ServerError).send({err:err});
            }else{
                res.status(STATUS_CODE.Ok).send({ project:result, totalNumOfPage, currentPage: pageNumber, limit: limit});
            }
        });
       
    }
}