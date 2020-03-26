import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import { firebaseConfig } from "./config/firebase.config";

admin.initializeApp(firebaseConfig);

const db = admin.firestore();
const settings = {/* your settings... */ timestampsInSnapshots: true };
db.settings(settings);

const companyServiceApp = require('./firebase/companyService')
exports.companyServiceAPI = functions.https.onRequest(companyServiceApp);

const relationServiceApp = require('./firebase/relationService')
exports.relationServiceAPI = functions.https.onRequest(relationServiceApp);

const configulationServiceApp = require('./firebase/configulationService')
exports.configulationServiceAPI = functions.https.onRequest(configulationServiceApp);

const reportServiceApp = require('./firebase/reportService')
exports.reportServiceAPI = functions.https.onRequest(reportServiceApp);

