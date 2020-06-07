const mongoose = require('mongoose');

const Cart = require('../models/cart');


function isCartNotHavingSameSizeProduct(cartProductsArray, productObj) {
    let val = true;

    if (cartProductsArray.length > 0) {
        const query = (element) => (element._id != productObj._id) || (element._id == productObj._id && productObj.size != element.size);
        val = cartProductsArray.every(query);
    }
    return val;
}

function updateCartSummary(cartSummary, element) {
    if (cartSummary) {
        let discount = element.price - element.discountedPrice;
        cartSummary.total += element.price;
        cartSummary.discount += discount;
        cartSummary.payable += element.discountedPrice;
        cartSummary.shipping += 0;
    }
    // console.log("updateCartSummary",cartSummary);
    return cartSummary;
}

function reduceCartSummary(cartSummary, element) {
    if (cartSummary) {
        let discount = element.price - element.discountedPrice;
        cartSummary.total -= element.price;
        cartSummary.discount -= discount;
        cartSummary.payable -= element.discountedPrice;
        cartSummary.shipping -= 0;
    }
    // console.log("updateCartSummary",cartSummary);
    return cartSummary;
}

module.exports = {


    fetchCart(req, res) {
        console.log("inside fetch")
        let id = req.params.id;
        let products = req.body.products;
        let cartSummary = req.body.summary;

        Cart.find({ userId: id }, (err, cartObj) => {
            if (err) console.log("Cart Error", err);
            else {

                if (products) {

                    products.forEach(element => {

                        if (isCartNotHavingSameSizeProduct(cartObj[0].products, element)) {
                            cartObj[0].products.push(element);
                            console.log(" before updating cartObj[0].cartSummary", cartObj[0].cartSummary);
                            cartObj[0].cartSummary = updateCartSummary(cartObj[0].cartSummary, element);
                            console.log(" after updating cartObj[0].cartSummary", cartObj[0].cartSummary);
                        }
                    });
                }
                console.log("cartSummary in fetch", cartObj[0].cartSummary);
                cartObj[0].markModified('cartSummary');
                cartObj[0].save();
                res.status(200).send(cartObj[0]);
            }
        })
    },

    addProductInCart(req, res) {
        console.log("inside addProductInCart");
        let id = req.params.id;
        let product = req.body.product;

        Cart.find({ userId: id }, (err, cartObj) => {
            if (err) console.log("Cart Error", err);
            else {
                if (isCartNotHavingSameSizeProduct(cartObj[0].products, product)) {
                    cartObj[0].products.push(product);
                    console.log("add product before cart summary", cartObj[0].cartSummary);
                    cartObj[0].cartSummary = updateCartSummary(cartObj[0].cartSummary, product);
                    cartObj[0].markModified('cartSummary');
                    cartObj[0].save();
                    console.log("add product Cart output", cartObj[0]);
                    res.status(200).send(cartObj[0]);
                }
                else {
                    res.status(400).send("Product Already Added");
                }
            }
        })
    },

    removeProductFromCart(req, res) {
        console.log("inside removeProductFromCart");
        let id = req.params.id;
        let product = req.body.product;

        Cart.update({ userId: id },
            { $pull: { products: { _id: product._id, size: product.size } } }, (err, response) => {
            if (err) console.log("error in update", err);
            else{
                Cart.find({userId:id},(err,cartObj)=>{
                    if(err)console.log(err);
                    else{
                        cartObj[0].cartSummary=reduceCartSummary(cartObj[0].cartSummary,product);
                        cartObj[0].markModified('cartSummary');
                        cartObj[0].save();
                        console.log("remove product Cart output", cartObj[0]);
                        res.status(200).send(cartObj[0]);
                    }
                })
            }
            
        });

    }





}