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

const companyService = express();
const companyServiceApp = express();

companyService.use(cors);
companyService.use(cookieParser);
// staff.use(validateFirebaseIdToken);
companyServiceApp.use('', companyService);
companyServiceApp.use(bodyParser.json());
companyServiceApp.use(bodyParser.urlencoded({ extended: false }));

module.exports = companyServiceApp;

companyServiceApp.get('/getCompanyList', (req, res) => {

     console.info('getCompanyList');

     const respDoc: any = [];

     db.collection('company').orderBy('name', 'asc').get().then(function (companySnapshot) {

          companySnapshot.forEach(element => {
               respDoc.push({ key: element.id, ...element.data() as {} });
          });

          res.send({ status: 'Complete', data: respDoc, date: new Date() });

     }).catch(respError => {
          res.send({ status: 'Error', data: respError, date: new Date() });
     });
})

companyServiceApp.get('/getCompanyGroupList', (req, res) => {

     console.info('getCompanyGroupList');

     const respDoc: any = [];

     db.collection('company_group').orderBy('name', 'asc').get().then(function (companySnapshot) {

          companySnapshot.forEach(element => {
               respDoc.push({ key: element.id, ...element.data() as {} });
          });

          res.send({ status: 'Complete', data: respDoc, date: new Date() });

     }).catch(respError => {
          res.send({ status: 'Error', data: respError, date: new Date() });
     });
})

companyServiceApp.get('/getCompanyInGroup/:groupName', (req, res) => {

     console.info('getCompanyInGroup');

     const groupName = req.params.groupName
     const respDoc: any = [];

     db.collection('company').where('group', '==', groupName).orderBy('name', 'asc').get().then(function (companySnapshot) {

          companySnapshot.forEach(element => {
               respDoc.push({ key: element.id, ...element.data() as {} });
          });

          res.send({ status: 'Complete', data: respDoc, date: new Date() });

     }).catch(respError => {
          res.send({ status: 'Error', data: respError, date: new Date() });
     });
})

companyServiceApp.get('/getCompany/:companyId', (req, res) => {

     console.info('getCompany');

     const companyId = req.params.companyId
     const respDoc: any = {};
     const relationList: any = []

     db.collection('company').doc(companyId).get().then(function (companySnapshot) {

          respDoc.company = { key: companySnapshot.id, ...companySnapshot.data() as {} };

          const relationPromise = new Promise((resolve, reject) => {

               const companyIdList: any = []
               companyIdList.push(companyId)

               db.collection('relation').where('companyFrom', '==', companyId).get().then(relationFromResp => {
                    relationFromResp.forEach(relationEle => {
                         const relationRespDoc: any = { key: relationEle.id, ...relationEle.data() as {} };
                         relationList.push(relationRespDoc)
                    });
                    db.collection('relation').where('companyTo', '==', companyId).get().then(relationToResp => {
                         relationToResp.forEach(relationEle => {
                              const relationRespDoc: any = { key: relationEle.id, ...relationEle.data() as {} };
                              relationList.push(relationRespDoc)
                         });
                         resolve(relationList)
                    }).catch(error => {
                         reject(error)
                    })
               }).catch(error => {
                    reject(error)
               })
          })

          const promiseArray: any = []

          relationPromise.then((resp: any) => {
               resp.forEach((relation: any) => {
                    if (relation.companyFrom !== companyId) {
                         console.log('get company data (From)', relation.companyFrom)
                         promiseArray.push(
                              new Promise((resolve, reject) => {
                                   db.collection('company').doc(relation.companyFrom).get().then(companyRelationSnapshot => {
                                        const compResp = { key: companyRelationSnapshot.id, ...companyRelationSnapshot.data() as {} };
                                        console.log('relationCompData', compResp)
                                        resolve(compResp)
                                   }).catch(error => {
                                        reject(error)
                                   });
                              })
                         )
                    } else {
                         console.log('get company data (To)', relation.companyTo)
                         promiseArray.push(
                              new Promise((resolve, reject) => {
                                   db.collection('company').doc(relation.companyTo).get().then(companyRelationSnapshot => {
                                        const compResp = { key: companyRelationSnapshot.id, ...companyRelationSnapshot.data() as {} };
                                        console.log('relationCompData', compResp)
                                        resolve(compResp)
                                   }).catch(error => {
                                        reject(error)
                                   });
                              })
                         )
                    }
               });

               Promise.all(promiseArray).then((promiseResp: any) => {
                    console.log('Relation Promise all', promiseResp)
                    console.log('promiseResp', promiseResp)

                    relationList.forEach((element: any) => {
                         promiseResp.forEach((CompDataElement: any) => {
                              if (CompDataElement.key === element.companyFrom) {
                                   element.companyFrom_data = CompDataElement
                                   element.companyTo_data = respDoc.company
                              }
                              if (CompDataElement.key === element.companyTo) {
                                   element.companyFrom_data = respDoc.company
                                   element.companyTo_data = CompDataElement
                              }
                         });
                    });

                    respDoc.relation = relationList
                    res.send({ status: 'Complete', date: new Date(), data: respDoc });
               }).catch(respError => {
                    res.send({ status: 'Error', data: respError, date: new Date() });
               });

          }).catch(respError => {
               res.send({ status: 'Error', data: respError, date: new Date() });
          });
     }).catch(respError => {
          res.send({ status: 'Error', data: respError, date: new Date() });
     });
})

companyServiceApp.get('/getCompanyWithoutGroupList', (req, res) => {

     console.info('getCompanyWithoutGroupList');

     const respDoc: any = [];

     db.collection('company').orderBy('name', 'asc').get().then(function (companySnapshot) {

          companySnapshot.forEach(element => {
               const elementData = element.data()
               if (elementData.industry !== 'Company Group') {
                    respDoc.push({ key: element.id, ...element.data() as {} });
               }
          });

          res.send({ status: 'Complete', data: respDoc, date: new Date() });

     }).catch(respError => {
          res.send({ status: 'Error', data: respError, date: new Date() });
     });
})

companyServiceApp.post('/createCompany', (req, res) => {

     console.info('createCompany', req.body);

     const company = req.body.company

     const companyDoc = {
          taxId: company.taxId,
          group: company.group ,
          industry: company.industry,
          name: company.name,
          value: Number.parseInt(company.value),
          created: new Date(),
          profile: {
               member: Number.parseInt((company.member? company.member :1)),
               country: company.country
          }
     }

     db.collection('company').add(companyDoc).then(function (resultSnapshot) {
          res.send({ status: 'Complete', date: new Date(), data: resultSnapshot.id });
     }).catch(respError => {
          res.send({ status: 'Error', date: new Date(), data: respError });
     });

})

companyServiceApp.post('/editCompany', (req, res) => {

     console.info('editCompany', req.body);

     const company = req.body.company

     const companyDoc = {
          taxId: company.taxId,
          group: company.group ,
          industry: company.industry,
          name: company.name,
          value: Number.parseInt(company.value),
          profile: {
               member: Number.parseInt((company.profile.member? company.profile.member :1)),
               country: company.profile.country
          }
     }

     console.info('companyDoc', companyDoc);

     db.collection('company').doc(company.key).update(companyDoc).then(function (resultSnapshot) {
          res.send({ status: 'Complete', date: new Date(), data: resultSnapshot });
     }).catch(respError => {
          res.send({ status: 'Error', date: new Date(), data: respError });
     });

})

companyServiceApp.post('/deleteCompany', (req, res) => {

     console.info('deleteCompany', req.body);

     const company = req.body.company
     const relationList = req.body.relation

     let promiseArray : any = []

     relationList.forEach((relation : any) => {
          promiseArray.push(new Promise((resolve, reject) => {
               db.collection('relation').doc(relation.key).delete().then(resp => {
                    resolve(resp)
               }).catch(error => {
                    reject(error)
               })
          }))
     });

     Promise.all(promiseArray).then(resp => {
          db.collection('company').doc(company.key).delete().then(function (resultSnapshot) {
               res.send({ status: 'Complete', date: new Date(), data: resultSnapshot });
          }).catch(respError => {
               res.send({ status: 'Error', date: new Date(), data: respError });
          });
     }).catch(error => {
          res.send({ status: 'Error', date: new Date(), data: error });
     })
})

companyServiceApp.post('/importCompanyByList', (req, res) => {

     console.info('importCompanyByList');

     const companyList: any[] = req.body.companyList
     console.info('importCompanyByList', companyList);
     const promiseArray: any = []

     companyList.forEach(company => {
          promiseArray.push(
               new Promise((resolve, reject) => {
                    const companyDoc = {
                         country: company.country,
                         group: company.group,
                         industry: company.industry,
                         name: company.name,
                         taxId: company.taxId,
                         value: company.value,
                         created: new Date()
                    }
                    db.collection('company').add(companyDoc).then(function (resultSnapshot) {
                         console.info('imported', company.name);
                         resolve(company.name)
                    }).catch(respError => {
                         reject(respError)
                    });
               })
          )
     });

     console.info('Waiting all complete');
     Promise.all(promiseArray).then(resp => {
          res.send({ status: 'Complete', date: new Date(), data: resp });
     }).catch(respError => {
          res.send({ status: 'Error', date: new Date(), data: respError });
     })

})

companyServiceApp.post('/updateCompanyByList', (req, res) => {

     console.info('updateCompanyByList');

     const companyList: any[] = req.body.companyList
     console.info('importCompanyByList', companyList);
     const promiseArray: any = []

     companyList.forEach(company => {
          promiseArray.push(
               new Promise((resolve, reject) => {
                    const companyDoc = {
                         country: company.country,
                         group: company.group,
                         industry: company.industry,
                         name: company.name,
                         taxId: company.taxId,
                         value: Number.parseInt(company.value),
                         created: new Date()
                    }
                    db.collection('company').doc(company.key).set(companyDoc).then(function (resultSnapshot) {
                         console.info('imported', company.name);
                         resolve(company.name)
                    }).catch(respError => {
                         reject(respError)
                    });
               })
          )
     });

     console.info('Waiting all complete');
     Promise.all(promiseArray).then(resp => {
          res.send({ status: 'Complete', data: resp });
     }).catch(respError => {
          res.send({ status: 'Error', date: new Date(), data: respError });
     })

})

companyServiceApp.post('/randomIndustryByList', (req, res) => {

     console.info('randomIndustryByList');

     const companyList: any[] = req.body.companyList
     const industryList: any[] = req.body.industryList
     console.info('importCompanyByList', companyList);
     const promiseArray: any = []

     companyList.forEach(company => {
          promiseArray.push(
               new Promise((resolve, reject) => {
                    const companyDoc = {
                         country: company.country,
                         group: company.group,
                         industry: industryList[Math.floor(Math.random() * industryList.length)],
                         name: company.name,
                         taxId: company.taxId,
                         value: Number.parseInt(company.value),
                         created: new Date()
                    }
                    db.collection('company').doc(company.key).set(companyDoc).then(function (resultSnapshot) {
                         console.info('imported', company.name);
                         resolve(company.name)
                    }).catch(respError => {
                         reject(respError)
                    });
               })
          )
     });

     console.info('Waiting all complete');
     Promise.all(promiseArray).then(resp => {
          res.send({ status: 'Complete', date: new Date(), data: resp });
     }).catch(respError => {
          res.send({ status: 'Error', date: new Date(), data: respError });
     })

})

companyServiceApp.get('/getIndustry', (req, res) => {

     const respDoc: any = {}

     let promiseArray: any = []
     const companyList: any = []
     const relationList: any = []
     let configulation: any = {}

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
          }),
          new Promise((resolve, reject) => {
               console.log('promise getConfigulation')
               db.collection('configulation').get().then(resp => {
                    resp.forEach(element => {
                         configulation = { key: element.id, ...element.data() as {} }
                    });
                    resolve('Complete')
               }).catch(error => {
                    reject(error)
               })

          })
     ]

     Promise.all(promiseArray).then(resp => {
          console.log('promise all')

          const companyIndustryList: any = []
          const relationIndustryList: any = []

          configulation.industry.forEach((industry: any) => {
               companyIndustryList.push({
                    key: industry.name,
                    name: industry.name,
                    value: 0,
                    amount : 0,
                    industry: industry.name,
                    taxId: 'industry',
                    group: industry.name
               })
          });

          companyList.forEach((company: any) => {
               companyIndustryList.forEach((industry: any) => {
                    if (industry.name === company.industry) {
                         industry.value += company.value
                         industry.amount ++
                    }
               });
          });

          respDoc.companyIndustryList = companyIndustryList

          relationList.forEach((relation: any) => {
               const compFrom: any = companyList.find((x: any) => x.key === relation.companyFrom);
               const compTo: any = companyList.find((x: any) => x.key === relation.companyTo);

               if (compFrom.industry !== compTo.industry) {
                    const relationKey = compFrom.industry + '-' + compTo.industry

                    const relationIndustryFindResult = relationIndustryList.find((x: any) => x.key === relationKey);
                    console.log('relationIndustryFindResult', relationIndustryFindResult)

                    if (relationIndustryFindResult !== undefined) {
                         console.log('update relation')
                         relationIndustryFindResult.cashAmount += relation.cashAmount
                    } else {
                         console.log('new relation')
                         const relationIndustry = {
                              key: relationKey,
                              cashAmount: relation.cashAmount,
                              companyFrom: compFrom.industry,
                              companyFrom_data: {
                                   name: compFrom.industry
                              },
                              companyTo: compTo.industry,
                              companyTo_data: {
                                   name: compTo.industry
                              },
                              relationType: 'industry'
                         }
                         relationIndustryList.push(relationIndustry)
                    }
               }


          });

          respDoc.relationIndustryList = relationIndustryList

          res.send({ status: 'Complete', date: new Date(), data: respDoc });

     }).catch(respError => {
          console.log('promise error', respError)
          res.send({ status: 'Error', date: new Date(), data: respError });
     })

})
