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
const async = require('async');
router.post('/', fileHelper.memoryUpload.any(), async (req, res) => {
  const { fname, lname, email, mobile, password, referer_code, fcm_token, adminid } = req.body;
  if (fname && fname.trim() != '') {
    if (lname && lname.trim() != '') {
      if (email && email.trim() != '' && (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
        if (mobile && mobile.trim() != '' && mobile.length == 10) {
          if (password && password.trim() != '' && password.length >= 6) {
            if (adminid && adminid.trim() != '' && mongoose.Types.ObjectId.isValid(adminid)) {
              let primary = mongoConnection.useDb(constants.DEFAULT_DB);
              let adminData = await primary.model(constants.MODELS.admins, adminModel).findById(adminid).lean();
              if (adminData) {
                let checkExistingUser = await primary.model(constants.MODELS.users, userModel).findOne({ $or: [{ email: email }, { mobile: mobile }] }).lean();
                if (checkExistingUser == null) {
                  let ecnPassword = await helper.passwordEncryptor(password);
                  let my_referer_code_new = await helper.makeid(8);
                  if (referer_code && referer_code != null && referer_code != '' && referer_code.length == 8) {
                    let userReferel = await primary.model(constants.MODELS.users, userModel).findOne({ my_referer_code: referer_code }).lean();
                    if (userReferel != null) {
                      var obj = {
                        fname: fname,
                        lname: lname,
                        email: email,
                        mobile: mobile,
                        password: ecnPassword,
                        my_referer_code: my_referer_code_new,
                        referer_code: referer_code,
                        profile_photo: '',
                        aadhar_card: '',
                        pan_card: '',
                        cheque: '',
                        fcm_token: (fcm_token) ? fcm_token : '',
                        is_approved: false,
                        adminid: new mongoose.Types.ObjectId(adminid),
                        createdBy: new mongoose.Types.ObjectId(adminid),
                        updatedBy: new mongoose.Types.ObjectId(adminid)
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
                          } else if (file.fieldname == 'aadhar_card') {
                            if (allowedContentTypes.imagearray.includes(file.mimetype)) {
                              let filesizeinMb = parseFloat(parseFloat(file.size) / 1048576);
                              if (filesizeinMb <= parseInt(process.env.ALLOWED_IMAGE_UPLOAD_SIZE)) {
                                AwsCloud.saveToS3(file.buffer, 'user', file.mimetype, 'aadharcard').then((result) => {
                                  obj.aadhar_card = result.data.Key;
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
                            let newuser = await primary.model(constants.MODELS.users, userModel).findById(newUser._id).lean();
                            return responseManager.onSuccess('User register successfully...!', newuser, res);
                          })().catch((error) => { });
                        });
                      }else{
                        return responseManager.badrequest({ message: 'Please upload Profile photo Aadhar card PAN card and cheque photos..., Please try again...!' }, res);
                      }
                    } else {
                      return responseManager.badrequest({ message: 'Invalid referer code, Please try again...!' }, res);
                    }
                  } else {
                    var obj = {
                      fname: fname,
                      lname: lname,
                      email: email,
                      mobile: mobile,
                      password: ecnPassword,
                      my_referer_code: my_referer_code_new,
                      referer_code: referer_code,
                      profile_photo: '',
                      aadhar_card: '',
                      pan_card: '',
                      cheque: '',
                      fcm_token: (fcm_token) ? fcm_token : '',
                      is_approved: false,
                      adminid: new mongoose.Types.ObjectId(adminid),
                      createdBy: new mongoose.Types.ObjectId(adminid),
                      updatedBy: new mongoose.Types.ObjectId(adminid)
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
                        } else if (file.fieldname == 'aadhar_card') {
                          if (allowedContentTypes.imagearray.includes(file.mimetype)) {
                            let filesizeinMb = parseFloat(parseFloat(file.size) / 1048576);
                            if (filesizeinMb <= parseInt(process.env.ALLOWED_IMAGE_UPLOAD_SIZE)) {
                              AwsCloud.saveToS3(file.buffer, 'user', file.mimetype, 'aadharcard').then((result) => {
                                obj.aadhar_card = result.data.Key;
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
                          let newuser = await primary.model(constants.MODELS.users, userModel).findById(newUser._id).lean();
                          return responseManager.onSuccess('User register successfully...!', newuser, res);
                        })().catch((error) => { });
                      });
                    }else{
                      return responseManager.badrequest({ message: 'Please upload Profile photo Aadhar card PAN card and cheque photos..., Please try again...!' }, res);
                    }
                  }
                } else {
                  return responseManager.badrequest({ message: 'User already exist with same mobile or email, Please try again...!' }, res);
                }
              } else {
                return responseManager.badrequest({ message: 'Invalid admin id to register user, Please try again...!' }, res);
              }
            } else {
              return responseManager.badrequest({ message: 'Invalid admin id to register user, Please try again...!' }, res);
            }
          } else {
            return responseManager.badrequest({ message: 'Password must be >= 6 charecters, Please try again...!' }, res);
          }
        } else {
          return responseManager.badrequest({ message: 'Invalid mobile number to register user, Please try again...!' }, res);
        }
      } else {
        return responseManager.badrequest({ message: 'Invalid email-id to register user, Please try again...!' }, res);
      }
    } else {
      return responseManager.badrequest({ message: 'Last name is mandatory to register user, Please try again...!' }, res);
    }
  } else {
    return responseManager.badrequest({ message: 'First name is mandatory to register user, Please try again...!' }, res);
  }
});
module.exports = router;