const mongoose = require('mongoose');
const {Codebook} = require('./model.codebook');

const responseSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    desc: String,
    translatedDesc: String,
    length: Number,
    lang: String, 
    codebook:{type: mongoose.Schema.Types.ObjectId, ref: 'Codebook'}//codewords=>list of string
});


const Response = mongoose.models.Response || mongoose.model('Response', responseSchema);
module.exports = Response;
