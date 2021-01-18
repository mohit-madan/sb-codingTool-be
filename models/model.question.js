const mongoose = require('mongoose');
const {Response} = require('./model.response');
const {Codebook} = require('./model.codebook');

const questionSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    desc: String, 
    listOfResponses:[{type: mongoose.Schema.Types.ObjectId, ref: 'Response'}],
    percentageOfCoded: Number,
    //mini codebook relative Quetion
    codebook:{type: mongoose.Schema.Types.ObjectId, ref: 'Codebook'}
});


const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);
module.exports = Question;
