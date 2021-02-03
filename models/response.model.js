const mongoose = require('mongoose');
const {Codebook} = require('./codebook.model');

const responseSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    desc: String,
    translatedDesc: String,
    lang: {type: String, Default: 'English'},
    questionId:mongoose.Types.ObjectId,
    codebook:{type: mongoose.Schema.Types.ObjectId, ref: 'Codebook'} 
});


const Response = mongoose.models.Response || mongoose.model('Response', responseSchema);
module.exports = Response;
