require('dotenv').config();
require('./config/passportConfig');


const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const passport = require('passport');

const mongoose = require('mongoose');
mongoose.set('debug', true);
const PORT=process.env.PORT ||3001;

const admin_controller = require('./controllers/admin_controller');
const products_controller = require('./controllers/products_conroller');
const cartCtrl = require('./controllers/cart_controller');
const orderCtrl = require('./controllers/order_controller');

const jwtVerification= require('./config/jwtVerification');

app.use(bodyParser.json());
app.use(cors());
app.use(passport.initialize());

app.use("/public", express.static(path.join(__dirname, 'public')));
app.use(express.static(path.resolve(__dirname,'dist','palikaBazaar')));

const routes = require('./routes/router');
const cartRoutes = require('./routes/cart-router');

console.log("mongo string:", process.env.CONNECTION_STRING);

mongoose.connect(process.env.CONNECTION_STRING,
    { useNewUrlParser: true, useUnifiedTopology: true },
    (err) => {
        if (err) {
            console.log('Database Error----------------', err);
        }
        console.log('Connected to database');
    });

app.get("/",(req,res)=>{
    let p= path.resolve(__dirname,'dist','palikaBazaar','index.html');
    res.sendFile(p);
})
app.use('/api/account', routes);
app.use('/api/cart', cartRoutes);
app.post('/api/addkey', admin_controller.addKeyword)
//app.get('/cart/:id',cartCtrl.fetchCart);
app.post('/api/purchase',jwtVerification.verifyJwtToken,orderCtrl.purchase);
app.post('/api/updateOrder',orderCtrl.updateOrder);
app.get('/api/products', products_controller.readAllProducts);
app.get('/api/product-details/:id', products_controller.readProduct);
app.post('/api/products', admin_controller.addProduct);
app.put('/api/products/:id', admin_controller.updateProduct);
app.delete('/api/products/deleteAll', admin_controller.deleteAllProduct);
app.delete('/api/products/:id', admin_controller.deleteProduct);
app.get('*', function (req, res) {
    console.log("p");
    let p = path.resolve(__dirname, 'dist', 'palikaBazaar', 'index.html');
    console.log("p", p);
    res.sendFile(p);
});

app.use((err, req, res, next) => {
    if (err.name === 'ValidationError') {
        var valErrors = [];
        Object.keys(err.errors).forEach(key => valErrors.push(err.errors[key].message));
        res.status(422).send(valErrors);
    }
});
app.listen(PORT, () => {
    console.log(`server is running at ${PORT}`);
})