const mongoose = require('mongoose');
const {Question} = require('./question.model');
const {User} = require('./user.model');
const {Codebook} = require('./codebook.model');

const projectSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    name: String,
    desc: String, 
    industry:String,
    type: String,
    tags:[String],
    docKey:  { type: String, trim: true , required: true, unique: true },
    listOfQuestion:[{type: mongoose.Schema.Types.ObjectId, ref: 'Question'}],
    CreationDate: Date,
    CreatedBy:{type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    assignedTo:[{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    lang: {type: String, Default: 'English'},
    //array of codebook of question in the project 
    codebooks:[{type: mongoose.Schema.Types.ObjectId, ref: 'Codebook'}]
});


const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
module.exports = Project;
