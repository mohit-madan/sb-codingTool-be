const mongoose = require('mongoose');
const Response = require('./response.model');
const Codebook = require('./codebook.model');
const Category = require('./category.model');
const Codeword = require('./codeword.model');

const questionSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    desc: String, 
    listOfResponses:[{type: mongoose.Schema.Types.ObjectId, ref: 'Response'}],
    resOfCoded: {type:Number, default: 0},
    //codebook relative Quetion
    codebook:{type: mongoose.Schema.Types.ObjectId, ref: 'Codebook'},
    structure:{type: mongoose.Schema.Types.ObjectId, ref: 'Category'}
});


const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);
module.exports = Question;
