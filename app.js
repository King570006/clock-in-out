firebase.initializeApp({
  apiKey: "AIzaSyCnzBdlGPviltn6P8pID14lgkXHx6zQifA",
  authDomain: "clock-in-out-56209.firebaseapp.com",
  projectId: "clock-in-out-56209"
});

const auth = firebase.auth();
const db = firebase.firestore();

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");

let hourlyRate = 20;

function login(){
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  auth.signInWithEmailAndPassword(email,password)
    .catch(e=>alert(e.message));
}

auth.onAuthStateChanged(async user=>{
  if(!user){
    loginView.classList.remove("hidden");
    appView.classList.add("hidden");
    return;
  }

  loginView.classList.add("hidden");
  appView.classList.remove("hidden");

  document.getElementById("userEmail").innerText=user.email;
  document.getElementById("rate").innerText=hourlyRate.toFixed(2);

  await loadEmployeeData(user);

  const u = await db.collection("users").doc(user.uid).get();
  if(u.exists && u.data().status==="in"){
    showIn(u.data().since.toDate());
  } else showOut();
});

function showIn(t){
  document.querySelector(".primary").classList.add("hidden");
  document.querySelector(".secondary").classList.remove("hidden");
  document.getElementById("status").innerText=`Clocked in since ${t.toLocaleTimeString()}`;
}

function showOut(){
  document.querySelector(".primary").classList.remove("hidden");
  document.querySelector(".secondary").classList.add("hidden");
  document.getElementById("status").innerText="Clocked out";
}

async function clockIn(){
  const now=new Date();
  await db.collection("logs").add({uid:auth.currentUser.uid,type:"in",time:now});
  await db.collection("users").doc(auth.currentUser.uid).set({status:"in",since:now},{merge:true});
  showIn(now);
}

async function clockOut(){
  const now=new Date();
  await db.collection("logs").add({uid:auth.currentUser.uid,type:"out",time:now});
  await db.collection("users").doc(auth.currentUser.uid).set({status:"out"},{merge:true});
  showOut();
}

function logout(){ auth.signOut(); }

async function loadEmployeeData(user){
  const snap = await db.collection("logs").where("uid","==",user.uid).orderBy("time").get();
  let total=0,last=null,days={};

  snap.forEach(d=>{
    const l=d.data(),day=l.time.toDate().toDateString();
    if(!days[day]) days[day]=[];
    days[day].push(l);
    if(l.type==="in") last=l.time.toDate();
    if(l.type==="out" && last){ total+=l.time.toDate()-last; last=null; }
  });

  const hrs=total/3600000;
  document.getElementById("totalHours").innerText=hrs.toFixed(2);
  document.getElementById("totalPay").innerText=(hrs*hourlyRate).toFixed(2);

  renderHistory(days);
}

function renderHistory(days){
  const box=document.getElementById("historyList");
  box.innerHTML="";
  for(const d in days){
    box.innerHTML+=`<b>${d}</b>`;
    let last=null;
    days[d].forEach(l=>{
      if(l.type==="in") last=l.time.toDate();
      if(l.type==="out" && last){
        box.innerHTML+=`<div>${last.toLocaleTimeString()} → ${l.time.toDate().toLocaleTimeString()}</div>`;
        last=null;
      }
    });
  }
}

function toggleMenu(){}
function openRequest(){
  document.getElementById("requestBox").classList.toggle("hidden");
}

async function submitRequest(){}