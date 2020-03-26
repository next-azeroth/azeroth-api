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

const reportService = express();
const reportServiceApp = express();

reportService.use(cors);
reportService.use(cookieParser);
// staff.use(validateFirebaseIdToken);
reportServiceApp.use('', reportService);
reportServiceApp.use(bodyParser.json());
reportServiceApp.use(bodyParser.urlencoded({ extended: false }));

module.exports = reportServiceApp;

reportServiceApp.get('/getIndustryReport', (req, res) => {

     console.info('getRelationListByIndustry');

     const promiseArray = []

     promiseArray.push(new Promise((resolve, reject) => {
          db.collection('relation').get().then(resp => {
               const relationList: any = []
               resp.forEach(relation => {
                    relationList.push({ key: relation.id, ...relation.data() as {} })
               })
               resolve({
                    'relation': relationList
               })
          }).catch(error => {
               reject({ 'relation': error })
          })
     }))

     promiseArray.push(new Promise((resolve, reject) => {
          db.collection('company').get().then(resp => {
               const companyList: any = []
               resp.forEach(company => {
                    companyList.push({ key: company.id, ...company.data() as {} })
               })
               resolve({
                    'company': companyList
               })
          }).catch(error => {
               reject({ 'company': error })
          })
     }))

     promiseArray.push(new Promise((resolve, reject) => {
          db.collection('configulation').get().then(resp => {
               const configulationList: any = []
               resp.forEach(configulation => {
                    configulationList.push({ key: configulation.id, ...configulation.data() as {} })
               })
               resolve({
                    'configulation': configulationList
               })
          }).catch(error => {
               reject({ 'configulation': error })
          })
     }))

     Promise.all(promiseArray).then((promiseResp: any) => {
          try {
               let relationList : any = []
               let companyList : any = []
               let configulationList : any = []

               // console.log('all promise resp', promiseResp)

               promiseResp.forEach((element : any) => {
                    if (Object.keys(element).pop() == 'relation'){
                         relationList = element.relation
                    }else if (Object.keys(element).pop() == 'company'){
                         companyList = element.company
                    }else{
                         configulationList = element.configulation
                    }
               });

               // console.log('companyList' , companyList)
               // console.log('configulationList' , configulationList)

               relationList.forEach((relation: any) => {
                    companyList.forEach((company: any) => {
                         if (relation.companyFrom == company.key) {
                              relation.companyFrom_data = company
                         } 
                         if (relation.companyTo == company.key) {
                              relation.companyTo_data = company
                         }
                    });
               });

               // console.log('relationList' , relationList)

               let industryList : any =  []
               // console.log('configulationList.industry' , configulationList[0].industry)
               configulationList[0].industry.forEach((industry : any) => {
                    // console.log('industry' , industry)
                    let industry_data : any = {
                         inflow : 0,
                         outflow : 0,
                         internalflow : 0,
                         company_value : 0,
                         company_amount : 0
                    }
                    // console.log('cashFlow' , cashFlow)
                    industryList.push({ industry_data : industry_data , ... industry as {} })
               });

               console.log('industryList' , industryList)

               relationList.forEach((relation: any) => {
                    industryList.forEach((industry : any) => {
                         if(relation.companyFrom_data.industry == industry.name){
                              industry.industry_data.company_value += relation.companyFrom_data.value
                              industry.industry_data.company_amount++
                              if(relation.companyFrom_data.industry == relation.companyTo_data.industry){
                                   industry.industry_data.internal += relation.cashAmount
                              }else {
                                   industry.industry_data.outflow += relation.cashAmount
                              }
                         }else if(relation.companyTo_data.industry == industry.name){
                              if(relation.companyFrom_data.industry == relation.companyTo_data.industry){
                                   industry.industry_data.internal += relation.cashAmount
                              }else {
                                   industry.industry_data.inflow += relation.cashAmount
                              }
                         }
                    })
               })

               res.send({ status: 'Complete', date: new Date(), data: industryList });
          } catch (error) {
               res.send({ status: 'Error', date: new Date(), data: error });
          }



     }).catch(error => {
          res.send({ status: 'Error', date: new Date(), data: error });
     })

})

reportServiceApp.get('/getIndustryRelationReport', (req, res) => {

     console.info('getIndustryRelationReport');

     const promiseArray = []

     promiseArray.push(new Promise((resolve, reject) => {
          db.collection('relation').get().then(resp => {
               const relationList: any = []
               resp.forEach(relation => {
                    relationList.push({ key: relation.id, ...relation.data() as {} })
               })
               resolve({
                    'relation': relationList
               })
          }).catch(error => {
               reject({ 'relation': error })
          })
     }))

     promiseArray.push(new Promise((resolve, reject) => {
          db.collection('company').get().then(resp => {
               const companyList: any = []
               resp.forEach(company => {
                    companyList.push({ key: company.id, ...company.data() as {} })
               })
               resolve({
                    'company': companyList
               })
          }).catch(error => {
               reject({ 'company': error })
          })
     }))

     promiseArray.push(new Promise((resolve, reject) => {
          db.collection('configulation').get().then(resp => {
               const configulationList: any = []
               resp.forEach(configulation => {
                    configulationList.push({ key: configulation.id, ...configulation.data() as {} })
               })
               resolve({
                    'configulation': configulationList
               })
          }).catch(error => {
               reject({ 'configulation': error })
          })
     }))

     Promise.all(promiseArray).then((promiseResp: any) => {
          try {
               let relationList : any = []
               let companyList : any = []
               let configulationList : any = []

               // console.log('all promise resp', promiseResp)

               promiseResp.forEach((element : any) => {
                    if (Object.keys(element).pop() == 'relation'){
                         relationList = element.relation
                    }else if (Object.keys(element).pop() == 'company'){
                         companyList = element.company
                    }else{
                         configulationList = element.configulation
                    }
               });

               // console.log('companyList' , companyList)
               // console.log('configulationList' , configulationList)

               relationList.forEach((relation: any) => {
                    companyList.forEach((company: any) => {
                         if (relation.companyFrom == company.key) {
                              relation.companyFrom_data = company
                         } 
                         if (relation.companyTo == company.key) {
                              relation.companyTo_data = company
                         }
                    });
               });

               // console.log('relationList' , relationList)

               let industryList : any =  []
               // console.log('configulationList.industry' , configulationList[0].industry)
               configulationList[0].industry.forEach((industry : any) => {
                    // console.log('industry' , industry)
                    let industry_data : any = {
                         inflow : 0,
                         outflow : 0,
                         internalflow : 0,
                         company_value : 0,
                         company_amount : 0
                    }
                    // console.log('cashFlow' , cashFlow)
                    industryList.push({ industry_data : industry_data , ... industry as {} })
               });

               console.log('industryList' , industryList)

               relationList.forEach((relation: any) => {
                    industryList.forEach((industry : any) => {
                         if(relation.companyFrom_data.industry == industry.name){
                              industry.industry_data.company_value += relation.companyFrom_data.value
                              industry.industry_data.company_amount++
                              if(relation.companyFrom_data.industry == relation.companyTo_data.industry){
                                   industry.industry_data.internal += relation.cashAmount
                              }else {
                                   industry.industry_data.outflow += relation.cashAmount
                              }
                         }else if(relation.companyTo_data.industry == industry.name){
                              if(relation.companyFrom_data.industry == relation.companyTo_data.industry){
                                   industry.industry_data.internal += relation.cashAmount
                              }else {
                                   industry.industry_data.inflow += relation.cashAmount
                              }
                         }
                    })
               })

               res.send({ status: 'Complete', date: new Date(), data: industryList });
          } catch (error) {
               res.send({ status: 'Error', date: new Date(), data: error });
          }



     }).catch(error => {
          res.send({ status: 'Error', date: new Date(), data: error });
     })

})



