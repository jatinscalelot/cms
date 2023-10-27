const express = require('express');
const router = express.Router();
const mongoConnection = require('../../utilities/connections');
const constants =  require('../../utilities/constants');
const adminModel = require('../../models/admins.model');
const helper = require('../../utilities/helper');
const responseManager = require('../../utilities/response.manager');
router.post('/' , async (req , res) => {
  const { email_mobile , password } = req.body;
  if(email_mobile && email_mobile.trim() != '' && password && password.trim() != ''){
    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
    let adminData = await primary.model(constants.MODELS.admins , adminModel).findOne({$or: [{email: email_mobile} , {mobile: email_mobile}]}).lean();
    if(adminData){
      let decPassword = await helper.passwordDecryptor(adminData.password);
      if(decPassword == password){
        let accessToken = await helper.generateAccessToken({ adminid : adminData._id.toString() });
        return responseManager.onSuccess('Admin login successfully!', {token : accessToken}, res);
      }else{
        return responseManager.badrequest({message: 'Invalid password to login as Admin, Please try again...!'} , res);
      }
    }else{
      return responseManager.badrequest({message: 'Invalid phone or email to login as Admin, Please try again...!'} , res);
    }    
  }else{
    return responseManager.badrequest({message: 'Invalid phone or email and password to login as Admin, Please try again...!'} , res);
  }
});
module.exports = router;