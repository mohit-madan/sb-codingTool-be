const mongoose = require('mongoose');
const {Response} = require('./response.model');
const {Codebook} = require('./codebook.model');

const questionSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    desc: String, 
    listOfResponses:[{type: mongoose.Schema.Types.ObjectId, ref: 'Response'}],
    percentageOfCoded: Number,
    //mini codebook relative Quetion
    codebook:[{type: mongoose.Schema.Types.ObjectId, ref: 'Codebook'}]
});


const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);
module.exports = Question;
