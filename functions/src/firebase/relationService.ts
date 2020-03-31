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

const relationService = express();
const relationServiceApp = express();

relationService.use(cors);
relationService.use(cookieParser);
// staff.use(validateFirebaseIdToken);
relationServiceApp.use('', relationService);
relationServiceApp.use(bodyParser.json());
relationServiceApp.use(bodyParser.urlencoded({ extended: false }));

module.exports = relationServiceApp;

relationServiceApp.get('/getRelationList', (req, res) => {

     console.info('getRelationList');

     const respDoc: any = [];

     db.collection('relation').get().then(function (relationSnapshot) {

          relationSnapshot.forEach(element => {
               respDoc.push({ key: element.id, ...element.data() as {} });
          });

          res.send({ status: 'Complete', date: new Date(), data: respDoc });

     }).catch(respError => {
          res.send({ status: 'Error', date: new Date(), data: respError });
     });
})

relationServiceApp.post('/createRelation', (req, res) => {

     console.info('createRelation', req.body);

     const relation = req.body.relation

     const respDoc: any = {};

     const relationDoc = {
          companyFrom: relation.companyFrom,
          companyTo: relation.companyTo,
          relationType: relation.relationType,
          relationDetail: relation.relationDetail,
          cashAmount: Number.parseInt(relation.cashAmount),
          created: new Date()
     }

     db.collection('relation').add(relationDoc).then(function (resultSnapshot) {
          res.send({ status: 'Complete', date: new Date(), data: respDoc });
     }).catch(respError => {
          res.send({ status: 'Error', date: new Date(), data: respError });
     });

})

relationServiceApp.post('/importRelationByList', (req, res) => {

     console.info('importRelationByList');

     const relationList: any[] = req.body.relationList
     console.info('importRelationByList', relationList);
     const promiseArray: any = []

     relationList.forEach(relation => {
          promiseArray.push(
               new Promise((resolve, reject) => {
                    const relationDoc = {
                         companyFrom: relation.companyFrom,
                         companyTo: relation.companyTo,
                         relationType: relation.relationType,
                         relationDetail: relation.relationDetail,
                         cashAmount: Number.parseInt(relation.cashAmount),
                         created: new Date()
                    }

                    db.collection('relation').add(relationDoc).then(function (resultSnapshot) {
                         console.info('imported', relation.companyFrom, relation.companyTo);
                         resolve(relation.companyFrom + '-' + relation.companyTo)
                    }).catch(respError => {
                         reject(respError)
                    });
               })
          )
     })

     console.info('Waiting all complete');
     Promise.all(promiseArray).then(resp => {
          res.send({ status: 'Complete', date: new Date(), data: resp });
     }).catch(respError => {
          res.send({ status: 'Error', date: new Date(), data: respError });
     })

})

relationServiceApp.get('/getRelationByCompany/:companyId', (req, res) => {

     console.info('getRelationByCompany');

     const companyId = req.params.companyId

     const respDoc: any = [];
     let outflow = 0
     let inflow = 0
     const relateCompanyIdList: any = []


     db.collection('relation').where('companyFrom', '==', companyId).get().then(function (relationFromSnapshot) {

          relationFromSnapshot.forEach(elementFrom => {
               const fromData: any = { key: elementFrom.id, ...elementFrom.data() as {} }
               outflow += fromData.cashAmount
               respDoc.push(fromData);
          });

          db.collection('relation').where('companyTo', '==', companyId).get().then(function (relationToSnapshot) {

               relationToSnapshot.forEach(elementTo => {
                    const toData: any = { key: elementTo.id, ...elementTo.data() as {} }
                    inflow += toData.cashAmount
                    respDoc.push(toData);
               });

               // get relation Company
               respDoc.forEach((relateCompany: any) => {
                    if (relateCompany.companyFrom === companyId) {
                         relateCompanyIdList.push(relateCompany.companyTo)
                    } else {
                         relateCompanyIdList.push(relateCompany.companyFrom)
                    }
               });

               const resData = {
                    'cashflow': {
                         'inflow': inflow,
                         'outflow': outflow
                    },
                    'relate_company': relateCompanyIdList,
                    'data': respDoc
               }
               res.send({ status: 'Complete', date: new Date(), data: resData });

          }).catch(respError => {
               res.send({ status: 'Error', date: new Date(), data: respError });
          });

     }).catch(respError => {
          res.send({ status: 'Error', date: new Date(), data: respError });
     });

})

relationServiceApp.get('/getRelationByIndustry/:industry', (req, res) => {

     console.info('getRelationByIndustry');

     const industry = req.params.industry

     const respDoc: any = {}

     let promiseArray: any = []
     const companyList: any = []
     const relationList: any = []
     const relateCompanyIdList: any = []

     promiseArray = [
          new Promise((resolve, reject) => {
               console.log('promise getCompanyList')
               db.collection('company').get().then(resp => {
                    resp.forEach(element => {
                         companyList.push({ key: element.id, ...element.data() as {} })
                    });
                    resolve('Complete')
               }).catch((error: any) => {
                    reject(error)
               })
          }),
          new Promise((resolve, reject) => {
               console.log('promise getCompanyList')
               db.collection('relation').get().then((resp: any) => {
                    resp.forEach((element: any) => {
                         relationList.push({ key: element.id, ...element.data() as {} })
                    });
                    resolve('Complete')
               }).catch(error => {
                    reject(error)
               })
          })
     ]

     Promise.all(promiseArray).then(resp => {
          console.log('promise all')

          let inflow = 0
          let outflow = 0

          relationList.forEach((relation: any) => {
               if (relation.from === industry) {
                    const fromData: any = { key: relation.key, ...relation.data() as {} }
                    respDoc.push(fromData)
                    outflow += relation.cashAmount
                    relateCompanyIdList.push(relation.key)
               } else if (relation.to === industry) {
                    const toData: any = { key: relation.key, ...relation.data() as {} }
                    respDoc.push(toData)
                    inflow += relation.cashAmount
                    relateCompanyIdList.push(relation.key)
               }
          });

          const resData = {
               'cashflow': {
                    'inflow': inflow,
                    'outflow': outflow
               },
               'relate_company': relateCompanyIdList,
               'data': respDoc
          }
          res.send({ status: 'Complete', date: new Date(), data: resData });
     }).catch(respError => {
          res.send({ status: 'Error', date: new Date(), data: respError });
     });

})

relationServiceApp.post('/editRelation', (req, res) => {

     console.info('editRelation', req.body);

     const relation = req.body

     const respDoc: any = {};

     const relationDoc = {
          relationType: relation.relationType,
          relationDetail: relation.relationDetail,
          cashAmount: Number.parseInt(relation.cashAmount)
     }

     console.info('relationDoc', relationDoc);

     db.collection('relation').doc(relation.key).update(relationDoc).then(function (resultSnapshot) {
          res.send({ status: 'Complete', date: new Date(), data: respDoc });
     }).catch(respError => {
          res.send({ status: 'Error', date: new Date(), data: respError });
     });

})

relationServiceApp.post('/deleteRelation', (req, res) => {

     console.info('deleteRelation', req.body);

     const relationKey = req.body.key

     db.collection('relation').doc(relationKey).delete().then(function (resultSnapshot) {
          res.send({ status: 'Complete', date: new Date(), data: resultSnapshot });
     }).catch(respError => {
          res.send({ status: 'Error', date: new Date(), data: respError });
     });

})
