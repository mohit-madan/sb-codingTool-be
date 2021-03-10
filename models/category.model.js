const mongoose = require('mongoose');
const MpathPlugin = require('mongoose-mpath');
const Codeword = require('./codeword.model');

const categorySchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    name: String,
    codewords: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Codeword' }]
});
// add plugin
categorySchema.plugin(MpathPlugin);

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
module.exports = Category;
