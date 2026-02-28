const admin = require("firebase-admin");

// IMPORTANT: Make sure this file is in your .gitignore
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://text-editor-43ba4-default-rtdb.firebaseio.com" // Replace with your Realtime Database URL
});

const db = admin.database();
console.log("database initialize");
module.exports = { db };