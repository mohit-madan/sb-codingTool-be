const validator = require('validator');
const jwt = require('jsonwebtoken');
const User = require('../models/model.user');
const { loginTokenExpiresIn} = require('../constant');


module.exports = {
    login: (req, res) => {
        const { username, password } = req.body;
        if (validator.isEmail(username)) {
            //login with email
            User.findOne({ email: username },async (err, user) => {
                if (err) {
                    res.send(err);
                } else {
                    if (!user) {
                        res.status('404').send({ message: 'User not found' });
                    } else {
                        if (!user.password) {
                            res.status('200').send({ message: 'please reset your password' });
                        }
                        else if (user.verified) {
                            if (user.comparePassword(password)) {
                                //login
                                //expires time 15 minutes
                                const accessToken = await jwt.sign({ username }, process.env.JWT_ACCESS_KEY, { expiresIn: loginTokenExpiresIn });
                                res.status('200').send({ auth: true, accessToken: accessToken });
                            } else {
                                res.status('401').send({ message: 'Password incorrect' });
                            }

                        } else {
                            res.status('401').send({ message: 'Please verify your account.' });
                        }
                    }
                }
            })
        } else {
            //login with phone number
            User.findOne({ phone: Number(username) },async (err, user) => {
                if (err) {
                    res.send(err);
                } else {
                    if (!user) {
                        res.status('404').send({ message: 'User not found' });
                    } else {
                        if (!user.password) {
                            res.status('200').send({ message: 'please reset your password' });
                        }
                        else if (user.verified) {
                            if (User.comparePassword(password)) {
                                //login
                                //expires time 15 minutes
                                const accessToken = await jwt.sign({ username }, process.env.JWT_ACCESS_KEY, { expiresIn: loginTokenExpiresIn  });
                                res.status('200').send({ auth: true, accessToken: accessToken });
                            } else {
                                res.status('401').send({ message: 'Password incorrect' });
                            }
                        } else {
                            res.status('401').send({ message: 'Please verify your account.' });
                        }
                    }
                }
            })
        }
    }
}