const mongoose = require('mongoose');
const User = require('../models/user');
const Cart=require('../models/cart');
const passport= require('passport');
const lodash= require('lodash');


function createCartForUser(data){
    console.log("data in cart",data);
    var obj={};
    obj.discount=0;
    obj.payable=0;
    obj.shipping=0;
    obj.total=0;
    let cart = new Cart();
    cart.products=[];
    cart.cartSummary=obj;
    cart.userId=data._id;
    cart.save();
}



module.exports={

    register(req,res,next){
        console.log("req.body:",req.body);
        let user= new User();
        user.name=req.body.name;
        user.email=req.body.email;
        user.password=req.body.password;
        user.save(function(err,data){
            if(err){
                if(err.code==11000){
                    res.status(422).send(['Duplicate email address found.']);
                }
                else{
                    return next(err);
                }
            }
            else{
                createCartForUser(data);
                res.send(data);
            }
            
        });
    },



    authenticate(req,res,next){
        passport.authenticate("local",(err,user,info)=>{
            if(err)return res.status(400).json(err);
            else if(user) return res.status(200).json({"token":user.generateJwt()});
            else return res.status(404).json(info);
        })(req,res);
    },


    userProfile(req,res,next){
        User.findOne({_id:req._id},(err,user)=>{
            if(err) return req.status(404).json({status:false,message:"User not found"});
            else
                return res.status(200).json({status:true,user:lodash.pick(user,['name','email'])});
        })
    },


    addAddress(req,res){
        console.log("inside add address");
        let id= req.params.id;
        let addressObj= req.body.address;
        User.updateOne({_id:id},{$push:{"address":{$each:[addressObj]}}},(err,data)=>{
            if("err in update address",err);
            else{
                res.status(200).send(data);
            }
        })        
    },

    fetchAddress(req,res){
        console.log("inside fetch address");
        let id=req.params.id;
        User.findOne({_id:id},(err,user)=>{
            if(err) return req.status(404).json({status:false,message:"User not found"});
            else
                return res.status(200).json({status:true,user:lodash.pick(user,['address'])});
        })
    }








}