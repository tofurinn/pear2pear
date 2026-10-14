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

// ---------- Availability: available + unavailable ----------
const availability = [
  { availID: "avail006", volUID: "user001", dayOfWeek: "Wednesday", availTimeSlot: 14  },
  { availID: "avail007", volUID: "user001", dayOfWeek: "Thursday",  availTimeSlot: 14  },
  { availID: "avail008", volUID: "user001", dayOfWeek: "Friday",    availTimeSlot: 14  }
];

// ---------- Support requests: Pending, Accepted, Rejected, Cancelled ----------
const supportRequests = [

  // ---------- New sessions (req010–req013) — user002 → user001 ----------
  { reqID: "req010", studUID: "user002", volUID: "user001", title: "There's gum in my shoe",         description: "Help me get my gum off my shoe.",                                             category: "General Student Support",  reqStatus: "Scheduled", reqTimestamp: new Date("2026-10-03T09:00:00+08:00") },
  { reqID: "req011", studUID: "user002", volUID: "user001", title: "Set up my dev environment",      description: "Need help configuring VS Code and Node.",                                     category: "Technology Support",       reqStatus: "Scheduled", reqTimestamp: new Date("2026-10-03T09:00:00+08:00") },
  { reqID: "req012", studUID: "user002", volUID: "user001", title: "Help with BDA205 presentation",  description: "Apparently there's a presentation I didn't prepare for, help me rehearseee.", category: "Academic Support",         reqStatus: "Scheduled", reqTimestamp: new Date("2026-10-03T09:00:00+08:00") },
  { reqID: "req013", studUID: "user002", volUID: "user001", title: "I want luckin",                  description: "Anyone can help me buy and hang out lol?",                                    category: "General Student Support",  reqStatus: "Scheduled", reqTimestamp: new Date("2026-10-03T09:00:00+08:00") },
];

// ---------- Support sessions: Planned, Confirmed, Completed, Rated, Cancelled ----------

  // ---------- New sessions — user002 (student) ↔ user001 (volunteer) ----------
  const supportSessions = [
  { sessID: "sess006", reqID: "req010", sessDate: new Date("2026-10-22T14:00:00+08:00"), sessTimeSlot: new Date("2026-10-22T14:00:00+08:00"), supportMode: "Physical",  meetingLocation: "Library Level 2, Discussion Room 6",       sessStatus: "Planned",   sessTimestamp: new Date("2026-10-03T10:00:00+08:00"), studConfirmed: true,  volConfirmed: false },
  { sessID: "sess007", reqID: "req011", sessDate: new Date("2026-10-14T14:00:00+08:00"), sessTimeSlot: new Date("2026-10-14T14:00:00+08:00"), supportMode: "Physical",  meetingLocation: "Library Level 2, Discussion Room 7",       sessStatus: "Planned",   sessTimestamp: new Date("2026-10-03T10:00:00+08:00"), studConfirmed: true,  volConfirmed: false },
  { sessID: "sess008", reqID: "req012", sessDate: new Date("2026-10-16T14:00:00+08:00"), sessTimeSlot: new Date("2026-10-16T14:00:00+08:00"), supportMode: "Physical",  meetingLocation: "Library Level 2, Discussion Room 8",       sessStatus: "Confirmed", sessTimestamp: new Date("2026-10-03T10:00:00+08:00"), studConfirmed: true,  volConfirmed: true  },
  { sessID: "sess009", reqID: "req013", sessDate: new Date("2026-10-14T14:00:00+08:00"), sessTimeSlot: new Date("2026-10-14T14:00:00+08:00"), supportMode: "Physical",  meetingLocation: "Library Level 2, Discussion Room 8",       sessStatus: "Confirmed", sessTimestamp: new Date("2026-10-03T10:00:00+08:00"), studConfirmed: true,  volConfirmed: true  }
];

// ---------- Notifications ----------
const notifications = [
  { notifID: "notif001", UID: "user001", message: "You have a new support session schedule waiting to be confirmed!",                   redirectionLink: "", notifTimestamp: new Date("2026-10-03T10:00:00+08:00") },
  { notifID: "notif002", UID: "user001", message: "You have a new support session schedule waiting to be confirmed!",                   redirectionLink: "", notifTimestamp: new Date("2026-10-03T10:00:00+08:00") },
  { notifID: "notif003", UID: "user001", message: "Your volunteer has confirmed your support session schedule!",                        redirectionLink: "", notifTimestamp: new Date("2026-10-04T10:00:00+08:00") },
  { notifID: "notif004", UID: "user001", message: "Your volunteer has confirmed your support session schedule!",                        redirectionLink: "", notifTimestamp: new Date("2026-10-04T10:00:00+08:00") },
];

// ---------- Write everything ----------
async function seed() {
  const batch = db.batch();

  availability.forEach((d) => batch.set(db.collection("availability").doc(d.availID), d));
  supportRequests.forEach((d) => batch.set(db.collection("supportRequests").doc(d.reqID), d));
  supportSessions.forEach((d) => batch.set(db.collection("supportSessions").doc(d.sessID), d));
  notifications.forEach((d) => batch.set(db.collection("notifications").doc(d.notifID), d));

  await batch.commit(); 

  console.log(
    `Seeded ${availability.length} availability slots, ` +
    `${supportRequests.length} requests, ${supportSessions.length} sessions, ` +
    `${notifications.length} notifications.`
  );
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});