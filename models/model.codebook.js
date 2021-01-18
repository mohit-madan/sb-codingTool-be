const mongoose = require('mongoose');

const codebookSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    project_id: mongoose.Types.ObjectId,
    codeword: String
});


const Codebook = mongoose.models.Codebook|| mongoose.model('Codebook', codebookSchema);
module.exports = Codebook;
