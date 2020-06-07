const mongoose = require('mongoose');
const bcrypt=require('bcryptjs');
const jwt= require('jsonwebtoken');

const Schema = mongoose.Schema;

const user = new Schema({
    name:{
        type: String,
        required:`name can't be empty`
    },
    email:{
        type: String,
        required:`email can't be empty`,
        unique:true
    },
    password:{
        type: String,
        required:`password can't be empty`,
        minlength:[6,'Password must be atleast 6 characters long']
    },
    saltSecret:String,
    address:Array
    
});

user.path('email').validate((val)=>{
    emailRegex= /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(val);
},'Invalid email');

user.pre('save',function (next){
    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(this.password,salt,(err,hash)=>{
            this.password=hash;
            this.saltSecret=salt;
            next();
        });
    });
});

user.methods.verifyPassword= function(password){
    console.log("this inside verify password",this);
    console.log("verify Password",password);
    return bcrypt.compareSync(password,this.password);
};

user.methods.generateJwt = function(){
    console.log("process.env.JWT_SECRET",process.env.JWT_SECRET);
    return jwt.sign({_id:this._id},process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXP
    });
};

module.exports = mongoose.model('User',user,"users_eComm");


