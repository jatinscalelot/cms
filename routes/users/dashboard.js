const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const mongoConnection = require('../../utilities/connections');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const responseManager = require('../../utilities/response.manager');
const userModel = require('../../models/users.model');
const cardModel = require('../../models/cards.model');
const async = require('async');
router.post('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.is_approved && userdata.is_approved == true) {
            let carddata = await primary.model(constants.MODELS.cards, cardModel).find({userid : mongoose.Types.ObjectId(req.token.userid)}).lean();
            let totaldueamount = 0;
            let totalcommissionpending = 0;
            async.forEachSeries(carddata, (card, next_card) => {
                if(card && card.due_amount && parseFloat(card.due_amount) > 0){
                    totaldueamount = parseFloat(totaldueamount) + parseFloat(card.due_amount);
                }
                next_card();
            }, () => {
                if(totaldueamount > 0){
                    totalcommissionpending = parseFloat(parseFloat(parseFloat(totaldueamount) * parseFloat(userdata.commission)) / 100);
                }
                return responseManager.onSuccess('Dashboard data...!', {totaldueamount : parseFloat(totaldueamount).toFixed(2), totalcommissionpending : parseFloat(totalcommissionpending).toFixed(2)}, res);
            });
        } else {
            return responseManager.badrequest({ message: 'User as not approved yet, to get dashboard details please contact admin and get your user approved' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get dashboard details, please try again' }, res);
    }
});
module.exports = router;