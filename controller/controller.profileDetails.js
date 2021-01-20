const User = require('../models/model.user');
module.exports = {
    saveChanges: (req, res) => {
        const {fname , lname, age, dob, city, state } = req.body;
        const date = new Date(dob);
        if (req.user.email) {
            User.findOneAndUpdate({ email: req.user.email },
                { 'name.fname': fname,
                  'name.lname': lname,
                   age: Number(age),
                   dob: date,
                   'contact.city': city,
                   'contact.state': state
                 }).exec((err, user)=>{
                     if(err){
                        res.status('500').send(err);
                     }
                     else{
                        req.user = user;
                        res.status('201').send({ message: 'Profile change save successfully.', type: 'success' });
                     }
                 });
            
        } else if (req.user.phone) {
            User.findOneAndUpdate({ phonr: req.user.phone },
                { 'name.fname': fname,
                  'name.lname': lname,
                   age: Number(age),
                   dob: date,
                   'contact.city': city,
                   'contact.state': state
                 }).exec((err, user)=>{
                     if(err) {
                        res.status('500').send(err);
                     }
                     else{
                        req.user = user;
                        res.status('201').send({ message: 'Profile change save successfully.', type: 'success' });
                     }
                 });
        }else{
            res.status('500').send({error: 'Something went wrong j'});
        }
    }
}