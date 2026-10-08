// seed.js: fills Firestore with sample data (one record per important status).
//
// Setup:   npm install firebase-admin
// Emulator (recommended):
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node seed.js
//   (add FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 if CREATE_AUTH_USERS is true)
// Real project (needs SERVICE_ACCOUNT_PATH): node seed.js --force
//
// Every document has a fixed ID, so re-running overwrites instead of duplicating.
// Dates are written as plain Date values (Malaysia time, +08:00); Firestore stores them as Timestamps.
 
import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
const app = initializeApp({
  credential: cert(JSON.parse(readFileSync("./secrets/service-account.json", "utf8"))),
});

const db = getFirestore(app);
 
const PROJECT_ID = "bit216-pear2pear";            // the Firebase project id
const SERVICE_ACCOUNT_PATH = "./secrets/service-account.json";  // path to service account key JSON
 
// Also create matching Firebase Auth users (same UIDs) so you can log in as them
const CREATE_AUTH_USERS = false;
const TEST_PASSWORD = "Test1234!"; // local testing only

// ---------- Users: Active, Pending, Inactive + one volunteer ----------
const users = [
  { UID: "user001", email:"b2300490@helplive.edu.my", studentID: "B2300490", name: "Freddy Fazbear", accStatus: "Active",   isVolunteer: true },
  { UID: "user002", email:"b2401344@helplive.edu.my", studentID: "B2401344", name: "Cheeky Chiica",    accStatus: "Pending",  isVolunteer: true },
  { UID: "user003", email:"b2401411@helplive.edu.my", studentID: "B2300003", name: "Bonnie Bun",    accStatus: "Inactive", isVolunteer: true },
  { UID: "user004", email: "hafiz.ismail@example.com", studentID: "B2300004", name: "Hafiz Ismail",  accStatus: "Active",   isVolunteer: false  },
];

// ---------- Volunteer profile ----------
const volunteers = [
  { UID: "user001", volCategories: "Academic Support;New Student Support;General Student Support", skills: "High-achiever;Problem-solver", prefSupportMode: "Virtual", avgRating: 5.0},
  { UID: "user002", volCategories: "Academic Support;Technology Support", skills: "Patience;Tech Wiz", prefSupportMode: "Physical", avgRating: 4.5 },
  { UID: "user003", volCategories: "General Student Support", skills: "Friendly", prefSupportMode: "Physical", avgRating: 3.5}
];

// ---------- Availability: available + unavailable ----------
const availability = [
  { availID: "avail001", volUID: "user001", dayOfWeek: "Monday",    availTimeSlot: 10, isAvailable: true  },
  { availID: "avail002", volUID: "user001", dayOfWeek: "Monday",    availTimeSlot: 14, isAvailable: true  },
  { availID: "avail003", volUID: "user001", dayOfWeek: "Wednesday", availTimeSlot: 14, isAvailable: true  },
  { availID: "avail004", volUID: "user003", dayOfWeek: "Wednesday", availTimeSlot: 16, isAvailable: true  },
  { availID: "avail005", volUID: "user003", dayOfWeek: "Friday",    availTimeSlot: 9,  isAvailable: false },
];

// ---------- Support requests: Pending, Accepted, Rejected, Cancelled ----------
// plus one "Scheduled" request per session below (req005 to req009)
// All from the Active student (user004) to the Active volunteer (user001).
const supportRequests = [
  { reqID: "req001", studID: "user004", volID: "user001", title: "Help with calculus revision",      description: "I'm struggling with integration before my midterm and could use a walkthrough.", category: "Academic Support", reqStatus: "Pending",   reqTimestamp: new Date("2026-10-06T09:00:00+08:00") },
  { reqID: "req002", studID: "user004", volID: "user001", title: "Statistics homework walkthrough",  description: "Need help understanding hypothesis testing for this week's homework.",          category: "Academic Support", reqStatus: "Accepted",  reqTimestamp: new Date("2026-10-05T09:00:00+08:00") },
  { reqID: "req003", studID: "user004", volID: "user001", title: "Last-minute thesis proofreading",  description: "Could someone proofread my thesis introduction before tomorrow?",               category: "Academic Support", reqStatus: "Rejected",  reqTimestamp: new Date("2026-10-04T09:00:00+08:00") },
  { reqID: "req004", studID: "user004", volID: "user001", title: "Study group for physics",          description: "Looking for someone to study mechanics with this week.",                        category: "Academic Support", reqStatus: "Cancelled", reqTimestamp: new Date("2026-10-03T09:00:00+08:00") },
 
  // Requests that have a session
  { reqID: "req005", studID: "user004", volID: "user001", title: "Essay structure feedback",         description: "Want feedback on how I structure my argumentative essays.",                     category: "Academic Support", reqStatus: "Scheduled", reqTimestamp: new Date("2026-10-02T09:00:00+08:00") },
  { reqID: "req006", studID: "user004", volID: "user001", title: "Exam revision plan",               description: "Help me plan my revision for the final exams.",                                 category: "Academic Support", reqStatus: "Scheduled", reqTimestamp: new Date("2026-10-01T09:00:00+08:00") },
  { reqID: "req007", studID: "user004", volID: "user001", title: "Tips for time management",         description: "Looking for ways to balance classes and part-time work.",                       category: "Academic Support", reqStatus: "Scheduled", reqTimestamp: new Date("2026-09-25T09:00:00+08:00") },
  { reqID: "req008", studID: "user004", volID: "user001", title: "Choosing electives",               description: "Not sure which electives to take next semester.",                               category: "Academic Support", reqStatus: "Scheduled", reqTimestamp: new Date("2026-09-22T09:00:00+08:00") },
  { reqID: "req009", studID: "user004", volID: "user001", title: "Statistics study session",         description: "Would like to review statistics with someone before the quiz.",                 category: "Academic Support", reqStatus: "Scheduled", reqTimestamp: new Date("2026-09-28T09:00:00+08:00") },
];
 
// ---------- Support sessions: Planned, Confirmed, Completed, Rated, Cancelled ----------
// Each session lands on one of user001's weekly slots (Monday 10, Monday 14, Wednesday 14).
// sess001: the volunteer has confirmed but the student hasn't (shows the "needs your confirmation" state).
const supportSessions = [
  { sessID: "sess001", reqID: "req005", sessDate: new Date("2026-10-12T14:00:00+08:00"), sessTimeSlot: new Date("2026-10-12T14:00:00+08:00"), supportMode: "Physical", meetingLocation: "Library Level 2, Discussion Room 3",  sessStatus: "Planned",   sessTimestamp: new Date("2026-10-03T10:00:00+08:00"), studConfirmed: false, volConfirmed: true  },
  { sessID: "sess002", reqID: "req006", sessDate: new Date("2026-10-14T14:00:00+08:00"), sessTimeSlot: new Date("2026-10-14T14:00:00+08:00"), supportMode: "Online",   meetingLocation: "https://meet.example.com/abc-defg-hij", sessStatus: "Confirmed", sessTimestamp: new Date("2026-10-02T10:00:00+08:00"), studConfirmed: true,  volConfirmed: true  },
  { sessID: "sess003", reqID: "req007", sessDate: new Date("2026-10-05T10:00:00+08:00"), sessTimeSlot: new Date("2026-10-05T10:00:00+08:00"), supportMode: "Online",   meetingLocation: "https://meet.example.com/abc-defg-hij", sessStatus: "Completed", sessTimestamp: new Date("2026-09-28T10:00:00+08:00"), studConfirmed: true,  volConfirmed: true  },
  { sessID: "sess004", reqID: "req008", sessDate: new Date("2026-09-28T14:00:00+08:00"), sessTimeSlot: new Date("2026-09-28T14:00:00+08:00"), supportMode: "Physical", meetingLocation: "Library Level 2, Discussion Room 3",  sessStatus: "Rated",     sessTimestamp: new Date("2026-09-24T10:00:00+08:00"), studConfirmed: true,  volConfirmed: true  },
  { sessID: "sess005", reqID: "req009", sessDate: new Date("2026-09-30T14:00:00+08:00"), sessTimeSlot: new Date("2026-09-30T14:00:00+08:00"), supportMode: "Online",   meetingLocation: "https://meet.example.com/abc-defg-hij", sessStatus: "Cancelled", sessTimestamp: new Date("2026-09-29T10:00:00+08:00"), studConfirmed: true,  volConfirmed: false },
];
 
// ---------- Feedback: for the Rated session (rating matches user001's avgRating) ----------
const feedback = [
  { fbID: "fb001", sessID: "sess004", rating: 5, comments: "Very helpful and patient. Gave me a clear shortlist of electives.", fbTimestamp: new Date("2026-09-29T12:00:00+08:00") },
];
 
// ---------- Notifications ----------
// TODO: fill in redirectionLink with the route each notification should open
const notifications = [
  { notifID: "notif001", UID: "user001", message: "You have a new support request: Help with calculus revision.",                       redirectionLink: "", notifTimestamp: new Date("2026-10-06T09:05:00+08:00") },
  { notifID: "notif002", UID: "user004", message: "Your session \"Essay structure feedback\" is waiting for your confirmation.",        redirectionLink: "", notifTimestamp: new Date("2026-10-07T08:00:00+08:00") },
];
 
// ---------- Write everything ----------
async function seed() {
  const batch = db.batch();
 
  users.forEach((d) => batch.set(db.collection("users").doc(d.UID), d));
  volunteers.forEach((d) => batch.set(db.collection("volunteers").doc(d.UID), d));
  availability.forEach((d) => batch.set(db.collection("availability").doc(d.availID), d));
  supportRequests.forEach((d) => batch.set(db.collection("supportRequests").doc(d.reqID), d));
  supportSessions.forEach((d) => batch.set(db.collection("supportSessions").doc(d.sessID), d));
  feedback.forEach((d) => batch.set(db.collection("feedback").doc(d.fbID), d));
  notifications.forEach((d) => batch.set(db.collection("notifications").doc(d.notifID), d));
 
  await batch.commit();
 
  if (CREATE_AUTH_USERS) {
    const auth = getAuth();
    for (const u of users) {
      const record = {
        email: u.email,
        password: TEST_PASSWORD,
        displayName: u.name,
        emailVerified: u.accStatus !== "Pending",
      };
      try {
        await auth.createUser({ uid: u.UID, ...record });
      } catch (err) {
        if (err.code === "auth/uid-already-exists" || err.code === "auth/email-already-exists") {
          await auth.updateUser(u.UID, record);
        } else {
          throw err;
        }
      }
    }
  }
 
  console.log(
    `Seeded ${users.length} users, ${volunteers.length} volunteers, ${availability.length} availability slots, ` +
      `${supportRequests.length} requests, ${supportSessions.length} sessions, ` +
      `${feedback.length} feedback, ${notifications.length} notifications.`
  );
}
 
seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});