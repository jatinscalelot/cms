const express = require('express');
const router = express.Router();
const mongoConnection = require('../../utilities/connections');
const constants = require('../../utilities/constants');
const adminModel = require('../../models/admins.model');
const userModel = require('../../models/users.model');
const helper = require('../../utilities/helper');
const responseManager = require('../../utilities/response.manager');
const fileHelper = require('../../utilities/multer.functions');
const allowedContentTypes = require('../../utilities/content-types');
const AwsCloud = require('../../utilities/aws');
const mongoose = require('mongoose');
const async = require('async');
router.post('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.adminid && mongoose.Types.ObjectId.isValid(req.token.adminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.adminid).lean();
        if (admindata) {
            const { page, limit, search } = req.body;
            primary.model(constants.MODELS.users, userModel).paginate({
                $or: [
                    { fname: { '$regex': new RegExp(search, "i") } },
                    { lname: { '$regex': new RegExp(search, "i") } },
                    { email: { '$regex': new RegExp(search, "i") } },
                    { mobile: { '$regex': new RegExp(search, "i") } },
                    { my_referer_code: { '$regex': new RegExp(search, "i") } },
                    { referer_code: { '$regex': new RegExp(search, "i") } }
                ],
                adminid: mongoose.Types.ObjectId(req.token.adminid)
            }, {
                page,
                limit: parseInt(limit),
                sort: { _id: -1 },
                lean: true
            }).then((userlist) => {
                return responseManager.onSuccess("User list", userlist, res);
            }).catch((error) => {
                return responseManager.onError(error, res);
            });
        } else {
            return responseManager.badrequest({ message: 'Invalid token to update admin password, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to update admin password, please try again' }, res);
    }
});
router.post('/approve', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.adminid && mongoose.Types.ObjectId.isValid(req.token.adminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.adminid).lean();
        if (admindata) {
            const { userid, commission } = req.body;
            if (userid && userid != '' && mongoose.Types.ObjectId.isValid(userid)) {
                let userdata = await primary.model(constants.MODELS.users, userModel).findById(userid).lean();
                if (userdata && userdata.is_approved == false && userdata.adminid.toString() == req.token.adminid.toString()) {
                    if (commission && commission != '' && !isNaN(commission) && parseFloat(commission) > 0 && parseFloat(commission) < 100) {
                        await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(userid, { is_approved: true, commission: parseFloat(commission) });
                        let finaluserdata = await primary.model(constants.MODELS.users, userModel).findById(userid).lean();
                        return responseManager.onSuccess('User approved successfully...!', finaluserdata, res);
                    } else {
                        return responseManager.badrequest({ message: 'Invalid commission percentage to approve user, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid user id to approve user, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid user id to approve user, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid token to to approve user, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to to approve user, please try again' }, res);
    }
});
router.post('/disapprove', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.adminid && mongoose.Types.ObjectId.isValid(req.token.adminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.adminid).lean();
        if (admindata) {
            const { userid } = req.body;
            if (userid && userid != '' && mongoose.Types.ObjectId.isValid(userid)) {
                let userdata = await primary.model(constants.MODELS.users, userModel).findById(userid).lean();
                if (userdata && userdata.is_approved == true && userdata.adminid.toString() == req.token.adminid.toString()) {
                    await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(userid, { is_approved: false });
                    let finaluserdata = await primary.model(constants.MODELS.users, userModel).findById(userid).lean();
                    return responseManager.onSuccess('User disapproved successfully...!', finaluserdata, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid user id to disapprove user, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid user id to disapprove user, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid token to disapprove user, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to disapprove user, please try again' }, res);
    }
});
router.post('/save', helper.authenticateToken, fileHelper.memoryUpload.any(), async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.adminid && mongoose.Types.ObjectId.isValid(req.token.adminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.adminid).lean();
        if (admindata) {
            const { fname, lname, email, mobile, password, commission } = req.body;
            if (fname && fname.trim() != '') {
                if (lname && lname.trim() != '') {
                    if (email && email.trim() != '' && (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
                        if (mobile && mobile.trim() != '' && mobile.length == 10) {
                            if (password && password.trim() != '' && password.length >= 6) {
                                if (commission && commission != '' && !isNaN(commission) && parseFloat(commission) > 0) {
                                    let checkExistingUser = await primary.model(constants.MODELS.users, userModel).findOne({ $or: [{ email: email }, { mobile: mobile }] }).lean();
                                    if (checkExistingUser == null) {
                                        let ecnPassword = await helper.passwordEncryptor(password);
                                        let my_referer_code_new = await helper.makeid(8);
                                        var obj = {
                                            fname: fname,
                                            lname: lname,
                                            email: email,
                                            mobile: mobile,
                                            password: ecnPassword,
                                            my_referer_code: my_referer_code_new,
                                            referer_code: '',
                                            profile_photo: '',
                                            aadhar_card_front: '',
                                            aadhar_card_back: '',
                                            pan_card: '',
                                            cheque: '',
                                            commission: parseFloat(commission),
                                            fcm_token: '',
                                            is_approved: true,
                                            adminid: new mongoose.Types.ObjectId(req.token.adminid),
                                            createdBy: new mongoose.Types.ObjectId(req.token.adminid),
                                            updatedBy: new mongoose.Types.ObjectId(req.token.adminid)
                                        };
                                        if (req.files && req.files.length > 0) {
                                            async.forEachSeries(req.files, (file, next_file) => {
                                                if (file.fieldname == 'profile_photo') {
                                                    if (allowedContentTypes.imagearray.includes(file.mimetype)) {
                                                        var filesizeinMb = parseFloat(parseFloat(file.size) / 1048576);
                                                        if (filesizeinMb <= parseInt(process.env.ALLOWED_IMAGE_UPLOAD_SIZE)) {
                                                            AwsCloud.saveToS3(file.buffer, 'user', file.mimetype, 'profile').then((result) => {
                                                                obj.profile_photo = result.data.Key;
                                                                next_file();
                                                            }).catch((error) => {
                                                                return responseManager.onError(error, res);
                                                            });
                                                        } else {
                                                            return responseManager.badrequest({ message: 'Profile Image file must be <= ' + process.env.ALLOWED_IMAGE_UPLOAD_SIZE + ' MB, please try again' }, res);
                                                        }
                                                    } else {
                                                        return responseManager.badrequest({ message: 'Invalid profile image file type only image files allowed, please try again' }, res);
                                                    }
                                                } else if (file.fieldname == 'aadhar_card_front') {
                                                    if (allowedContentTypes.imagearray.includes(file.mimetype)) {
                                                        let filesizeinMb = parseFloat(parseFloat(file.size) / 1048576);
                                                        if (filesizeinMb <= parseInt(process.env.ALLOWED_IMAGE_UPLOAD_SIZE)) {
                                                            AwsCloud.saveToS3(file.buffer, 'user', file.mimetype, 'aadharcardfront').then((result) => {
                                                                obj.aadhar_card_front = result.data.Key;
                                                                next_file();
                                                            }).catch((error) => {
                                                                return responseManager.onError(error, res);
                                                            });
                                                        } else {
                                                            return responseManager.badrequest({ message: 'Aadhar card Image file must be <= ' + process.env.ALLOWED_IMAGE_UPLOAD_SIZE + ' MB, please try again' }, res);
                                                        }
                                                    } else {
                                                        return responseManager.badrequest({ message: 'Invalid Aadhar card Image file type only image files allowed, please try again' }, res);
                                                    }
                                                } else if (file.fieldname == 'aadhar_card_back') {
                                                    if (allowedContentTypes.imagearray.includes(file.mimetype)) {
                                                        let filesizeinMb = parseFloat(parseFloat(file.size) / 1048576);
                                                        if (filesizeinMb <= parseInt(process.env.ALLOWED_IMAGE_UPLOAD_SIZE)) {
                                                            AwsCloud.saveToS3(file.buffer, 'user', file.mimetype, 'aadharcardback').then((result) => {
                                                                obj.aadhar_card_back = result.data.Key;
                                                                next_file();
                                                            }).catch((error) => {
                                                                return responseManager.onError(error, res);
                                                            });
                                                        } else {
                                                            return responseManager.badrequest({ message: 'Aadhar card Image file must be <= ' + process.env.ALLOWED_IMAGE_UPLOAD_SIZE + ' MB, please try again' }, res);
                                                        }
                                                    } else {
                                                        return responseManager.badrequest({ message: 'Invalid Aadhar card Image file type only image files allowed, please try again' }, res);
                                                    }
                                                } else if (file.fieldname == 'pan_card') {
                                                    if (allowedContentTypes.imagearray.includes(file.mimetype)) {
                                                        let filesizeinMb = parseFloat(parseFloat(file.size) / 1048576);
                                                        if (filesizeinMb <= parseInt(process.env.ALLOWED_IMAGE_UPLOAD_SIZE)) {
                                                            AwsCloud.saveToS3(file.buffer, 'user', file.mimetype, 'pancard').then((result) => {
                                                                obj.pan_card = result.data.Key;
                                                                next_file();
                                                            }).catch((error) => {
                                                                return responseManager.onError(error, res);
                                                            });
                                                        } else {
                                                            return responseManager.badrequest({ message: 'PAN card Image file must be <= ' + process.env.ALLOWED_IMAGE_UPLOAD_SIZE + ' MB, please try again' }, res);
                                                        }
                                                    } else {
                                                        return responseManager.badrequest({ message: 'Invalid PAN card Image file type only image files allowed, please try again' }, res);
                                                    }
                                                } else if (file.fieldname == 'cheque') {
                                                    if (allowedContentTypes.imagearray.includes(file.mimetype)) {
                                                        let filesizeinMb = parseFloat(parseFloat(file.size) / 1048576);
                                                        if (filesizeinMb <= parseInt(process.env.ALLOWED_IMAGE_UPLOAD_SIZE)) {
                                                            AwsCloud.saveToS3(file.buffer, 'user', file.mimetype, 'cheque').then((result) => {
                                                                obj.cheque = result.data.Key;
                                                                next_file();
                                                            }).catch((error) => {
                                                                return responseManager.onError(error, res);
                                                            });
                                                        } else {
                                                            return responseManager.badrequest({ message: 'Cheque Image file must be <= ' + process.env.ALLOWED_IMAGE_UPLOAD_SIZE + ' MB, please try again' }, res);
                                                        }
                                                    } else {
                                                        return responseManager.badrequest({ message: 'Invalid Cheque Image file type only image files allowed, please try again' }, res);
                                                    }
                                                }
                                            }, () => {
                                                (async () => {
                                                    let newUser = await primary.model(constants.MODELS.users, userModel).create(obj);
                                                    await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(newUser._id, { channelID: newUser.mobile.toString() + '_' + newUser._id.toString() });
                                                    let newuser = await primary.model(constants.MODELS.users, userModel).findById(newUser._id).select("-password").lean();
                                                    return responseManager.onSuccess('User created successfully...!', newuser, res);
                                                })().catch((error) => {
                                                    return responseManager.onError(error, res);
                                                });
                                            });
                                        } else {
                                            return responseManager.badrequest({ message: 'Please upload Profile photo Aadhar card PAN card and cheque photos..., Please try again...!' }, res);
                                        }
                                    } else {
                                        return responseManager.badrequest({ message: 'User already exist with same mobile or email, Please try again...!' }, res);
                                    }
                                } else {
                                    return responseManager.badrequest({ message: 'Invalid commission percentage to save user data, please try again' }, res);
                                }
                            } else {
                                return responseManager.badrequest({ message: 'Password must be >= 6 charecters, Please try again...!' }, res);
                            }
                        } else {
                            return responseManager.badrequest({ message: 'Invalid mobile number to save user data, Please try again...!' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid email-id to save user data, Please try again...!' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Last name is mandatory to save user data, Please try again...!' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'First name is mandatory to save user data, Please try again...!' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid token to save user data, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to save user data, please try again' }, res);
    }
});
module.exports = router;