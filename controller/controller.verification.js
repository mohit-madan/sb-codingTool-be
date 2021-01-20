const jwt = require('jsonwebtoken');
const { frontendUrl } = require('../constant');
const User = require('../models/model.user');
module.exports ={
    confirmAccount: (req, res)=>{
        const {token} = req.params;
        jwt.verify(token, process.env.JWT_ACCESS_KEY, (err, user) => {
            if (err) {
                // console.log(err);
                res.json({err});
            }
            else {
                // console.log(user);
                User.findOneAndUpdate({email: user.username},{verified:true},{new: true}).
                exec((err, user) => {
                    if(err) {
                        console.log(err);
                        res.status('500').send({err:' Internal Server Error'});
                    }else {
                        res.status('200').redirect(`${frontendUrl}/login`);
                    }
                })
            }
        });
    },
    verifyToken: (req, res)=>{
        const {token} = req.params;
        jwt.verify(token, process.env.JWT_ACCESS_KEY, (err, user) => {
            if (err) {
                // console.log(err);
                res.json({err});
            }
            else {
                res.status('200').send({username: user.username});
            }
        });
    }
}