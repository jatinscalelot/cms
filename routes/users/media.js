const express = require('express');
const router = express.Router();
const responseManager = require('../../utilities/response.manager');
const fileHelper = require('../../utilities/multer.functions');
const allowedContentTypes = require('../../utilities/content-types');
const AwsCloud = require('../../utilities/aws');
router.post('/profile', fileHelper.memoryUpload.single('profile'), async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.file) {
        if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
            let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
            if (filesizeinMb <= parseInt(process.env.ALLOWED_IMAGE_UPLOAD_SIZE)) {
                AwsCloud.saveToS3(req.file.buffer, 'user', req.file.mimetype, 'profile').then((result) => {
                    let obj = {
                        s3_url: process.env.AWS_BUCKET_URI,
                        url: result.data.Key
                    };
                    return responseManager.onSuccess('File uploaded successfully!', obj, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            }else{
                return responseManager.badrequest({ message: 'Image file must be <= '+process.env.ALLOWED_IMAGE_UPLOAD_SIZE+' MB, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid file type only image files allowed, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
    }
});
router.post('/aadharcard', fileHelper.memoryUpload.single('aadharcard'), async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.file) {
        if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
            let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
            if (filesizeinMb <= parseInt(process.env.ALLOWED_IMAGE_UPLOAD_SIZE)) {
                AwsCloud.saveToS3(req.file.buffer, 'user', req.file.mimetype, 'aadharcard').then((result) => {
                    let obj = {
                        s3_url: process.env.AWS_BUCKET_URI,
                        url: result.data.Key
                    };
                    return responseManager.onSuccess('File uploaded successfully!', obj, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            }else{
                return responseManager.badrequest({ message: 'Image file must be <= '+process.env.ALLOWED_IMAGE_UPLOAD_SIZE+' MB, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid file type only image files allowed, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
    }
});
router.post('/pancard', fileHelper.memoryUpload.single('pancard'), async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.file) {
        if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
            let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
            if (filesizeinMb <= parseInt(process.env.ALLOWED_IMAGE_UPLOAD_SIZE)) {
                AwsCloud.saveToS3(req.file.buffer, 'user', req.file.mimetype, 'pancard').then((result) => {
                    let obj = {
                        s3_url: process.env.AWS_BUCKET_URI,
                        url: result.data.Key
                    };
                    return responseManager.onSuccess('File uploaded successfully!', obj, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            }else{
                return responseManager.badrequest({ message: 'Image file must be <= '+process.env.ALLOWED_IMAGE_UPLOAD_SIZE+' MB, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid file type only image files allowed, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
    }
});
router.post('/cheque', fileHelper.memoryUpload.single('cheque'), async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.file) {
        if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
            let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
            if (filesizeinMb <= parseInt(process.env.ALLOWED_IMAGE_UPLOAD_SIZE)) {
                AwsCloud.saveToS3(req.file.buffer, 'user', req.file.mimetype, 'cheque').then((result) => {
                    let obj = {
                        s3_url: process.env.AWS_BUCKET_URI,
                        url: result.data.Key
                    };
                    return responseManager.onSuccess('File uploaded successfully!', obj, res);
                }).catch((error) => {
                    return responseManager.onError(error, res);
                });
            }else{
                return responseManager.badrequest({ message: 'Image file must be <= '+process.env.ALLOWED_IMAGE_UPLOAD_SIZE+' MB, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid file type only image files allowed, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid file to upload, please try again' }, res);
    }
});
module.exports = router;