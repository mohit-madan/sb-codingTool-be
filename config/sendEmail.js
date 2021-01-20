//email setup
const mailgun = require('mailgun-js');
const API_KEY =  process.env.SG_MAIL_API_KEY;
const DOMAIN = 'collegefellow.social'; //demo
const mg = mailgun({apiKey: API_KEY, domain: DOMAIN});

module.exports = {
    //send email
    sendEmail:function(data){
        mg.messages().send(data,async  function (err, body) {
            if(err){
                return err;  
            }else{
                return body;
            }
        });
    }
};