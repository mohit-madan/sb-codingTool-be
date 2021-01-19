const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');


const s3 = new AWS.S3({
   accessKeyId: process.env.AWS_ACCESS_ID,
   secretAccessKey: process.env.AWS_ACCESS_SECRET
});

const storage = multer.memoryStorage({
    destination: function (req, file, cb) {
        cb(null, '');
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||  //.xlsx
        file.mimetype == 'application/vnd.ms-excel' || file.mimetype == 'text/csv') {            //.xls || csv
        cb(null, true)
    } else {
        return cb(new Error('Only .xlsx, .xls and .cvs formate is allowed.'),false);
    }
}

const upload = multer({ storage: storage, fileFilter: fileFilter }).single('file');

module.exports ={
    uploadFile:(req,res)=>{
        upload(req, res, async (err) => {
            if (err) {
                res.status('400').send({ message: 'Only .xlsx, .xls and .cvs formate is allowed.', type: 'danger'});
            } else {
                console.log(req.file);
                const params ={
                    Bucket: process.env.AWS_DOCUMENT_BUCKET,
                    Key: "DOC_" + Date.now() + path.extname(req.file.originalname),
                    Body: req.file.buffer
                }
                console.log(params);
                s3.upload(params,(err,data) => {
                    if(err){
                        res.status('500').send({ message:'Internal server error', type: 'danger'});
                    }else{
                        res.status('201').send({ message:'doument save successfully', type: 'success', link: data.Location});    
                    }
                });
            }
        });
    }
}