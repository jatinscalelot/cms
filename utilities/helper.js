const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
let response = require('./response.manager');
exports.generateAccessToken = async (userData) => {
  return jwt.sign(userData, process.env.APP_LOGIN_AUTH_TOKEN, {});
};
exports.authenticateToken = async (req, res, next) => {
  const bearerHeader = req.headers['authorization'];
  if (typeof bearerHeader !== 'undefined') {
      const bearer = bearerHeader.split(' ');
      const token = bearer[1];
      jwt.verify(token, process.env.APP_LOGIN_AUTH_TOKEN, (err, auth) => {
          if (err) {
              return response.unauthorisedRequest(res);
          } else {
              req.token = auth;
          }
      });
      next();
  } else {
      return response.unauthorisedRequest(res);
  }
};
exports.passwordEncryptor = async (passwordKeyEncrypt) => {
  try {
      var encLayer1 = CryptoJS.AES.encrypt(passwordKeyEncrypt, process.env.PASSWORD_ENCRYPTION_SECRET).toString();
      var encLayer2 = CryptoJS.DES.encrypt(encLayer1, process.env.PASSWORD_ENCRYPTION_SECRET).toString();
      var finalEncPassword = CryptoJS.TripleDES.encrypt(encLayer2, process.env.PASSWORD_ENCRYPTION_SECRET).toString();
      return finalEncPassword;
  } catch (err) {
      throw err;
  }
};
exports.passwordDecryptor = async (passwordKeyDecrypt) => {
  try {
      var decLayer1 = CryptoJS.TripleDES.decrypt(passwordKeyDecrypt, process.env.PASSWORD_ENCRYPTION_SECRET);
      var deciphertext1 = decLayer1.toString(CryptoJS.enc.Utf8);
      var decLayer2 = CryptoJS.DES.decrypt(deciphertext1, process.env.PASSWORD_ENCRYPTION_SECRET);
      var deciphertext2 = decLayer2.toString(CryptoJS.enc.Utf8);
      var decLayer3 = CryptoJS.AES.decrypt(deciphertext2, process.env.PASSWORD_ENCRYPTION_SECRET);
      var finalDecPassword = decLayer3.toString(CryptoJS.enc.Utf8);
      return finalDecPassword;
  } catch (err) {
      throw err;
  }
};
exports.bytesToMB = (bytes) => {
  return (bytes / (1024 * 1024)).toFixed(2);
};
exports.validateEmail = (email) => {
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return emailPattern.test(email);
};
exports.validateMobile = (mobile) => {
  return !/\D/.test(mobile);
};
exports.generateReferralCode = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let referralCode = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referralCode += characters.charAt(randomIndex);
  }
  return referralCode;
};
exports.makeid = (length) => {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
