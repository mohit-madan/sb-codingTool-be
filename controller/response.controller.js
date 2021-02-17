const STATUS_CODE = require('../statusCode');
const logger = require('../logger');('../statusCode')
const Project = require('../models/project.model');
const Question = require('../models/question.model');
const Response = require('../models/response.model');
const Codeword = require('../models/codeword.model');
const { cacheTimeFullProject, cacheTimeForFilter } = require('../constant');
//initialize cache
const REDIS_PORT = process.env.PORT || 6379;
const redis = require('redis');
const client = redis.createClient(REDIS_PORT);
client.on('error', err => console.error(err));

function ASC(a, b) {
    if (a.desc < b.desc) {
        return -1;
    } else {
        return 1;
    }
}

function DESC(a, b) {
    if (a.desc > b.desc) {
        return -1;
    } else {
        return 1;
    }
}

function getIndicesOf(searchStr, str) {
    var startIndex = 0, index, indices = [];

    str = str.toLowerCase();
    searchStr = searchStr.toLowerCase();

    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        const fIndex = index;
        const lIndex = index + searchStr.length - 1;
        indices.push({ fIndex: fIndex, lIndex: lIndex, pattern: searchStr });
        startIndex = index + searchStr.length;
    }
    return indices;
}

const fiterByLengthAscOrder = async (result) => {
    return await result.sort((a, b) => parseFloat(a.length) - parseFloat(b.length));
}

const fiterByLengthDescOrder = async (result) => {
    return await result.sort((a, b) => parseFloat(b.length) - parseFloat(a.length));
}

const fiterByResponseAscOrder = async (result) => {
    return await result.sort(ASC);
}

const fiterByResponseDescOrder = async (result) => {
    return await result.sort(DESC);
}

const fiterByResponsePatternMatch = async (pattern, result) => {
    return await result.filter(({ resNum, desc, length, codewords, indices }) => {
        pattern = pattern.toLowerCase();
        if (desc.toLowerCase().indexOf(pattern) != -1) {
            return true;
        } else return false;
    }).map(({ resNum, desc, length, codewords, indices }) => {
        if (indices !== undefined) {
            indices = [...indices, ...getIndicesOf(pattern, desc)];
        } else {
            indices = [...getIndicesOf(pattern, desc)];
        }
        return { resNum, desc, length, codewords, indices };
    });
}

const fiterByResponsePatternExactMatch = async (pattern, result) => {
    return await result.filter(({ resNum, desc, length, codewords }) => {
        var regExp = new RegExp("^" + pattern + "$", 'i');
        if (desc.search(regExp) != -1) {
            return true;
        } else return false;
    }).map(({ resNum, desc, length, codewords }) => {
        return { resNum, desc, length, codewords };
    })
}

const fiterByResponseOnCodewordMatch = async (codeword, result) => {
    return await result.filter(({ resNum, desc, length, codewords }) => {
        var regExp = new RegExp("^" + codeword + "$", 'i');
        if (codewords.length > 0) {
            codewords.map(it => {
                if (it.tag.search(regExp) != -1) return true; //match return true
            })
        }
        return false; // return false codewodrs empty
    }).map(({ resNum, desc, length, codewords }) => {
        return { resNum, desc, length, codewords };
    })
}

const fiterByResponseOnCodewordDisMatch = async (codeword, result) => {
    return await result.filter(({ resNum, desc, length, codewords }) => {
        var regExp = new RegExp("^" + codeword + "$", 'i');
        if (codewords.length > 0) {
            codewords.map(it => {
                if (it.tag.search(regExp) != -1) return false; //match return false
            })
            return true; //given codeword not exists in all codewords return true
        }
        return false; // return false codewodrs empty
    }).map(({ resNum, desc, length, codewords }) => {
        return { resNum, desc, length, codewords };
    })
}

const fiterByResponseWhichHaveNotAnyCodeword = async (result) => {
    return await result.filter(({ resNum, desc, length, codewords }) => {
        if (codewords.length === 0) {
            return true
        }
        return false;
    }).map(({ resNum, desc, length, codewords }) => {
        return { resNum, desc, length, codewords };
    })
}

const applyFilter = async (result, operators) => {
    for (let i = 0; i < operators.length; i++) {
        switch (operators[i].operator){
            case 1:  //sort By Response Base On Length Asc Order
                result = await fiterByLengthAscOrder(result);
                break;
            case 2:  //sort By Response Base On Length Asc Order
                result = await fiterByLengthDescOrder(result);
                break;
            case 3: //sort By Response Base On Alphabet Asc Order
                result = await fiterByResponseAscOrder(result);
                break;
            case 4: //sort By Response Base On Alphabet Desc Order
                result = await fiterByResponseDescOrder(result);
                break;
            case 5:  //sort By Response Base On Pattern Including 
                result = await fiterByResponsePatternMatch(operators[i].pattern, result); 
                break;
            case 6:  //sort By Response Base On ExactPattern Match
                result = await fiterByResponsePatternExactMatch(operators[i].pattern, result);
                break;
            case 7:  //sort By Response Base On Codeword Match
                result = await fiterByResponseOnCodewordMatch(operators[i].codeword, result);
                break;
            case 8:  //sort By Response Base On Codeword Match
                result = await fiterByResponseOnCodewordDisMatch(operators[i].codeword, result);  
                break;
            case 9: // sort By Response Which Have Not Any Codeword
                result = await fiterByResponseWhichHaveNotAnyCodeword(result);
                break;
            default: //sort By Response Base On Length Asc Order
                result = await fiterByLengthAscOrder(result);            

        }
    }
    return result;
}



module.exports = {

    getResponse: (req, res) => {
        const id = req.body.projectId;
        const questions = req.body.questions;
        const { pageNumber, limit } = req.params;
        if (pageNumber == undefined) pageNumber = 1;
        if (limit == undefined) limit = 10;
        const start = (pageNumber - 1) * limit;
        client.get(`${id}`, async (err, data) => {
            if (err) {
                res.status(STATUS_CODE.ServerError).send({ err });
            } else {
                if (data) {
                    logger.info("fetch data from cache");
                    const result = await JSON.parse(data).listOfQuestion
                        .filter(ele => {
                            for (let i = 0; i < questions.length; i++) {
                                if (questions[i].questionId == ele._id)
                                    return true;
                            }
                            return false;
                        }).map(ele => ele.listOfResponses);
                    let response = [];
                    for (let i = 0; i < result.length; i++) {
                        response = [...response, ...result[i]];
                    }
                    res.status(STATUS_CODE.Ok).send(response.slice(start, Number(start) + Number(limit))
                        .map(({ resNum, desc, length, codewords }) => {
                            return { resNum, desc, length, codewords };
                        })
                    );
                } else {
                    logger.info("load data from database");
                    await Project.findById(id).
                        populate({
                            path: 'listOfQuestion', model: Question,
                            populate:
                            {
                                path: 'listOfResponses',
                                model: Response,
                                options: { sort: { 'resNum': 'asc' } },
                                populate: { path: 'codewords', model: Codeword }
                            }
                        }).exec(async (err, data) => {
                            if (err) {
                                res.status(STATUS_CODE.ServerError).send({ err: err });
                            } else {
                                client.setex(`${id}`, cacheTimeFullProject, JSON.stringify(data));
                                const result = await data.listOfQuestion
                                    .filter(ele => {
                                        for (let i = 0; i < questions.length; i++) {
                                            if (questions[i].questionId == ele._id) return true;
                                        }
                                        return false;
                                    }).map(ele => ele.listOfResponses);
                                let response = [];
                                for (let i = 0; i < result.length; i++) {
                                    response = [...response, ...result[i]];
                                }
                                res.status(STATUS_CODE.Ok).send(response.slice(start, Number(start) + Number(limit))
                                    .map(({ resNum, desc, length, codewords }) => {
                                        return { resNum, desc, length, codewords };
                                    })
                                );
                            }
                        });
                }
            }
        });
    },

    operatorResponse: (req, res) => {
        const { projectId, questions, operators } = req.body;
        const { pageNumber, limit } = req.params;
        if (pageNumber == undefined) pageNumber = 1;
        if (limit == undefined) limit = 10;
        const start = (pageNumber - 1) * limit;
        client.get(`${JSON.stringify(req.body)}`, (err, data) => {
            if (err) res.status(STATUS_CODE.ServerError).send(err);
            else {
                if (data) {
                    let totalRes;
                    logger.info('read data from operator cache');
                    client.get(`${projectId}`, async (err, result) => {
                        if (result) {
                            result = await JSON.parse(result).listOfQuestion
                                .filter(ele => {
                                    for (let i = 0; i < questions.length; i++) {
                                        if (questions[i].questionId == ele._id) return true;
                                    }
                                    return false;
                                }).map(ele => ele.listOfResponses);
                            let response = [];
                            for (let i = 0; i < result.length; i++) {
                                response = [...response, ...result[i]];
                            }
                            totalRes = response.length;
                            res.status(STATUS_CODE.Ok).send({
                                result: JSON.parse(data).slice(start, Number(start) + Number(limit)),
                                operatorRes: JSON.parse(data).length,
                                totalRes,
                            });
                        } else {
                            res.status(STATUS_CODE.ServerError).send({ err: "cache timeout Error" });
                        }
                    });

                }
                else {
                    client.get(`${projectId}`, async (err, data) => {
                        if (err) {
                            res.status(STATUS_CODE.ServerError).send({ err });
                        } else {
                            if (data) {
                                logger.info("fetch data from cache");
                                let result = await JSON.parse(data).listOfQuestion
                                    .filter(ele => {
                                        for (let i = 0; i < questions.length; i++) {
                                            if (questions[i].questionId == ele._id) return true;
                                        }
                                        return false;
                                    }).map(ele => ele.listOfResponses);
                                let response = [];
                                for (let i = 0; i < result.length; i++) {
                                    response = [...response, ...result[i]];
                                }
                                result = response.map(({ resNum, desc, length, codewords }) => ({ resNum, desc, length, codewords }));
                                const totalRes = result.length;
                                const filter = applyFilter(result, operators);
                                filter.then((filtered) => {
                                    client.setex(`${JSON.stringify(req.body)}`, cacheTimeForFilter, JSON.stringify(filtered));
                                    res.status(STATUS_CODE.Ok).send({
                                        result: filtered.slice(start, Number(start) + Number(limit)),
                                        operatorRes: filtered.length,
                                        totalRes
                                    });
                                })


                            } else {
                                logger.info("load data from database");
                                await Project.findById(projectId).
                                    populate({
                                        path: 'listOfQuestion', model: Question,
                                        populate:
                                        {
                                            path: 'listOfResponses',
                                            model: Response,
                                            options: { sort: { 'resNum': 'asc' } },
                                            populate: { path: 'codewords', model: Codeword }
                                        }
                                    }).exec(async (err, data) => {
                                        if (err) {
                                            res.status(STATUS_CODE.ServerError).send({ err: err });
                                        } else {
                                            client.setex(`${projectId}`, cacheTimeFullProject, JSON.stringify(data));
                                            let result = await data.listOfQuestion
                                                .filter(ele => {
                                                    for (let i = 0; i < questions.length; i++) {
                                                        if (questions[i].questionId == ele._id) return true;
                                                    }
                                                    return false;
                                                }).map(ele => ele.listOfResponses);
                                            let response = [];
                                            for (let i = 0; i < result.length; i++) {
                                                response = [...response, ...result[i]];
                                            }
                                            result = response.map(({ resNum, desc, length, codewords }) => ({ resNum, desc, length, codewords }));
                                            const totalRes = result.length;
                                            const filter = applyFilter(result, operators);
                                            filter.then((filtered) => {
                                                client.setex(`${JSON.stringify(req.body)}`, cacheTimeForFilter, JSON.stringify(filtered));
                                                res.status(STATUS_CODE.Ok).send({
                                                    result: filtered.slice(start, Number(start) + Number(limit)),
                                                    operatorRes: filtered.length,
                                                    totalRes
                                                });
                                            })

                                        }
                                    });
                            }
                        }
                    });
                }
            }
        })
    },

    // addCodeword: (req, res) => {
    //     const {}
    // }

}