const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const mongoConnection = require('../../utilities/connections');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const fileHelper = require('../../utilities/multer.functions');
const responseManager = require('../../utilities/response.manager');
const userModel = require('../../models/users.model');
const adminModel = require('../../models/admins.model');
const allowedContentTypes = require('../../utilities/content-types');
const AwsCloud = require('../../utilities/aws');
const async = require('async');
router.get('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).select("-password -referer_code -adminid").lean();
        if (userdata && userdata.is_approved && userdata.is_approved == true) {
            return responseManager.onSuccess('User profile...!', userdata, res);
        } else {
            return responseManager.badrequest({ message: 'User as not approved yet, to get profile data please contact admin and get your user approved' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get profile details, please try again' }, res);
    }
});
router.post('/', helper.authenticateToken, fileHelper.memoryUpload.single('profile'), async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).select("-password -referer_code -adminid").lean();
        if (userdata && userdata.is_approved && userdata.is_approved == true) {
            const { fname, lname, email, mobile } = req.body;
            if (fname && fname.trim() != '') {
                if (lname && lname.trim() != '') {
                    if (email && email.trim() != '' && (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
                        if (mobile && mobile.trim() != '' && mobile.length == 10) {
                            if (req.file) {
                                if (allowedContentTypes.imagearray.includes(req.file.mimetype)) {
                                    let filesizeinMb = parseFloat(parseFloat(req.file.size) / 1048576);
                                    if (filesizeinMb <= parseInt(process.env.ALLOWED_IMAGE_UPLOAD_SIZE)) {
                                        AwsCloud.saveToS3(req.file.buffer, 'user', req.file.mimetype, 'profile').then((result) => {
                                            profilePic = result.data.Key;
                                            (async () => {
                                                if (userdata.mobile == mobile) {
                                                    await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(req.token.userid, { fname: fname, lname: lname, email: email, profile_photo: result.data.Key });
                                                    let finaluserdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).select("-password -referer_code -adminid").lean();
                                                    return responseManager.onSuccess('User profile updated successfully...!', finaluserdata, res);
                                                } else {
                                                    await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(req.token.userid, { fname: fname, lname: lname, email: email, mobile: mobile, profile_photo: result.data.Key, channelID: mobile + '_' + req.token.userid.toString() });
                                                    let finaluserdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).select("-password -referer_code -adminid").lean();
                                                    return responseManager.onSuccess('User profile updated successfully...!', finaluserdata, res);
                                                }
                                            })().catch((error) => {
                                                return responseManager.onError(error, res);
                                            });
                                        }).catch((error) => {
                                            return responseManager.onError(error, res);
                                        });
                                    } else {
                                        return responseManager.badrequest({ message: 'Image file must be <= ' + process.env.ALLOWED_IMAGE_UPLOAD_SIZE + ' MB, please try again' }, res);
                                    }
                                } else {
                                    return responseManager.badrequest({ message: 'Invalid file type only image files allowed, please try again' }, res);
                                }
                            } else {
                                if (userdata.mobile == mobile) {
                                    await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(req.token.userid, { fname: fname, lname: lname, email: email });
                                    let finaluserdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).select("-password -referer_code -adminid").lean();
                                    return responseManager.onSuccess('User profile updated successfully...!', finaluserdata, res);
                                } else {
                                    await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(req.token.userid, { fname: fname, lname: lname, email: email, mobile: mobile, channelID: mobile + '_' + req.token.userid.toString() });
                                    let finaluserdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).select("-password -referer_code -adminid").lean();
                                    return responseManager.onSuccess('User profile updated successfully...!', finaluserdata, res);
                                }
                            }
                        } else {
                            return responseManager.badrequest({ message: 'Invalid mobile number to update user data, Please try again...!' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid email-id to update user data, Please try again...!' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Last name is mandatory to update user data, Please try again...!' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'First name is mandatory to update user data, Please try again...!' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'User as not approved yet, to update user data please contact admin and get your user approved' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get update user data, please try again' }, res);
    }
});
router.post('/updatepassword', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).select("-referer_code -adminid").lean();
        if (userdata && userdata.is_approved && userdata.is_approved == true) {
            const { old_password, new_password } = req.body;
            if (old_password && old_password != '' && old_password.length >= 6) {
                if (new_password && new_password != '' && new_password.length >= 6) {
                    let oldpass = await helper.passwordDecryptor(userdata.password);
                    if (oldpass == old_password) {
                        let newEncpass = await helper.passwordEncryptor(new_password);
                        await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(req.token.userid, {password : newEncpass});
                        return responseManager.onSuccess('User password updated successfully...!', 1, res);
                    } else {
                        return responseManager.badrequest({ message: 'Invalid old password to update user password, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid new password, password must be >= 6 chars to update user password, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid old password to update user password, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'User as not approved yet, to update user password please contact admin and get your user approved' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to update user password, please try again' }, res);
    }
});
module.exports = router;