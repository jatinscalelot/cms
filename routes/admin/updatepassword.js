const express = require('express');
const router = express.Router();
const mongoConnection = require('../../utilities/connections');
const constants =  require('../../utilities/constants');
const adminModel = require('../../models/admins.model');
const helper = require('../../utilities/helper');
const responseManager = require('../../utilities/response.manager');
const mongoose = require('mongoose');
const async = require('async');
router.post('/' , helper.authenticateToken, async (req , res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.adminid && mongoose.Types.ObjectId.isValid(req.token.adminid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let admindata = await primary.model(constants.MODELS.admins, adminModel).findById(req.token.adminid).lean();
        if (admindata) {
            const { old_password, new_password } = req.body;
            if (old_password && old_password != '' && old_password.length >= 6) {
                if (new_password && new_password != '' && new_password.length >= 6) {
                    let oldpass = await helper.passwordDecryptor(admindata.password);
                    if (oldpass == old_password) {
                        let newEncpass = await helper.passwordEncryptor(new_password);
                        await primary.model(constants.MODELS.admins, adminModel).findByIdAndUpdate(req.token.adminid, {password : newEncpass});
                        return responseManager.onSuccess('Admin password updated successfully...!', 1, res);
                    } else {
                        return responseManager.badrequest({ message: 'Invalid old password to update admin password, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid new password, password must be >= 6 chars to update admin password, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid old password to update admin password, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'User as not approved yet, to update admin password please contact admin and get your user approved' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to update admin password, please try again' }, res);
    }
});
module.exports = router;