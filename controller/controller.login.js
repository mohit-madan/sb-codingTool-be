const validator = require('validator');
const jwt = require('jsonwebtoken');
const User = require('../models/model.user');
const { loginTokenExpiresIn} = require('../constant');
const STATUS_CODE = require('../statusCode')
const RESPONSE_MESSAGE = require('../responseMessage')

module.exports = {
    login: (req, res) => {
        const { username, password } = req.body;
        if (validator.isEmail(username)) {
            //login with email
            User.findOne({ email: username },async (err, user) => {
                if (err) {
                    res.status(STATUS_CODE.ServerError).send(err);
                } else {
                    if (!user) {
                        res.status(STATUS_CODE.NotFound).send({ message: RESPONSE_MESSAGE.userNotFound });
                    } else {
                        if (!user.password) {
                            res.status(STATUS_CODE.Ok).send({ message: RESPONSE_MESSAGE.passwordNotFound });
                        }
                        else if (user.verified) {
                            if (user.comparePassword(password)) {
                                //login
                                //expires time 15 minutes
                                const accessToken = await jwt.sign({ username }, process.env.JWT_ACCESS_KEY, { expiresIn: loginTokenExpiresIn });
                                res.status(STATUS_CODE.Ok).send({ auth: true, accessToken: accessToken });
                            } else {
                                res.status(STATUS_CODE.Unauthorized).send({ message: RESPONSE_MESSAGE.passwordNotMatch });
                            }

                        } else {
                            res.status(STATUS_CODE.Unauthorized).send({ message: RESPONSE_MESSAGE.unverifiedUser });
                        }
                    }
                }
            })
        } else {
            //login with phone number
            User.findOne({ phone: Number(username) },async (err, user) => {
                if (err) {
                    res.status(STATUS_CODE.ServerError).send(err);
                } else {
                    if (!user) {
                        res.status(STATUS_CODE.NotFound).send({ message: RESPONSE_MESSAGE.userNotFound });
                    } else {
                        if (!user.password) {
                            res.status(STATUS_CODE.Ok).send({ message: RESPONSE_MESSAGE.passwordNotFound });
                        }
                        else if (user.verified) {
                            if (User.comparePassword(password)) {
                                //login
                                //expires time 15 minutes
                                const accessToken = await jwt.sign({ username }, process.env.JWT_ACCESS_KEY, { expiresIn: loginTokenExpiresIn  });
                                res.status(STATUS_CODE.Ok).send({ auth: true, accessToken: accessToken });
                            } else {
                                res.status(STATUS_CODE.Unauthorized).send({ message: RESPONSE_MESSAGE.passwordNotMatch});
                            }
                        } else {
                            res.status(STATUS_CODE.Unauthorized).send({ message: RESPONSE_MESSAGE.unverifiedUser });
                        }
                    }
                }
            })
        }
    }
}