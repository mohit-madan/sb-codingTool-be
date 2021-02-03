const mongoose = require('mongoose');

const codebookSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    projectId: mongoose.Types.ObjectId,
    questionId: mongoose.Types.ObjectId,
    codeword: String,
    length: Number,
});


const Codebook = mongoose.models.Codebook|| mongoose.model('Codebook', codebookSchema);
module.exports = Codebook;
