const multer = require('multer');
const User = require('../models/model.user');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads-profile/');
    },
    filename: (req, file, cb) => {
        if(!req.user.profileLink || req.user.profileLink ==="default.png"){
            cb(null, "IMG_" + Date.now() + path.extname(file.originalname));
        }else{
            cb(null, req.user.profileLink);
        }  
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/png' || file.mimetype == 'image/jpg') {
        cb(null, true)
    } else {
        return cb(new Error('Only .jpg, .jpeg and .png formate is allowed.',false));
    }
}
const upload = multer({ storage: storage, fileFilter: fileFilter }).single('image');

module.exports = {
    imageUpload: (req, res) => {
        upload(req, res, async (err) => {
            if (err) {
                console.log(err);
                res.status('400').send({ message: 'Only .jpg, .jpeg and .png formate is allowed.', type: 'danger'});
            } else {
                try {
                    if(req.user.email){
                        await User.findOneAndUpdate({ email: req.user.email }, { profileLink: req.file.filename });
                        res.status('201').send({ message: 'Profile Image upload successfully.', type: 'success'});
                    }else if(req.user.phone){
                        await User.findOneAndUpdate({ phone: Number(req.user.phone) }, { profileLink: req.file.filename });
                        res.status('201').send({ message: 'Profile Image upload successfully.', type: 'success'});
                    }else{
                        res.status('500').send({ message: 'Something went wrong', type: 'danger'});
                    }
                } catch (error) {
                   res.status('500').send({error: 'Something went wrong'});
                }
            }
        });
    },

    imageRemove:async (req, res) => {
        try {
            if(req.user.email){
                await User.findOneAndUpdate({ email: req.user.email }, { profileLink: "default.png" });
                res.status('201').send({ message: 'Profile Image Removed successfully.', type: 'success'});
            }else if(req.user.phone){
                await User.findOneAndUpdate({ phone: Number(req.user.phone) }, { profileLink: "default.png" });
                res.status('201').send({ message: 'Profile Image Removed successfully.', type: 'success'});
            }else{
                res.status('500').send({ message: 'Something went wrong', type: 'danger'});
            }
        } catch (error) {
            res.status('500').send({error: 'Something went wrong'});
        }
    }
}