const User = require('../models/user.model');
const Project = require('../models/project.model');
const Question = require('../models/question.model');
const Response = require('../models/response.model');
const Codebook = require('../models/codebook.model');
const STATUS_CODE = require('../statusCode')
const logger = require('../logger')
const RESPONSE_MESSAGE = require('../responseMessage')
const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_ID,
    secretAccessKey: process.env.AWS_ACCESS_SECRET
});

const createCodebook = async () => {
    const newCodebook = new Codebook({
        _id: new mongoose.Types.ObjectId()
    });
    const codebook = await newCodebook.save()
        .then(codebook => codebook)
        .catch(err => {
            console.log("Error during create codebook");
            console.trace(err);
        });
    return codebook._id;
}

const createQuestion = async (desc, codebookId) => {
    const newQuestion = new Question({
        _id: new mongoose.Types.ObjectId(),
        desc: desc,
        codebook: codebookId
    });
    const question = await newQuestion.save()
        .then(question => question)
        .catch(err => {
            console.log("Error during create question");
            console.trace(err);
        });
    return question._id;
}

const fetchSomeResponse = async (data, questionNumber, questionId) => {
    let resNum = 0;
    let responseList = []
    let count = 0;
    return new Promise((resolve) => {
        data.forEach((cr) => {
            row = cr.split(',');
            count++;
            if (row[questionNumber] === undefined || row[questionNumber] == '' || row[questionNumber] == '\r\n') {
                console.log('');
            } else {
                resNum++;
                const response = {
                    _id: new mongoose.Types.ObjectId(),
                    resNum: resNum,
                    desc: row[questionNumber],
                    length: String(row[questionNumber]).length,
                    questionId: questionId
                }
                responseList.push(response);
            }
            if (count === data.length) {
                resolve();
            }
        });
    }).then(() => responseList).catch(err => console.log(err));
}
const saveResponse = async (data, coloumns, project) => {
    let count = 0;
    return new Promise(resolve => {
        coloumns.map(async ele => {
            const codebookId = await createCodebook();
            const questionId = await createQuestion(ele.question, codebookId);
            Project.findByIdAndUpdate(project._id, { $push: { listOfQuestion: questionId } }, { upsert: true, new: true })
                .exec((err, info) => {
                    if (err) console.log("Error during push question in project question list: ", err);
                })
            const responseArray = await fetchSomeResponse(data, ele.coloumn, questionId);
            Response.insertMany(responseArray)
                .then(async (doc) => {
                    const responseIds = await doc.map(ele => ele._id);
                    Question.findByIdAndUpdate(questionId, { $push: { listOfResponses: { $each: responseIds } } })
                        .exec((err, result) => {
                            if (err) console.log(err);
                            count++;
                            if (count === coloumns.length) {
                                resolve("Project is created successfully");
                            }
                        })
                })
                .catch((err) => console.log(err));
        });
    }).then((res) => res);
}

module.exports = {
    createProject: async (req, res) => {
        const { name, desc, key, coloumns, industry, type, tags } = req.body;
        const codebookId = await createCodebook();
        const newProject = new Project({
            _id: new mongoose.Types.ObjectId(),
            name: name,
            desc: desc,
            docKey: key,
            industry: industry,
            type: type,
            tags: tags,
            codebook: codebookId
        });
        const project = await newProject.save()
            .then(project => project)
            .catch(err => {
                console.log("Error during create project");
                console.trace(err);
            });
        //there add project._id to user project list then send back response
        await User.findByIdAndUpdate(req.user._id, { $push: { projects: project._id } }, { upsert: true, new: true })
            .then(() => {
                //here fetch data from document file (question, [respones]) and store to database
                const formate = key.split('.');
                if (formate[formate.length - 1] === 'csv') {
                    const params = {
                        Bucket: process.env.AWS_DOCUMENT_BUCKET,
                        Key: key
                    }
                    s3.getObject(params, async (err, result) => {
                        if (err) {
                            res.status(STATUS_CODE.ServerError).send({ err });
                        } else {
                            const data = result.Body.toString("utf8").split('\r\n');
                            await saveResponse(data.splice(1), coloumns, project._doc).then((results) => {
                                console.log( results);
                                res.status(STATUS_CODE.Ok).send({ message: RESPONSE_MESSAGE.projectCreated, projectId: project._id });
                            }).catch((err) => console.log(err));
                        }//eles body finish
                    })
                } else {
                    res.status(STATUS_CODE.Ok).send({ message: 'only .csv file logic implement' });
                }
            })
            .catch(err => res.status(STATUS_CODE.ServerError).send(err));
    },

    projectDetails: (req, res) => {
        const id = req.body.id;
        Project.findById(id, (err, project) => {
            if (err) {
                res.status(STATUS_CODE.ServerError).send({ err: err });
            } else {
                res.status(STATUS_CODE.Ok).send({ project: project });
            }
        })
    },

    questionCodebook: (req, res) => {
        const questionId = req.body.questionId;
        Question.findById(questionId).
            populate({
                path: 'codebook',
                model: 'Codebook',
                populate: {
                    path: 'codewords',
                    model: 'Codeword',
                    options: { sort: { 'key': 'asc' } },
                }
            }).exec((err, data) => {
                if (err) { res.status(STATUS_CODE.ServerError).send(err); }
                else {
                    res.status(STATUS_CODE.Ok).send({ codebook: data.codebook, });
                }
            })
    }
}
