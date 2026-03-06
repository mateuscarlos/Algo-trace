const admin = require("firebase-admin");
try {
  const serviceAccount = require("./serviceAccountKey.json");
  admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
  });
} catch(e) {
  admin.initializeApp(); // relies on credentials if exist
}

const db = admin.firestore();
async function check() {
  const snapshot = await db.collection('traces').orderBy('savedAt', 'desc').limit(1).get();
  if (snapshot.empty) {
      console.log('No traces found.');
      return;
  }
  const trace = snapshot.docs[0].data();
  console.log('Trace Title:', trace.title);
  
  if (trace.trace && Array.isArray(trace.trace.steps)) {
      const steps = trace.trace.steps;
      console.log(`Steps count: ${steps.length}`);
      const withAudio = steps.filter(s => s.audioUrl);
      console.log(`Steps with audioUrl: ${withAudio.length}`);
      if (withAudio.length > 0) {
          console.log(`First audioUrl: ${withAudio[0].audioUrl}`);
      }
  } else {
      console.log('Invalid trace format');
  }
  process.exit(0);
}

check().catch(console.error);
