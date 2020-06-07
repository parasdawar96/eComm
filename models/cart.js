const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const cart = new Schema({
    products: Array,
    cartSummary : Object,
    userId:
        { type: Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Cart', cart, "carts_eComm");


