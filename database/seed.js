// seed.js: fills Firestore with demo data for the 16 Nov 2026 presentation.
// Document IDs are fixed (user001, req001, etc.) so re-running overwrites instead of duplicating.
// Run it from the database folder:  node seed.js

import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const SERVICE_ACCOUNT_PATH = "./secrets/service-account.json";
const WIPE_FIRST = true; 
const TEST_PASSWORD = "Test1234!";

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);
const auth = getAuth(app);

async function wipe() {
  // Remove the Auth accounts first, while the users collection still tells us who they are
  const oldUsers = await db.collection("users").get();
  const oldUIDs = oldUsers.docs.map((d) => d.id);
  if (oldUIDs.length > 0) {
    const result = await auth.deleteUsers(oldUIDs);
    console.log(`Deleted ${result.successCount} old Auth accounts.`);
  }

  for (const name of ["users", "volunteers", "availability", "supportRequests", "supportSessions", "feedback", "notifications"]) {
    await db.recursiveDelete(db.collection(name));
    console.log(`Cleared "${name}".`);
  }
}

// ---------- Users ----------
const users = [
  { UID: "user001", email: "b2300490@helplive.edu.my", studentID: "B2300490", name: "Freddy Fazbear", isVolunteer: true },
  { UID: "user002", email: "b2401344@helplive.edu.my", studentID: "B2401344", name: "Cheeky Chiica", isVolunteer: true },
  { UID: "user003", email: "b2401026@helplive.edu.my", studentID: "B2401026", name: "Freaky Foxy", isVolunteer: true },
  { UID: "user004", email: "b2300486@helplive.edu.my", studentID: "B2300486", name: "Mangle Wangle", isVolunteer: false },
];

// ---------- Volunteer profiles ----------
const volunteers = [
  { UID: "user001", volCategories: ["Academic Support", "Technology Support", "New Student Support", "General Student Support"], skills: ["Mathematics", "Presentation", "Software Installation", "Device Troubleshooting", "Campus Navigation", "Orientation Guidance", "Cooking & Meal Prep", "Time & Study Planning"], prefSupportMode: "Virtual", avgRating: 4.5, ratingCount: 2 },
  { UID: "user002", volCategories: ["Academic Support", "Technology Support"], skills: ["Programming", "Proofreading", "Operating System Setup", "Device Troubleshooting"], prefSupportMode: "Physical", avgRating: 5.0, ratingCount: 1 },
  { UID: "user003", volCategories: ["General Student Support", "New Student Support"], skills: ["Furniture Assembly", "Errands & Transport", "Housing Setup", "Club & Activity Guide"], prefSupportMode: "Physical", avgRating: 4.3, ratingCount: 8 },
];

// ---------- Availability ----------
const availability = [
  { availID: "avail001", volUID: "user001", dayOfWeek: "Monday",    availTimeSlot: 10 },
  { availID: "avail002", volUID: "user001", dayOfWeek: "Monday",    availTimeSlot: 14 },
  { availID: "avail003", volUID: "user001", dayOfWeek: "Tuesday",   availTimeSlot: 14 },
  { availID: "avail004", volUID: "user001", dayOfWeek: "Wednesday", availTimeSlot: 14 },
  { availID: "avail005", volUID: "user001", dayOfWeek: "Thursday",  availTimeSlot: 14 },
  { availID: "avail006", volUID: "user001", dayOfWeek: "Friday",    availTimeSlot: 14 },
  { availID: "avail007", volUID: "user002", dayOfWeek: "Tuesday",   availTimeSlot: 10 },
  { availID: "avail008", volUID: "user002", dayOfWeek: "Tuesday",   availTimeSlot: 14 },
  { availID: "avail009", volUID: "user002", dayOfWeek: "Thursday",  availTimeSlot: 10 },
  { availID: "avail010", volUID: "user002", dayOfWeek: "Thursday",  availTimeSlot: 16 },
  { availID: "avail011", volUID: "user003", dayOfWeek: "Monday",    availTimeSlot: 9 },
  { availID: "avail012", volUID: "user003", dayOfWeek: "Monday",    availTimeSlot: 11 },
  { availID: "avail013", volUID: "user003", dayOfWeek: "Wednesday", availTimeSlot: 10 },
  { availID: "avail014", volUID: "user003", dayOfWeek: "Friday",    availTimeSlot: 10 },
  { availID: "avail015", volUID: "user003", dayOfWeek: "Friday",    availTimeSlot: 15 },
];

// ---------- Requests (no session yet) ----------
const supportRequests = [
  // Chiica (student) -> Freddy (volunteer)
  { reqID: "req013", studUID: "user002", volUID: "user001", title: "Help with calculus revision", description: "I'm struggling with integration before my midterm and could use a walkthrough.", category: "Academic Support", reqStatus: "Pending", reqTimestamp: new Date("2026-11-14T15:30:00+08:00") },
  { reqID: "req014", studUID: "user002", volUID: "user001", title: "Laptop keeps freezing", description: "My laptop freezes every few minutes and I can't figure out why.", category: "Technology Support", reqStatus: "Accepted", reqTimestamp: new Date("2026-11-13T11:00:00+08:00") },
  { reqID: "req015", studUID: "user002", volUID: "user001", title: "Help assembling my wardrobe", description: "Looking for someone to help put together a flat-pack wardrobe this weekend.", category: "General Student Support", reqStatus: "Rejected", reqTimestamp: new Date("2026-11-10T09:30:00+08:00") },
  { reqID: "req016", studUID: "user002", volUID: "user001", title: "Campus orientation walkthrough", description: "Would like someone to show me around the campus.", category: "New Student Support", reqStatus: "Cancelled", reqTimestamp: new Date("2026-11-09T16:00:00+08:00") },

  // Freddy (student) -> Chiica (volunteer)
  { reqID: "req017", studUID: "user001", volUID: "user002", title: "Help with my Java assignment", description: "Stuck on inheritance and interfaces in my Java assignment.", category: "Academic Support", reqStatus: "Pending", reqTimestamp: new Date("2026-11-15T10:00:00+08:00") },

  // Requests that have a session (Scheduled)
  { reqID: "req001", studUID: "user002", volUID: "user001", title: "Find my way around campus", description: "Still getting lost between lecture halls, can someone show me around?", category: "New Student Support", reqStatus: "Scheduled", reqTimestamp: new Date("2026-10-28T10:00:00+08:00") },
  { reqID: "req002", studUID: "user002", volUID: "user001", title: "Statistics study session", description: "Would like to review statistics with someone before the quiz.", category: "Academic Support", reqStatus: "Scheduled", reqTimestamp: new Date("2026-11-01T14:00:00+08:00") },
  { reqID: "req003", studUID: "user002", volUID: "user001", title: "Tips for time management", description: "Looking for ways to balance classes and part-time work.", category: "General Student Support", reqStatus: "Scheduled", reqTimestamp: new Date("2026-11-04T09:00:00+08:00") },
  { reqID: "req004", studUID: "user002", volUID: "user001", title: "Exam revision plan", description: "Help me plan my revision for the final exams.", category: "Academic Support", reqStatus: "Scheduled", reqTimestamp: new Date("2026-11-08T09:00:00+08:00") },
  { reqID: "req005", studUID: "user002", volUID: "user001", title: "Help with BDA205 presentation", description: "Apparently there's a presentation I didn't prepare for, help me rehearseee.", category: "Academic Support", reqStatus: "Scheduled", reqTimestamp: new Date("2026-11-14T09:00:00+08:00") },
  { reqID: "req006", studUID: "user002", volUID: "user001", title: "Essay structure feedback", description: "Want feedback on how I structure my argumentative essays.", category: "Academic Support", reqStatus: "Scheduled", reqTimestamp: new Date("2026-11-12T09:00:00+08:00") },
  { reqID: "req007", studUID: "user002", volUID: "user001", title: "Set up my dev environment", description: "Need help configuring VS Code and Node.", category: "Technology Support", reqStatus: "Scheduled", reqTimestamp: new Date("2026-11-11T09:00:00+08:00") },
  { reqID: "req008", studUID: "user002", volUID: "user001", title: "There's gum in my shoe", description: "Help me get my gum off my shoe.", category: "General Student Support", reqStatus: "Scheduled", reqTimestamp: new Date("2026-11-15T09:00:00+08:00") },
  { reqID: "req009", studUID: "user002", volUID: "user001", title: "I want luckin", description: "Anyone can help me buy and hang out lol?", category: "General Student Support", reqStatus: "Scheduled", reqTimestamp: new Date("2026-11-14T09:00:00+08:00") },
  { reqID: "req010", studUID: "user001", volUID: "user002", title: "Proofread my CV", description: "Could you proofread my CV before I apply for internships?", category: "Academic Support", reqStatus: "Scheduled", reqTimestamp: new Date("2026-11-01T09:00:00+08:00") },
  { reqID: "req011", studUID: "user001", volUID: "user002", title: "Reinstall my operating system", description: "My laptop is sluggish and I'd like a clean OS install.", category: "Technology Support", reqStatus: "Scheduled", reqTimestamp: new Date("2026-11-13T09:00:00+08:00") },
  { reqID: "req012", studUID: "user001", volUID: "user002", title: "Printer won't connect", description: "My printer won't connect to my laptop.", category: "Technology Support", reqStatus: "Scheduled", reqTimestamp: new Date("2026-11-14T09:00:00+08:00") },
  { reqID: "req018", studUID: "user002", volUID: "user001", title: "Help with calculus revision", description: "I'm struggling with integration before my midterm and could use a walkthrough.", category: "Academic Support", reqStatus: "Scheduled", reqTimestamp: new Date("2026-11-14T15:30:00+08:00") },
];

// ---------- Sessions ----------
const supportSessions = [
  // --- TODAY (16 Nov, 4 PM), Confirmed ---
  { sessID: "sess005", reqID: "req005", sessDate: new Date("2026-11-16T16:00:00+08:00"), sessTimeSlot: new Date("2026-11-17T16:00:00+08:00"), supportMode: "Physical", meetingLocation: "Library Level 2, Discussion Room 8", sessStatus: "Confirmed", sessTimestamp: new Date("2026-11-12T20:30:00+08:00"), studConfirmed: true,  volConfirmed: true  },

  // --- ELAPSED, Planned (15 Nov) ---
  { sessID: "sess006", reqID: "req006", sessDate: new Date("2026-11-15T14:00:00+08:00"), sessTimeSlot: new Date("2026-11-15T14:00:00+08:00"), supportMode: "Physical", meetingLocation: "Library Level 2, Discussion Room 3",  sessStatus: "Planned",   sessTimestamp: new Date("2026-11-12T10:00:00+08:00"), studConfirmed: false, volConfirmed: false },

  // --- ELAPSED, Confirmed (15 Nov) ---
  { sessID: "sess007", reqID: "req007", sessDate: new Date("2026-11-15T10:00:00+08:00"), sessTimeSlot: new Date("2026-11-15T10:00:00+08:00"), supportMode: "Online",   meetingLocation: "https://meet.example.com/abc-defg-hij", sessStatus: "Confirmed", sessTimestamp: new Date("2026-11-12T10:30:00+08:00"), studConfirmed: true,  volConfirmed: true  },

  // --- TO CONFIRM (17 Nov), Planned: vol confirmed, student has not ---
  { sessID: "sess008", reqID: "req008", sessDate: new Date("2026-11-17T14:00:00+08:00"), sessTimeSlot: new Date("2026-11-17T14:00:00+08:00"), supportMode: "Physical", meetingLocation: "Student Centre Cafeteria, Level 1",     sessStatus: "Planned",   sessTimestamp: new Date("2026-11-13T09:30:00+08:00"), studConfirmed: false, volConfirmed: true  },

  // --- WAITING (17 Nov), Planned: student confirmed, vol has not ---
  { sessID: "sess009", reqID: "req009", sessDate: new Date("2026-11-17T10:00:00+08:00"), sessTimeSlot: new Date("2026-11-17T10:00:00+08:00"), supportMode: "Physical", meetingLocation: "Luckin Coffee, Student Centre",         sessStatus: "Planned",   sessTimestamp: new Date("2026-11-14T12:00:00+08:00"), studConfirmed: true,  volConfirmed: false },

  // --- CONFIRMED (17 Nov), both agreed ---
  { sessID: "sess011", reqID: "req011", sessDate: new Date("2026-11-17T16:00:00+08:00"), sessTimeSlot: new Date("2026-11-17T16:00:00+08:00"), supportMode: "Online",   meetingLocation: "https://meet.example.com/xyz-uvwx-rst", sessStatus: "Confirmed", sessTimestamp: new Date("2026-11-12T13:05:00+08:00"), studConfirmed: true,  volConfirmed: true  },

  // --- INCOMING (18 Nov), Confirmed ---
  { sessID: "sess012", reqID: "req012", sessDate: new Date("2026-11-18T16:00:00+08:00"), sessTimeSlot: new Date("2026-11-18T16:00:00+08:00"), supportMode: "Physical", meetingLocation: "Computer Lab 4, Block B",               sessStatus: "Confirmed", sessTimestamp: new Date("2026-11-13T15:00:00+08:00"), studConfirmed: true,  volConfirmed: true  },

  // --- PAST: Rated (feedback exists) ---
  { sessID: "sess001", reqID: "req001", sessDate: new Date("2026-11-02T14:00:00+08:00"), sessTimeSlot: new Date("2026-11-02T14:00:00+08:00"), supportMode: "Physical", meetingLocation: "Main Gate, next to the campus map board", sessStatus: "Rated",     sessTimestamp: new Date("2026-11-02T16:30:00+08:00"), studConfirmed: true,  volConfirmed: true  },
  { sessID: "sess002", reqID: "req002", sessDate: new Date("2026-11-06T14:00:00+08:00"), sessTimeSlot: new Date("2026-11-06T14:00:00+08:00"), supportMode: "Online",   meetingLocation: "https://meet.example.com/abc-defg-hij", sessStatus: "Rated",     sessTimestamp: new Date("2026-11-06T16:20:00+08:00"), studConfirmed: true,  volConfirmed: true  },

  // --- PAST: Completed (student has not rated yet) ---
  { sessID: "sess003", reqID: "req003", sessDate: new Date("2026-11-09T10:00:00+08:00"), sessTimeSlot: new Date("2026-11-09T10:00:00+08:00"), supportMode: "Online",   meetingLocation: "https://meet.example.com/abc-defg-hij", sessStatus: "Completed", sessTimestamp: new Date("2026-11-09T11:30:00+08:00"), studConfirmed: true,  volConfirmed: true  },

  // --- PAST: Cancelled ---
  { sessID: "sess004", reqID: "req004", sessDate: new Date("2026-11-11T14:00:00+08:00"), sessTimeSlot: new Date("2026-11-11T14:00:00+08:00"), supportMode: "Online",   meetingLocation: "https://meet.example.com/abc-defg-hij", sessStatus: "Cancelled", sessTimestamp: new Date("2026-11-10T18:00:00+08:00"), studConfirmed: true,  volConfirmed: false },

  // --- PAST: Rated, Freddy as student ---
  { sessID: "sess010", reqID: "req010", sessDate: new Date("2026-11-05T10:00:00+08:00"), sessTimeSlot: new Date("2026-11-05T10:00:00+08:00"), supportMode: "Online",   meetingLocation: "https://meet.example.com/xyz-uvwx-rst", sessStatus: "Rated",     sessTimestamp: new Date("2026-11-05T11:30:00+08:00"), studConfirmed: true,  volConfirmed: true  },

  // --- TOMORROW (17 Nov, 4 PM), Confirmed ---
  { sessID: "sess013", reqID: "req018", sessDate: new Date("2026-11-17T17:00:00+08:00"), sessTimeSlot: new Date("2026-11-17T16:00:00+08:00"), supportMode: "Physical", meetingLocation: "Library Level 2, Discussion Room 8", sessStatus: "Confirmed", sessTimestamp: new Date("2026-11-14T15:30:00+08:00"), studConfirmed: true,  volConfirmed: true  },
];
// ---------- Feedback ----------
const feedback = [
  { fbID: "fb001", sessID: "sess001", rating: 5, comments: "Freddy walked me through every building and even showed me the shortcuts. Super patient!", fbTimestamp: new Date("2026-11-02T16:30:00+08:00") },
  { fbID: "fb002", sessID: "sess002", rating: 4, comments: "Clear explanations of hypothesis testing. Would have liked a few more practice questions.", fbTimestamp: new Date("2026-11-06T16:20:00+08:00") },
  { fbID: "fb003", sessID: "sess010", rating: 5, comments: "Chiica gave me really useful feedback and even suggested some improvements to my cover letter. Thanks!", fbTimestamp: new Date("2026-11-05T11:30:00+08:00") },
];

// ---------- Notifications ----------
const notifications = [
  // Freddy, as a volunteer
  { notifID: "notif001", UID: "user001", message: "Cheeky Chiica sent you a new support request.", notifTimestamp: new Date("2026-11-14T15:30:00+08:00"), isRead: false, type: "request", recipientRole: "volunteer", actorName: "Cheeky Chiica", title: "Help with calculus revision", category: "Academic Support" },
  { notifID: "notif002", UID: "user001", message: "Cheeky Chiica confirmed the session schedule.", notifTimestamp: new Date("2026-11-12T10:35:00+08:00"), isRead: false, type: "session", recipientRole: "volunteer", actorName: "Cheeky Chiica", title: "Set up my dev environment", category: "Technology Support" },
  { notifID: "notif003", UID: "user001", message: "Cheeky Chiica proposed a session schedule. Please confirm it.", notifTimestamp: new Date("2026-11-13T09:35:00+08:00"), isRead: false, type: "session", recipientRole: "volunteer", actorName: "Cheeky Chiica", title: "There's gum in my shoe", category: "General Student Support" },
  { notifID: "notif004", UID: "user001", message: "Cheeky Chiica scheduled a session for your request.", notifTimestamp: new Date("2026-11-12T13:10:00+08:00"), isRead: false, type: "session", recipientRole: "student", actorName: "Cheeky Chiica", title: "Reinstall my operating system", category: "Technology Support" },

  // Cheeky, as a student
  { notifID: "notif005", UID: "user002", message: "Freddy Fazbear accepted your support request.", notifTimestamp: new Date("2026-11-13T11:05:00+08:00"), isRead: false, type: "request", recipientRole: "student", actorName: "Freddy Fazbear", title: "Laptop keeps freezing", category: "Technology Support" },
  { notifID: "notif006", UID: "user002", message: "Freddy Fazbear rejected your support request.", notifTimestamp: new Date("2026-11-10T09:35:00+08:00"), isRead: true, type: "request", recipientRole: "student", actorName: "Freddy Fazbear", title: "Help assembling my wardrobe", category: "General Student Support" },
  { notifID: "notif007", UID: "user002", message: "Your session for 'Essay structure feedback' was not confirmed in time. Please reschedule.", notifTimestamp: new Date("2026-11-12T10:05:00+08:00"), isRead: false, type: "session", recipientRole: "student", actorName: "Freddy Fazbear", title: "Essay structure feedback", category: "Academic Support" },
  { notifID: "notif008", UID: "user002", message: "Freddy Fazbear marked your session as completed. Leave a rating!", notifTimestamp: new Date("2026-11-09T11:35:00+08:00"), isRead: false, type: "session", recipientRole: "student", actorName: "Freddy Fazbear", title: "Tips for time management", category: "General Student Support" },

  // Cheeky, as a volunteer
  { notifID: "notif009", UID: "user002", message: "Freddy Fazbear sent you a new support request.", notifTimestamp: new Date("2026-11-15T10:00:00+08:00"), isRead: false, type: "request", recipientRole: "volunteer", actorName: "Freddy Fazbear", title: "Help with my Java assignment", category: "Academic Support" },
  { notifID: "notif010", UID: "user002", message: "Freddy Fazbear has confirmed the session schedule.", notifTimestamp: new Date("2026-11-13T15:05:00+08:00"), isRead: false, type: "session", recipientRole: "volunteer", actorName: "Freddy Fazbear", title: "Printer won't connect", category: "Technology Support" },
];

// ---------- Write everything ----------
async function seed() {
  console.log(`Seeding project "${serviceAccount.project_id}"...`);

  if (WIPE_FIRST) await wipe();

  const batch = db.batch();

  users.forEach((d) => batch.set(db.collection("users").doc(d.UID), d));
  volunteers.forEach((d) => batch.set(db.collection("volunteers").doc(d.UID), d));
  availability.forEach((d) => batch.set(db.collection("availability").doc(d.availID), d));
  supportRequests.forEach((d) => batch.set(db.collection("supportRequests").doc(d.reqID), d));
  supportSessions.forEach((d) => batch.set(db.collection("supportSessions").doc(d.sessID), d));
  feedback.forEach((d) => batch.set(db.collection("feedback").doc(d.fbID), d));
  notifications.forEach((d) => batch.set(db.collection("notifications").doc(d.notifID), d));

  await batch.commit();
  console.log("Firestore seeded.");

  // Create Auth users with the same fixed UIDs
  for (const u of users) {
    const record = {
      email: u.email,
      password: TEST_PASSWORD,
      displayName: u.name,
      emailVerified: true,
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

  console.log(
    `Seeded ${users.length} users, ${volunteers.length} volunteers, ${availability.length} availability slots, ` +
    `${supportRequests.length} requests, ${supportSessions.length} sessions, ` +
    `${feedback.length} feedback, ${notifications.length} notifications.`
  );
  console.log(`Log in as Freddy (${users[0].email}) or Cheeky (${users[1].email}) with password "${TEST_PASSWORD}".`);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});