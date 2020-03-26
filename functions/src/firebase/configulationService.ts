import * as admin from 'firebase-admin';
const cookieParser = require('cookie-parser')();
import * as express from 'express';
import * as bodyParser from "body-parser";

const db = admin.firestore();


// const validateFirebaseIdToken = (req: any, res: any, next: any) => {
//      console.log('Check if request is authorized with Firebase ID token');

//      if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
//           !(req.cookies && req.cookies.__session)) {
//           console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
//                'Make sure you authorize your request by providing the following HTTP header:',
//                'Authorization: Bearer <Firebase ID Token>',
//                'or by passing a "__session" cookie.');
//           res.status(403).send({ status: 'Error', data: 'Unauthorized' });
//           return;
//      }

//      let idToken;
//      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
//           console.log('Found "Authorization" header');
//           // Read the ID Token from the Authorization header.
//           idToken = req.headers.authorization.split('Bearer ')[1];
//      } else if (req.cookies) {
//           console.log('Found "__session" cookie');
//           // Read the ID Token from cookie.
//           idToken = req.cookies.__session;
//      } else {
//           // No cookie
//           res.status(403).send({ status: 'Error', data: 'Unauthorized' });
//           return;
//      }

//      admin.auth().verifyIdToken(idToken).then((decodedIdToken) => {
//           console.log('ID Token correctly decoded', decodedIdToken);
//           req.user = decodedIdToken;
//           return next();
//      }).catch((error) => {
//           console.error('Error while verifying Firebase ID token:', error);
//           res.status(403).send({ status: 'Error', data: 'Unauthorized' });
//      });
// };


const cors = require('cors')({ origin: true });

const configulationService = express();
const configulationServiceApp = express();

configulationService.use(cors);
configulationService.use(cookieParser);
// staff.use(validateFirebaseIdToken);
configulationServiceApp.use('', configulationService);
configulationServiceApp.use(bodyParser.json());
configulationServiceApp.use(bodyParser.urlencoded({ extended: false }));

module.exports = configulationServiceApp;

configulationServiceApp.get('/getConfigulation', (req, res) => {

     console.info('getConfigulation');

     let respDoc : any = {};

     db.collection('configulation').get().then(function (relationSnapshot) {

          relationSnapshot.forEach(element => {
               respDoc = { key: element.id, ...element.data() as {} };  
          });
          
          res.send({  status: 'Complete' , date : new Date(), data: respDoc });
          
     }).catch(respError => {
          res.send({  status: 'Error' , date : new Date(), data: respError });
     });
})

configulationServiceApp.post('/updateConfigulation', (req, res) => {

     console.info('updateConfigulation');

     const config = req.body.configulation
     let respDoc : any = {};

     db.collection('configulation').get().then(function (relationSnapshot) {

          relationSnapshot.forEach(element => {
               respDoc = { key: element.id, ...element.data() as {} };  
          });

          db.collection('configulation').doc(respDoc.key).update(config).then(function (updateSnapshot) {
               res.send({  status: 'Complete' , date : new Date(), data: respDoc });
          }).catch(respError => {
          res.send({  status: 'Error' , date : new Date(), data: respError });
     });

     }).catch(respError => {
          res.send({  status: 'Error' , date : new Date(), data: respError });
     });


})
