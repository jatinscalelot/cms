let admin = require('firebase-admin');
let serviceAccount = require('./firebase_serviceaccount.json');
const notify = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
async function sendNotification(token, payload) {
    notify.messaging().sendToDevice(token, payload).then( response => {
        response.results.forEach((result, index) => {
            const error = result.error;
            if (error) {
                console.error('Failure sending notification to', token, error);
            } else{
                console.log('Sucessfully sent to '+ token);
            }
        });
    }).catch(err => console.log(err));
};
module.exports = { sendNotification };