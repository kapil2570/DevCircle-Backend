const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, "public/data/uploads/");
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + path.extname(file.originalname));
    } 

});

const upload = multer({
    storage,
    limits: {
        fileSize: 10*1024*1024
    }
});

const uploadMiddleware = (req, res, next) => {
    upload.single("photo")(req, res, function (err) {
        if(err instanceof multer.MulterError) {
            return res.status(413).send("File too large, Max size is 10MB");
        } else if(err) {
            return res.status(400).json({
                message: err.message
            })
        }
        next();
    });
}

module.exports = uploadMiddleware;