const mongoose = require('mongoose');
const Order = require('../models/order');
const User = require('../models/user');
const Product = require('../models/product');
const Cart = require('../models/cart');
const razorPay_Instance = require('../RazorPay_SDK/payment').instance;
const RazorPay_Config = require('../RazorPay_SDK/payment').config;
const { v4: uuidv4 } = require('uuid');
const jsSha256 = require("js-sha256")
const sha256 = require('js-sha256').sha256;


async function checkUser(id) {
    let result = await User.findById(id);
    return result;
}

function verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature) {
    console.log("secret", RazorPay_Config.key_secret);
    console.log("razorpay sig", razorpay_signature);
    let generated_signature = sha256.hmac(RazorPay_Config.key_secret, razorpay_order_id + "|" + razorpay_payment_id);
    // console.log("@@", ss)
    //let generated_signature = Base64.stringify(sha256(razorpay_order_id + "|" + razorpay_payment_id, RazorPay_Config.key_secret));
    console.log("generated sig", generated_signature);
    if (generated_signature == razorpay_signature) {
        return true;
    }
    return false;
}

async function emptyUserCart(userId) {
   console.log("inside emptyUserCart userid",userId);
        let promise = new Promise((res, rej) => {
            let cartSummary= {
                total :0,
                discount:0,
                payable:0,
                shipping:0
            };
            let updateObj = {
                "products": [],
                "cartSummary": cartSummary,
            }
            console.log("updated cart Obj",updateObj);
            res(Cart.update({ "userId": userId },
                { $set: updateObj }))
        });
    return promise;
}

async function updateProductsInventory(productsArray) {
    let promiseArray = [];
    console.log("productsArray", productsArray)
    productsArray.forEach(element => {
        let promise = new Promise((res, rej) => {
            let size1 = "size." + element.size;
            let update = { $inc: {} };
            update.$inc["quantity"] = -1;
            update.$inc[`size.${element.size}`] = -1;
            console.log("increment object string", update);
            res(Product.updateOne({ "_id": element._id },
                update, { upsert: true }
            ));
        })
        promiseArray.push(promise);
    });
    return Promise.allSettled(promiseArray);
}


module.exports = {

    async purchase(req, res) {
        console.log("inside purchase api");
        const { products, address, purchase_amount, user_id, user_email } = req.body;
        let user = await checkUser(user_id);
        if (user) {


            var options = {
                amount: purchase_amount * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: uuidv4(),
                payment_capture: '0'
            };

            console.log("options recipt", options.receipt);


            razorPay_Instance.orders.create(options, function (err, data) {
                if (err) console.log("razorpay err", err);
                else {
                    console.log("order", data);
                    let order = new Order({
                        products: products,
                        address: address,
                        amount: data.amount,
                        razorpay_order_id: data.id,
                        purchase_date: data.created_at,
                        status: data.status,
                        receipt: data.receipt,
                        user_email: user_email,
                        userId: user_id
                    });

                    order.save((err, orderRes) => {
                        if (err) console.log("error in saving", err);
                        else {
                            console.log("order saved res", orderRes);

                            res.status(200).json({
                                message: "order created succesfully",
                                payload: {
                                    dbRes: orderRes,
                                    key: RazorPay_Config.key_id
                                }

                            })
                        }
                    });

                }

            });

        }



    },


    updateOrder(req, res) {
        console.log("inside update order", req.body);
        let orderId = req.body._id;
        let razorpay_order_id = req.body.payment.razorpay_order_id;
        let razorpay_payment_id = req.body.payment.razorpay_payment_id;
        let razorpay_signature = req.body.payment.razorpay_signature;
        let updatedFieldsObject = {};
        updatedFieldsObject.status = "success";
        updatedFieldsObject.razorpay_order_id = razorpay_order_id;
        updatedFieldsObject.razorpay_payment_id = razorpay_payment_id;
        updatedFieldsObject.razorpay_signature = razorpay_signature;
        if (verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
            console.log("signature verified");
            Order.findById(orderId, (err, data) => {
                if ("err in fetch order while updating", err);
                else {
                    console.log("fecthed data", data);
                    data.status = "success";
                    data.razorpay_order_id = razorpay_order_id;
                    data.razorpay_payment_id = razorpay_payment_id;
                    data.razorpay_signature = razorpay_signature;
                    data.save(async (err, orderData) => {
                        if ("err in save order", err);
                        else {
                            console.log("oderStatus success", orderData);
                            let result = await updateProductsInventory(orderData.products);
                            let cartResult = await emptyUserCart(orderData.userId);
                            console.log("results:", result);
                            console.log("cartResult:", cartResult);
                            res.status(200).send(orderData);
                        }
                    })
                }
            })
            // Order.updateOne({ "_id": orderId }, { $set: updatedFieldsObject }, (err, data) => {
            //     if ("err in update order", err);
            //     else {

            //         console.log("order updated");

            //         res.status(200).send(data);
            //     }
            // });
        }
        else {
            console.log("wrong signature")
        }

    }

}