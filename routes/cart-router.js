const express =require('express');
const crouter= express.Router();


 const cartCtrl= require('../controllers/cart_controller');



 crouter.post('/:id',cartCtrl.fetchCart);
 crouter.put('/add/:id',cartCtrl.addProductInCart);
 crouter.put('/remove/:id',cartCtrl.removeProductFromCart);
// router.put('',cartCtrl.userProfile);
// router.post('',cartCtrl.register);


module.exports=crouter;
