const mongoose = require('mongoose');

const codewordSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    tag: String,
    active: { type:Boolean, default: true },
    resToAssigned:[{type: mongoose.Schema.Types.ObjectId, unique: true}]
});


const Codeword = mongoose.models.Codeword || mongoose.model('Codeword', codewordSchema);
module.exports = Codeword ;
