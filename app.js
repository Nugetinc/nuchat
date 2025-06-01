// Your Firebase config (replace if needed)
const firebaseConfig = {
  apiKey: "AIzaSyATFdqh-eQ8PNGJvjysMnC9euxjBCNJA0U",
  authDomain: "nuchat-a894e.firebaseapp.com",
  projectId: "nuchat-a894e",
  storageBucket: "nuchat-a894e.firebasestorage.app",
  messagingSenderId: "323542933372",
  appId: "1:323542933372:web:76bd0229d1da064bda4ef9",
  measurementId: "G-5Q3P8ZKG1M"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Elements
const authSection = document.getElementById('auth-section');
const chatSection = document.getElementById('chat-section');

const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');

const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');
const signupError = document.getElementById('signup-error');

const displayNameSpan = document.getElementById('display-name');
const logoutBtn = document.getElementById('logout-btn');

const messagesDiv = document.getElementById('messages');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');

// Switch tabs
loginTab.addEventListener('click', () => {
  loginTab.classList.add('active');
  signupTab.classList.remove('active');
  loginForm.classList.add('active');
  signupForm.classList.remove('active');
  loginError.textContent = '';
  signupError.textContent = '';
});

signupTab.addEventListener('click', () => {
  signupTab.classList.add('active');
  loginTab.classList.remove('active');
  signupForm.classList.add('active');
  loginForm.classList.remove('active');
  loginError.textContent = '';
  signupError.textContent = '';
});

// Auth state change
auth.onAuthStateChanged(user => {
  if (user) {
    authSection.classList.add('hidden');
    chatSection.classList.remove('hidden');
    displayNameSpan.textContent = user.email;
    loadMessages();
  } else {
    authSection.classList.remove('hidden');
    chatSection.classList.add('hidden');
    displayNameSpan.textContent = '';
    messagesDiv.innerHTML = '';
  }
});

// Login
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  loginError.textContent = '';

  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      loginForm.reset();
    })
    .catch(err => {
      loginError.textContent = err.message;
    });
});

// Sign Up
signupForm.addEventListener('submit', e => {
  e.preventDefault();
  signupError.textContent = '';

  const email = signupEmail.value.trim();
  const password = signupPassword.value.trim();

  if(password.length < 6){
    signupError.textContent = 'Password must be at least 6 characters.';
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      signupForm.reset();
    })
    .catch(err => {
      signupError.textContent = err.message;
    });
});

// Logout
logoutBtn.addEventListener('click', () => {
  auth.signOut();
});

// Load messages from Firestore and listen for new ones
function loadMessages() {
  messagesDiv.innerHTML = '';
  db.collection('messages').orderBy('timestamp')
    .onSnapshot(snapshot => {
      messagesDiv.innerHTML = '';
      snapshot.forEach(doc => {
        const msg = doc.data();
        displayMessage(msg);
      });
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

// Display a message in the chat box
function displayMessage(msg) {
  const div = document.createElement('div');
  div.classList.add('message');

  const usernameSpan = document.createElement('div');
  usernameSpan.classList.add('username');
  usernameSpan.textContent = msg.email;

  const timeSpan = document.createElement('span');
  timeSpan.classList.add('time');
  const time = msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date();
  timeSpan.textContent = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  usernameSpan.appendChild(timeSpan);

  const textDiv = document.createElement('div');
  textDiv.classList.add('text');
  textDiv.textContent = msg.text;

  div.appendChild(usernameSpan);
  div.appendChild(textDiv);

  messagesDiv.appendChild(div);
}

// Send message
chatForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  const user = auth.currentUser;
  if (!user) return;

  db.collection('messages').add({
    email: user.email,
    text,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    messageInput.value = '';
  })
  .catch(console.error);
});
