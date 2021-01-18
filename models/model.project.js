const mongoose = require('mongoose');
const {Question} = require('./model.question');
const {User} = require('./model.user');
const {Codebook} = require('./model.codebook');

const projectSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    name: String,
    desc: String, 
    listOfQuestion:[{type: mongoose.Schema.Types.ObjectId, ref: 'Question'}],
    CreationDate: Date,
    TotalNumRes: Number,
    CreatedBy:{type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    assignedTo:[{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    lang: String,
    //main codebook universal set of project (array of all codebook objects)
    listOfCodebook:[{type: mongoose.Schema.Types.ObjectId, ref: 'Codebook'}]
});


const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
module.exports = Project;
