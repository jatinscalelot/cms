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
const cardModel = require('../../models/cards.model');
const allowedContentTypes = require('../../utilities/content-types');
const AwsCloud = require('../../utilities/aws');
const async = require('async');
async function validateDate(d) {
    let s = d.split("/");
    if (!isNaN(s[1]) && !isNaN(s[0])) {
        let currentY = parseInt(new Date().getFullYear().toString().substr(-2));
        if (parseInt(s[1]) > parseInt(currentY)) {
            if (parseInt(s[0]) >= 1 && parseInt(s[0]) <= 12) {
                return true;
            } else {
                return false;
            }
        } else {
            if (parseInt(s[1]) < parseInt(currentY)) {
                return false
            } else {
                let currentMonth = parseInt(String(new Date().getMonth() + 1).padStart(2, '0'));
                if (parseInt(s[0]) > parseInt(currentMonth) && parseInt(s[0]) <= 12) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    } else {
        return false;
    }
};
router.post('/save', helper.authenticateToken, fileHelper.memoryUpload.any(), async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        const { cardid, bank_name, purpose, card_type, card_number, card_holder, expiry_date, cvv } = req.body;
        if (bank_name && bank_name != '') {
            if (purpose && purpose != '') {
                if (card_type && card_type != '') {
                    if (card_number && card_number != '' && card_number.length == 16) {
                        if (card_holder && card_holder != '') {
                            if (expiry_date && expiry_date != '' && validateDate(expiry_date)) {
                                if (cvv && cvv != '' && cvv.length == 3) {
                                    let primary = mongoConnection.useDb(constants.DEFAULT_DB);
                                    let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
                                    if (userdata && userdata.is_approved && userdata.is_approved == true) {
                                        if (cardid && cardid != '' && mongoose.Types.ObjectId.isValid(cardid)) {
                                            let obj = {
                                                bank_name: bank_name,
                                                purpose: purpose,
                                                card_type: card_type,
                                                card_number: await helper.passwordEncryptor(card_number),
                                                card_holder: card_holder,
                                                expiry_date: await helper.passwordEncryptor(expiry_date),
                                                cvv: await helper.passwordEncryptor(cvv),
                                                updatedBy: new mongoose.Types.ObjectId(req.token.userid)
                                            };
                                            if (req.files && req.files.length > 0) {
                                                async.forEachSeries(req.files, (file, next_file) => {
                                                    if (file.fieldname == 'card_photo_front') {
                                                        if (allowedContentTypes.imagearray.includes(file.mimetype)) {
                                                            var filesizeinMb = parseFloat(parseFloat(file.size) / 1048576);
                                                            if (filesizeinMb <= parseInt(process.env.ALLOWED_IMAGE_UPLOAD_SIZE)) {
                                                                AwsCloud.saveToS3(file.buffer, 'card', file.mimetype, 'cardfront').then((result) => {
                                                                    obj.card_photo_front = result.data.Key;
                                                                    next_file();
                                                                }).catch((error) => {
                                                                    return responseManager.onError(error, res);
                                                                });
                                                            } else {
                                                                return responseManager.badrequest({ message: 'Card Front Image file must be <= ' + process.env.ALLOWED_IMAGE_UPLOAD_SIZE + ' MB, please try again' }, res);
                                                            }
                                                        } else {
                                                            return responseManager.badrequest({ message: 'Invalid Card Front Image file type only image files allowed, please try again' }, res);
                                                        }
                                                    } else if (file.fieldname == 'card_photo_back') {
                                                        if (allowedContentTypes.imagearray.includes(file.mimetype)) {
                                                            var filesizeinMb = parseFloat(parseFloat(file.size) / 1048576);
                                                            if (filesizeinMb <= parseInt(process.env.ALLOWED_IMAGE_UPLOAD_SIZE)) {
                                                                AwsCloud.saveToS3(file.buffer, 'card', file.mimetype, 'cardback').then((result) => {
                                                                    obj.card_photo_back = result.data.Key;
                                                                    next_file();
                                                                }).catch((error) => {
                                                                    return responseManager.onError(error, res);
                                                                });
                                                            } else {
                                                                return responseManager.badrequest({ message: 'Card Back Image file must be <= ' + process.env.ALLOWED_IMAGE_UPLOAD_SIZE + ' MB, please try again' }, res);
                                                            }
                                                        } else {
                                                            return responseManager.badrequest({ message: 'Invalid Card Back Image file type only image files allowed, please try again' }, res);
                                                        }
                                                    }
                                                }, () => {
                                                    (async () => {
                                                        await primary.model(constants.MODELS.cards, cardModel).findByIdAndUpdate(cardid, obj);
                                                        let updatedcard = await primary.model(constants.MODELS.cards, cardModel).findById(cardid);
                                                        updatedcard.card_number = await helper.passwordDecryptor(updatedcard.card_number);
                                                        updatedcard.expiry_date = await helper.passwordDecryptor(updatedcard.expiry_date);
                                                        updatedcard.cvv = await helper.passwordDecryptor(updatedcard.cvv);
                                                        return responseManager.onSuccess('Card has been updated successfully...!', updatedcard, res);
                                                    })().catch((error) => { });
                                                });
                                            } else {
                                                await primary.model(constants.MODELS.cards, cardModel).findByIdAndUpdate(cardid, obj);
                                                let updatedcard = await primary.model(constants.MODELS.cards, cardModel).findById(cardid);
                                                updatedcard.card_number = await helper.passwordDecryptor(updatedcard.card_number);
                                                updatedcard.expiry_date = await helper.passwordDecryptor(updatedcard.expiry_date);
                                                updatedcard.cvv = await helper.passwordDecryptor(updatedcard.cvv);
                                                return responseManager.onSuccess('Card has been updated successfully...!', updatedcard, res);
                                            }
                                        } else {
                                            let obj = {
                                                bank_name: bank_name,
                                                purpose: purpose,
                                                card_type: card_type,
                                                card_number: await helper.passwordEncryptor(card_number),
                                                card_holder: card_holder,
                                                expiry_date: await helper.passwordEncryptor(expiry_date),
                                                cvv: await helper.passwordEncryptor(cvv),
                                                userid: new mongoose.Types.ObjectId(req.token.userid),
                                                createdBy: new mongoose.Types.ObjectId(req.token.userid),
                                                updatedBy: new mongoose.Types.ObjectId(req.token.userid),
                                                due_date_timestamp: 0,
                                                due_date: '',
                                                due_amount: parseFloat(0.00),
                                                timestamp: Date.now()
                                            };
                                            if (req.files && req.files.length > 0) {
                                                async.forEachSeries(req.files, (file, next_file) => {
                                                    if (file.fieldname == 'card_photo_front') {
                                                        if (allowedContentTypes.imagearray.includes(file.mimetype)) {
                                                            var filesizeinMb = parseFloat(parseFloat(file.size) / 1048576);
                                                            if (filesizeinMb <= parseInt(process.env.ALLOWED_IMAGE_UPLOAD_SIZE)) {
                                                                AwsCloud.saveToS3(file.buffer, 'card', file.mimetype, 'cardfront').then((result) => {
                                                                    obj.card_photo_front = result.data.Key;
                                                                    next_file();
                                                                }).catch((error) => {
                                                                    return responseManager.onError(error, res);
                                                                });
                                                            } else {
                                                                return responseManager.badrequest({ message: 'Card Front Image file must be <= ' + process.env.ALLOWED_IMAGE_UPLOAD_SIZE + ' MB, please try again' }, res);
                                                            }
                                                        } else {
                                                            return responseManager.badrequest({ message: 'Invalid Card Front Image file type only image files allowed, please try again' }, res);
                                                        }
                                                    } else if (file.fieldname == 'card_photo_back') {
                                                        if (allowedContentTypes.imagearray.includes(file.mimetype)) {
                                                            var filesizeinMb = parseFloat(parseFloat(file.size) / 1048576);
                                                            if (filesizeinMb <= parseInt(process.env.ALLOWED_IMAGE_UPLOAD_SIZE)) {
                                                                AwsCloud.saveToS3(file.buffer, 'card', file.mimetype, 'cardback').then((result) => {
                                                                    obj.card_photo_back = result.data.Key;
                                                                    next_file();
                                                                }).catch((error) => {
                                                                    return responseManager.onError(error, res);
                                                                });
                                                            } else {
                                                                return responseManager.badrequest({ message: 'Card Back Image file must be <= ' + process.env.ALLOWED_IMAGE_UPLOAD_SIZE + ' MB, please try again' }, res);
                                                            }
                                                        } else {
                                                            return responseManager.badrequest({ message: 'Invalid Card Back Image file type only image files allowed, please try again' }, res);
                                                        }
                                                    }
                                                }, () => {
                                                    (async () => {
                                                        let newcard = await primary.model(constants.MODELS.cards, cardModel).create(obj);
                                                        newcard.card_number = await helper.passwordDecryptor(newcard.card_number);
                                                        newcard.expiry_date = await helper.passwordDecryptor(newcard.expiry_date);
                                                        newcard.cvv = await helper.passwordDecryptor(newcard.cvv);
                                                        return responseManager.onSuccess('New card added successfully...!', newcard, res);
                                                    })().catch((error) => { });
                                                });
                                            } else {
                                                return responseManager.badrequest({ message: 'Please upload card front and back photos...' }, res);
                                            }
                                        }
                                    } else {
                                        return responseManager.badrequest({ message: 'User as not approved yet, to save card data please contact admin and get your user approved' }, res);
                                    }
                                } else {
                                    return responseManager.badrequest({ message: 'Invalid CVV Code to save card details, please try again' }, res);
                                }
                            } else {
                                return responseManager.badrequest({ message: 'Invalid Expiry date to save card details, please try again' }, res);
                            }
                        } else {
                            return responseManager.badrequest({ message: 'Invalid card holder name to save card details, please try again' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid card number to save card details, please try again' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'Invalid card type to save card details, please try again' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid card adding purpose to save card details, please try again' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'Invalid bank name to save card details, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to save card details, please try again' }, res);
    }
});
router.post('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        const { page, limit } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.is_approved && userdata.is_approved == true) {
            await primary.model(constants.MODELS.cards, cardModel).paginate({
                userid: new mongoose.Types.ObjectId(req.token.userid)
            }, {
                page,
                limit: parseInt(limit),
                sort: { timestamp: -1 },
                lean: true
            }).then((cardlist) => {
                let allCards = [];
                async.forEachSeries(cardlist.docs, (card, next_card) => {
                    (async () => {
                        card.card_number = await helper.passwordDecryptor(card.card_number);
                        card.expiry_date = await helper.passwordDecryptor(card.expiry_date);
                        card.cvv = await helper.passwordDecryptor(card.cvv);
                        allCards.push(card);
                        next_card();
                    })().catch((error) => { });
                }, () => {
                    cardlist.docs = allCards;
                    return responseManager.onSuccess('Card list...!', cardlist, res);
                });
            }).catch((error) => {
                return responseManager.onError(error, res);
            })
        } else {
            return responseManager.badrequest({ message: 'User as not approved yet, to get card data please contact admin and get your user approved' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get card details, please try again' }, res);
    }
});
router.post('/getone', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        const { cardid } = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userdata && userdata.is_approved && userdata.is_approved == true) {
            if (cardid && cardid != '' && mongoose.Types.ObjectId.isValid(cardid)) {
                let cardData = await primary.model(constants.MODELS.cards, cardModel).findById(cardid).lean();
                if (cardData.userid.toString() == req.token.userid.toString()) {
                    cardData.card_number = await helper.passwordDecryptor(cardData.card_number);
                    cardData.expiry_date = await helper.passwordDecryptor(cardData.expiry_date);
                    cardData.cvv = await helper.passwordDecryptor(cardData.cvv);
                    return responseManager.onSuccess('Card data...!', cardData, res);
                } else {
                    return responseManager.badrequest({ message: 'Invalid card id to get card data...' }, res);
                }
            } else {
                return responseManager.badrequest({ message: 'Invalid card id to get card data...' }, res);
            }
        } else {
            return responseManager.badrequest({ message: 'User as not approved yet, to get card data please contact admin and get your user approved' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get card details, please try again' }, res);
    }
});
router.post('/dueupdate', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)) {
        const { cardid, due_date, due_amount } = req.body;
        let today = Date.now()
        if(due_date && due_date != '' && parseInt(due_date) > today){
            if(due_amount && due_amount != '' && !isNaN(due_amount) && parseFloat(due_amount) > 0){
                let primary = mongoConnection.useDb(constants.DEFAULT_DB);
                let userdata = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
                if (userdata && userdata.is_approved && userdata.is_approved == true) {
                    if (cardid && cardid != '' && mongoose.Types.ObjectId.isValid(cardid)) {
                        let cardData = await primary.model(constants.MODELS.cards, cardModel).findById(cardid).lean();
                        if(cardData.userid.toString() == req.token.userid.toString()){
                            const date = new Date(due_date);
                            await primary.model(constants.MODELS.cards, cardModel).findByIdAndUpdate(cardid, {due_date_timestamp : parseInt(due_date), due_date : date, due_amount : parseFloat(due_amount)});
                            let updatedcard = await primary.model(constants.MODELS.cards, cardModel).findById(cardid).lean();
                            updatedcard.card_number = await helper.passwordDecryptor(updatedcard.card_number);
                            updatedcard.expiry_date = await helper.passwordDecryptor(updatedcard.expiry_date);
                            updatedcard.cvv = await helper.passwordDecryptor(updatedcard.cvv);
                            return responseManager.onSuccess('Card updated successfully...!', updatedcard, res);
                        }else{
                            return responseManager.badrequest({ message: 'Invalid card id to update card data...' }, res);
                        }
                    } else {
                        return responseManager.badrequest({ message: 'Invalid card id to update card data...' }, res);
                    }
                } else {
                    return responseManager.badrequest({ message: 'User not approved yet, to update card data please contact admin and get your user approved' }, res);
                }
            }else{
                return responseManager.badrequest({ message: 'Invalid due amount to update card data...' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid due date to update card data...' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to update card details, please try again' }, res);
    }
});
module.exports = router;