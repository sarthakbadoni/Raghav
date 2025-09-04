// Simple Car Rental — all client-side using localStorage

// Pricing constants
const PRICES = { Sedan: 2000, SUV: 2500 };
const PENALTY_LATE_PER_HOUR = 50;
const PENALTY_DAMAGE = 1500;

// --- Utilities ---
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const toast = (msg, ms=1800) => {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(()=> t.classList.add("hidden"), ms);
};
const uid = () => Math.random().toString(36).slice(2,10);

// --- Local Storage Helpers ---
const db = {
  users: () => JSON.parse(localStorage.getItem("users") || "{}"),
  saveUsers: (obj) => localStorage.setItem("users", JSON.stringify(obj)),
  session: () => JSON.parse(localStorage.getItem("session") || "null"),
  saveSession: (obj) => localStorage.setItem("session", JSON.stringify(obj)),
  cars: () => JSON.parse(localStorage.getItem("cars") || "null"),
  saveCars: (arr) => localStorage.setItem("cars", JSON.stringify(arr)),
  bookings: () => JSON.parse(localStorage.getItem("bookings") || "[]"),
  saveBookings: (arr) => localStorage.setItem("bookings", JSON.stringify(arr)),
};

// --- Seed cars if not present ---
const seedCars = [
  { id: "s1", name: "Honda City", type: "Sedan", qty: 3 },
  { id: "s2", name: "Hyundai Verna", type: "Sedan", qty: 2 },
  { id: "u1", name: "Hyundai Creta", type: "SUV", qty: 2 },
  { id: "u2", name: "Mahindra XUV700", type: "SUV", qty: 1 },
];
if(!db.cars()) db.saveCars(seedCars);

// --- Dark Mode ---
const darkModeToggle = $("#darkModeToggle");
const savedTheme = localStorage.getItem("theme") || "dark";
document.body.classList.toggle("light", savedTheme === "light");
darkModeToggle.addEventListener("click", () => {
  const isLight = document.body.classList.toggle("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
});

// --- DOM Elements ---
const yearSpan = $("#year");
const authSection = $("#authSection");
const profileSection = $("#profileSection");
const actionSection = $("#actionSection");
const rentSection = $("#rentSection");
const returnSection = $("#returnSection");
const showLoginBtn = $("#showLogin");
const showRegisterBtn = $("#showRegister");
const loginForm = $("#loginForm");
const registerForm = $("#registerForm");
const profileForm = $("#profileForm");
const nameInput = $("#name");
const ageInput = $("#age");
const sexInput = $("#sex");
const dlInput = $("#dl");
const welcomeUser = $("#welcomeUser");
const logoutBtn = $("#logoutBtn");
const rentBtn = $("#rentBtn");
const returnBtn = $("#returnBtn");
const backToAction = $("#backToAction");
const backToAction2 = $("#backToAction2");
const filterType = $("#filterType");
const carList = $("#carList");
const rentDays = $("#rentDays");
const activeBookingsDiv = $("#activeBookings");
const returnForm = $("#returnForm");
const billPreview = $("#billPreview");
const lateHours = $("#lateHours");
const damaged = $("#damaged");
const billOutput = $("#billOutput");
const showBill = $("#showBill");
const estDays = $("#estDays");
const estPeople = $("#estPeople");
const runEstimator = $("#runEstimator");
const estimatorResult = $("#estimatorResult");

// --- Init ---
yearSpan.textContent = new Date().getFullYear();
logoutBtn.addEventListener("click", () => {
  db.saveSession(null);
  location.reload();
});

// --- Auth UI ---
showLoginBtn.addEventListener("click", () => {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
});
showRegisterBtn.addEventListener("click", () => {
  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
});

// Validate DL (very light validation)
function isValidDL(dl){
  const cleaned = dl.replace(/\s+/g,'');
  return /^[A-Za-z0-9]{8,16}$/.test(cleaned);
}

// Register
registerForm.addEventListener("submit", (e)=> {
  e.preventDefault();
  const name = $("#regName").value.trim();
  const age = parseInt($("#regAge").value,10);
  const sex = $("#regSex").value;
  const dl = $("#regDL").value.trim();
  const email = $("#regEmail").value.trim().toLowerCase();
  const password = $("#regPassword").value;
  if(age < 18){
    toast("Age must be 18+");
    return;
  }
  if(!isValidDL(dl)){
    toast("Enter a valid DL (8–16 letters/numbers)");
    return;
  }
  const users = db.users();
  if(users[email]){
    toast("Email already registered. Please login.");
    return;
  }
  users[email] = {
    id: uid(),
    name, age, sex, dl, email, password,
    createdAt: Date.now(),
  };
  db.saveUsers(users);
  db.saveSession({ email });
  toast("Registration successful!");
  showAppFor(email);
});

// Login
loginForm.addEventListener("submit", (e)=> {
  e.preventDefault();
  const email = $("#loginEmail").value.trim().toLowerCase();
  const password = $("#loginPassword").value;
  const users = db.users();
  if(!users[email] || users[email].password !== password){
    toast("Invalid credentials");
    return;
  }
  db.saveSession({ email });
  toast("Welcome back!");
  showAppFor(email);
});

// If session exists
const sess = db.session();
if(sess?.email){
  showAppFor(sess.email);
}

// Show app after login/register
function showAppFor(email){
  const users = db.users();
  const u = users[email];
  if(!u){
    return;
  }
  welcomeUser.textContent = `Hi, ${u.name || u.email}`;
  // fill profile
  nameInput.value = u.name || "";
  ageInput.value = u.age || "";
  sexInput.value = u.sex || "";
  dlInput.value = u.dl || "";
  authSection.classList.add("hidden");
  profileSection.classList.remove("hidden");
  actionSection.classList.remove("hidden");
}

// Profile Save
profileForm.addEventListener("submit", (e)=> {
  e.preventDefault();
  const session = db.session();
  if(!session?.email) return;
  const users = db.users();
  const u = users[session.email];
  const age = parseInt(ageInput.value,10);
  if(age < 18){
    toast("Age must be 18+");
    return;
  }
  if(!isValidDL(dlInput.value.trim())){
    toast("Invalid Driving Licence");
    return;
  }
  u.name = nameInput.value.trim();
  u.age = age;
  u.sex = sexInput.value;
  u.dl = dlInput.value.trim();
  users[session.email] = u;
  db.saveUsers(users);
  toast("Details saved!");
});

// Action buttons
rentBtn.addEventListener("click", () => {
  actionSection.scrollIntoView({behavior:"smooth"});
  rentSection.classList.remove("hidden");
  returnSection.classList.add("hidden");
  renderCars();
});
returnBtn.addEventListener("click", () => {
  actionSection.scrollIntoView({behavior:"smooth"});
  rentSection.classList.add("hidden");
  returnSection.classList.remove("hidden");
  renderActiveBookings();
});
backToAction.addEventListener("click", () => {
  rentSection.classList.add("hidden");
});
backToAction2.addEventListener("click", () => {
  returnSection.classList.add("hidden");
});
filterType.addEventListener("change", renderCars);
rentDays.addEventListener("change", renderCars);

// Render cars
function renderCars(){
  const cars = db.cars();
  const days = Math.max(1, parseInt(rentDays.value,10) || 1);
  const typeFilter = filterType.value;
  carList.innerHTML = "";
  const filtered = cars.filter(c=> typeFilter === "all" ? true : c.type === typeFilter);
  filtered.forEach(car => {
    const card = document.createElement("div");
    card.className = "car-card";
    const price = PRICES[car.type];
    card.innerHTML = `
