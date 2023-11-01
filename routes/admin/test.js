const express = require('express');
const router = express.Router();
const mongoConnection = require('../../utilities/connections');
const constants =  require('../../utilities/constants');
const adminModel = require('../../models/admins.model');
const helper = require('../../utilities/helper');
const responseManager = require('../../utilities/response.manager');
router.post('/' , async (req , res) => {
  const { str } = req.body;
  let x = await helper.passwordEncryptor(str);
  return responseManager.onSuccess('Admin login successfully!', {token : x}, res);
});
module.exports = router;