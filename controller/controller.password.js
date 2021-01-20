const { sendOTP } = require('../config/sendOTP');
const { sendEmail } = require('../config/sendEmail');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/model.user');
const { 
    resetPasswordTokenExpiresIn, 
    frontendUrl,
    forgetPassEmail_from,
    forgetPassEmail_subject,
    forgetPassEmail_text } = require('../constant');

module.exports = {
    forgetPass: (req, res) => {
        const { username } = req.body;
        if (validator.isEmail(username)) {
            //resetpass using email verification
            User.findOne({ email: username},async (err, user)=>{
                if(err||!user){
                    res.status('404').send({ message:'User is not exists, Please sign up' });
                }else{
                    //expires in 5 minutes
                    const Token = await jwt.sign({username}, process.env.JWT_ACCESS_KEY, { expiresIn: resetPasswordTokenExpiresIn});
                    const data = {
                        from: `${forgetPassEmail_from}`,
                        to: username,
                        subject: `${forgetPassEmail_subject}`,
                        text: `${forgetPassEmail_text}`,
                        html: `<h1 style="color: #d03737" >Hello Survey Buddy</h1>
                                <a class="btn btn-primary" href="${frontendUrl}/resetPassword/${Token}">Click here to reset your password</a>`
                    }
                    try {
                        sendEmail(data);
                        res.status('200').send({ message:'send link to registered email',user});
                    } catch (error) {
                        res.status('500').send(error);
                    }
                }
            })
        } 
        else {
            //resetpass using phone otp verification
            User.findOne({ phone: username}, (err, user)=>{
                if(err||!user){
                    res.status('404').send({ message:'User is not exists, Please sign up' });
                }else{
                    const phoneOTP = Math.floor(Math.random() * 1000000 + 1);
                    User.findOneAndUpdate({phone:username},{otp: phoneOTP}, {new: true}).
                    exec((err, user) => {
                        if (err) {
                            res.status('500').send(err);
                        } else {
                            // sendOTP(username, phoneOTP);
                            res.status('200').send({ message:'send otp to registered phone number', user});
                        }
                    });
                }
            });
        }
    },

    resetPassWithEmail: (req, res)=>{
        const { username, newPassword} = req.body;
         // get reset password header value
         const resetHeader = req.headers['resetpassword'];
         //check sbHeader is undefined
         if(typeof resetHeader !== 'undefined'){
             //split at space
             const reset = resetHeader.split(' ');
             const token = reset[1];
             jwt.verify(token, process.env.JWT_ACCESS_KEY, function(err, decoded) {
                 // err
                 if(err){
                    res.json({err});
                 }
                 else{
                     if(decoded.username === username ){
                        if (validator.isEmail(username)){
                            User.findOneAndUpdate({ email:username},{password: newPassword}, {new:true}, (err, user)=>{
                                  if(err){
                                      res.status('500').send({err:err});
                                  }else {
                                      req.user = user;
                                      res.send({message: "Password is change successfully."});
                                  }
                            });
                        }else{
                            res.status('401').send({ message:"Invalid user"}); 
                        } 
                     }else{
                         res.status('401').send({ message:"Invalid user"});
                     }
                 }
               });
         }else{
             return res.sendStatus('403');
         }

    },

    resetPassWithPhone: (req, res)=>{
        const {username, newPassword, otp} = req.body;
        User.findOne({phone: username},(err, user)=>{
            if(err){
                res.status('500').send(err);
            }else{
                if(!user){
                    res.status('404').send({ message:"user not found"}); 
                }else{
                    if(user.otp === Number(otp) && user.otp !== null){
                        User.findOneAndUpdate({ phone:username},{password: newPassword, otp:null}, {new:true}, (err, user)=>{
                            if(err){
                                res.status('500').send(err);
                            }else {
                                res.status('204').send({message: "Password is change successfully."});
                            }
                      });  
                    }else{
                        res.status('401').send({ message:"Invalid user"}); 
                    }
                }
            }
        })
    }
}