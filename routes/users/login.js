const express = require('express');
const mongoConnection = require('../../utilities/connections');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const responseManager = require('../../utilities/response.manager');
const userModel = require('../../models/users.model');
const router = express.Router();
router.post('/', async (req, res) => {
  const { email_mobile, password } = req.body;
  if (email_mobile && email_mobile.trim() != '' && (helper.validateEmail(email_mobile) || helper.validateMobile(email_mobile)) && password && password.trim() != '') {
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    let userData = await primary.model(constants.MODELS.users, userModel).findOne({ $or: [{ email: email_mobile }, { mobile: email_mobile }] }).lean();
    if (userData) {
      if (userData.is_approved === true) {
        let decPassword = await helper.passwordDecryptor(userData.password);
        if (password == decPassword) {
          let accessToken =  await helper.generateAccessToken({ userid : userData._id.toString() });
          return responseManager.onSuccess('User login successfully...!', { token: accessToken }, res);
        }else{
          return responseManager.badrequest({ message: 'Invalid email or password, Please try again...!' }, res);
        }
      } else {
        return responseManager.badrequest({ message: 'User not approved yet, Please wait for admin approvel...!' }, res);
      }
    } else {
      return responseManager.badrequest({ message: 'Invalid email or password, Please try again...!' }, res);
    }
  } else {
    return responseManager.badrequest({ message: 'Invalid email or password, Please try again...!' }, res);
  }
});
module.exports = router;