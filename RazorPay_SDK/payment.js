const Razorpay= require('razorpay');


const RazorpayConfig={
    key_id:'rzp_test_PfAAebU0ddzEiE',
    key_secret:'TjhGCXQm4HWTE29SbXRe2maD'
}
var instance = new Razorpay(RazorpayConfig);

//   instance.once('ready', function(response) {
//     console.log(response.methods);
//   });
module.exports.config = RazorpayConfig;
module.exports.instance= instance;




