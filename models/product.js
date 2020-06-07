const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const product = new Schema({
    name:String,
    price:Number,
    discountedPrice:Number,
    picture:String,
    discount:Number,
    description:String,
    category:String,
    brand:String,
    size:Object,
    quantity:Number,
    gender:String,
    color:String,
    pattern:String,
    type:String,
    productId:Number
});

module.exports = mongoose.model('Product',product,"products_eComm");


