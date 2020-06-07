const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const order = new Schema({
    products: Array,
    address:Object,
    amount: Number,
    razorpay_order_id:String,
    razorpay_payment_id:String,
    razorpay_signature:String,
    purchase_date:Date,
    status:String,
    receipt:String,
    user_email:String,
    userId:
        { type: Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Order', order, "order_eComm");


