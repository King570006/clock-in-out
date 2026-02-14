// ================= FIREBASE INIT =================
firebase.initializeApp({
  apiKey: "AIzaSyCnzBdlGPviltn6P8pID14lgkXHx6zQifA",
  authDomain: "clock-in-out-56209.firebaseapp.com",
  projectId: "clock-in-out-56209"
});

const auth = firebase.auth();
const db = firebase.firestore();

// ================= DOM =================
const loginScreen = document.getElementById("loginScreen");
const dashboardScreen = document.getElementById("dashboardScreen");
const requestScreen = document.getElementById("requestScreen");

const userEmail = document.getElementById("userEmail");
const rateEl = document.getElementById("rate");
const totalHoursEl = document.getElementById("totalHours");
const totalPayEl = document.getElementById("totalPay");
const historyList = document.getElementById("historyList");

const clockInBtn = document.getElementById("clockInBtn");
const clockOutBtn = document.getElementById("clockOutBtn");
const statusEl = document.getElementById("status");

let hourlyRate = 20;

// ================= SCREEN CONTROL =================
function show(screenId) {
  document.querySelectorAll(".screen").forEach(s =>
    s.classList.remove("active")
  );
  document.getElementById(screenId).classList.add("active");
}

function openRequest() {
  show("requestScreen");
}

function backToDashboard() {
  show("dashboardScreen");
}

// ================= AUTH =================
function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .catch(err => alert(err.message));
}

function logout() {
  auth.signOut();
}

auth.onAuthStateChanged(async user => {
  if (!user) {
    show("loginScreen");
    return;
  }

  show("dashboardScreen");

  userEmail.innerText = user.email;
  rateEl.innerText = hourlyRate.toFixed(2);

  await loadEmployeeData(user);

  const userDoc = await db.collection("users").doc(user.uid).get();
  if (userDoc.exists && userDoc.data().status === "in") {
    showClockedIn(userDoc.data().since.toDate());
  } else {
    showClockedOut();
  }
});

// ================= CLOCK =================
function showClockedIn(time) {
  clockInBtn.style.display = "none";
  clockOutBtn.style.display = "block";
  statusEl.innerText = `Clocked in at ${time.toLocaleTimeString()}`;
}

function showClockedOut() {
  clockOutBtn.style.display = "none";
  clockInBtn.style.display = "block";
  statusEl.innerText = "Clocked out";
}

async function clockIn() {
  const now = new Date();

  await db.collection("logs").add({
    uid: auth.currentUser.uid,
    type: "in",
    time: now
  });

  await db.collection("users")
    .doc(auth.currentUser.uid)
    .set({
      status: "in",
      since: now
    }, { merge: true });

  showClockedIn(now);
}

async function clockOut() {
  const now = new Date();

  await db.collection("logs").add({
    uid: auth.currentUser.uid,
    type: "out",
    time: now
  });

  await db.collection("users")
    .doc(auth.currentUser.uid)
    .set({
      status: "out"
    }, { merge: true });

  showClockedOut();
}

// ================= DATA =================
async function loadEmployeeData(user) {
  const snap = await db.collection("logs")
    .where("uid", "==", user.uid)
    .orderBy("time")
    .get();

  const days = {};
  let totalMs = 0;
  let lastIn = null;

  snap.forEach(doc => {
    const log = doc.data();
    const day = log.time.toDate().toDateString();

    if (!days[day]) days[day] = [];
    days[day].push(log);

    if (log.type === "in") lastIn = log.time.toDate();
    if (log.type === "out" && lastIn) {
      totalMs += log.time.toDate() - lastIn;
      lastIn = null;
    }
  });

  const hours = totalMs / 3600000;
  totalHoursEl.innerText = hours.toFixed(2);
  totalPayEl.innerText = (hours * hourlyRate).toFixed(2);

  renderHistory(days);
}

function renderHistory(days) {
  historyList.innerHTML = "";

  if (Object.keys(days).length === 0) {
    historyList.innerHTML =
      `<p style="opacity:.7;">No completed shifts yet</p>`;
    return;
  }

  for (const day in days) {
    const dayDiv = document.createElement("div");
    dayDiv.innerHTML = `<strong>${day}</strong>`;

    let lastIn = null;

    days[day].forEach(log => {
      if (log.type === "in") {
        lastIn = log.time.toDate();
      } else if (log.type === "out" && lastIn) {
        const out = log.time.toDate();
        dayDiv.innerHTML += `
          <div class="history-item">
            ${lastIn.toLocaleTimeString()} → ${out.toLocaleTimeString()}
          </div>
        `;
        lastIn = null;
      }
    });

    historyList.appendChild(dayDiv);
  }
}

// ================= REQUEST =================
async function submitRequest() {
  const user = auth.currentUser;
  if (!user) return;

  await db.collection("requests").add({
    uid: user.uid,
    email: user.email,
    date: reqDate.value,
    clockIn: reqIn.value,
    clockOut: reqOut.value,
    reason: reqReason.value,
    createdAt: new Date()
  });

  alert("Request submitted");
  backToDashboard();
}

// ================= MENU (placeholder) =================
function toggleMenu() {
  // Reserved for future slide menu
}