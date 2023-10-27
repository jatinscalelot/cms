const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const mongoConnection = require('../../utilities/connections');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const responseManager = require('../../utilities/response.manager');
const userModel = require('../../models/users.model');
const adminModel = require('../../models/admins.model');
router.post('/', async (req, res) => {
  const { fname, lname, email, mobile, password, referer_code, profile_photo, aadhar_card, pan_card, cheque, fcm_token, adminid } = req.body;
  if (fname && fname.trim() != '') {
    if (lname && lname.trim() != '') {
      if (email && email.trim() != '' && (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
        if (mobile && mobile.trim() != '' && mobile.length == 10) {
          if (password && password.trim() != '' && password.length >= 6) {
            if (aadhar_card && aadhar_card.trim() != '') {
              if (pan_card && pan_card.trim() != '') {
                if (cheque && cheque.trim() != '') {
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
                              profile_photo: (profile_photo) ? profile_photo : '',
                              aadhar_card: aadhar_card,
                              pan_card: pan_card,
                              cheque: cheque,
                              fcm_token: (fcm_token) ? fcm_token : '',
                              is_approved: false,
                              adminid: new mongoose.Types.ObjectId(adminid),
                              createdBy: new mongoose.Types.ObjectId(adminid),
                              updatedBy: new mongoose.Types.ObjectId(adminid)
                            };
                            let newUser = await primary.model(constants.MODELS.users, userModel).create(obj);
                            await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(newUser._id, { channelID: newUser.mobile.toString() + '_' + newUser._id.toString() });
                            let newuser = await primary.model(constants.MODELS.users, userModel).findById(newUser._id).lean();
                            return responseManager.onSuccess('User register successfully...!', newuser, res);
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
                            profile_photo: (profile_photo) ? profile_photo : '',
                            aadhar_card: aadhar_card,
                            pan_card: pan_card,
                            cheque: cheque,
                            fcm_token: (fcm_token) ? fcm_token : '',
                            is_approved: false,
                            adminid: new mongoose.Types.ObjectId(adminid),
                            createdBy: new mongoose.Types.ObjectId(adminid),
                            updatedBy: new mongoose.Types.ObjectId(adminid)
                          };
                          let newUser = await primary.model(constants.MODELS.users, userModel).create(obj);
                          await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(newUser._id, { channelID: newUser.mobile.toString() + '_' + newUser._id.toString() });
                          let newuser = await primary.model(constants.MODELS.users, userModel).findById(newUser._id).lean();
                          return responseManager.onSuccess('User register successfully...!', newuser, res);
                        }
                      } else {
                        return responseManager.badrequest({ message: 'User already exist with same mobile or email, Please try again...!' }, res);
                      }
                    } else {
                      return responseManager.badrequest({ message: 'Invalid admin id to register user, Please try again...!' }, res);
                    }
                  }else{
                    return responseManager.badrequest({ message: 'Invalid admin id to register user, Please try again...!' }, res);
                  }
                }else{
                  return responseManager.badrequest({ message: 'Cheque image is mandatory to register user, Please try again...!' }, res);
                }
              }else{
                return responseManager.badrequest({ message: 'PAN Card image is mandatory to register user, Please try again...!' }, res);
              }
            }else{
              return responseManager.badrequest({ message: 'Aadhar Card image is mandatory to register user, Please try again...!' }, res);
            }
          }else{
            return responseManager.badrequest({ message: 'Password must be >= 6 charecters, Please try again...!' }, res);
          }
        }else{
          return responseManager.badrequest({ message: 'Invalid mobile number to register user, Please try again...!' }, res);
        }
      }else{
        return responseManager.badrequest({ message: 'Invalid email-id to register user, Please try again...!' }, res);
      }
    }else{
      return responseManager.badrequest({ message: 'Last name is mandatory to register user, Please try again...!' }, res);
    }
  }else{
    return responseManager.badrequest({ message: 'First name is mandatory to register user, Please try again...!' }, res);
  }
});
module.exports = router;