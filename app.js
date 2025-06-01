// Your Firebase config (unchanged)
const firebaseConfig = {
  apiKey: "AIzaSyATFdqh-eQ8PNGJvjysMnC9euxjBCNJA0U",
  authDomain: "nuchat-a894e.firebaseapp.com",
  projectId: "nuchat-a894e",
  storageBucket: "nuchat-a894e.firebasestorage.app",
  messagingSenderId: "323542933372",
  appId: "1:323542933372:web:76bd0229d1da064bda4ef9",
  measurementId: "G-5Q3P8ZKG1M"
};

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
// Fix here: correct id with dash in between
const signupDisplayName = document.getElementById('signup-display-name');
const signupError = document.getElementById('signup-error');

const displayNameSpan = document.getElementById('display-name');
const logoutBtn = document.getElementById('logout-btn');

const messagesDiv = document.getElementById('messages');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');

// Tab switching
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

// Auth state change handler
auth.onAuthStateChanged(async user => {
  if (user) {
    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      const data = userDoc.data();

      displayNameSpan.textContent = data?.displayName || user.email;

      const userRole = data?.role || "user"; // default role

      if (userRole === "admin") {
        displayNameSpan.style.color = "orange"; // highlight admin name
      } else {
        displayNameSpan.style.color = "#00ff73"; // normal user color
      }

      authSection.classList.add('hidden');
      chatSection.classList.remove('hidden');

      loadMessages();

    } catch {
      displayNameSpan.textContent = user.email;
      displayNameSpan.style.color = "#00ff73";
    }
  } else {
    authSection.classList.remove('hidden');
    chatSection.classList.add('hidden');
    displayNameSpan.textContent = '';
    messagesDiv.innerHTML = '';
  }
});

// Login form submit
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

// Signup form submit
signupForm.addEventListener('submit', e => {
  e.preventDefault();
  signupError.textContent = '';

  const email = signupEmail.value.trim();
  const password = signupPassword.value.trim();
  const displayName = signupDisplayName.value.trim();

  if (password.length < 6) {
    signupError.textContent = 'Password must be at least 6 characters.';
    return;
  }

  if (!displayName) {
    signupError.textContent = 'Please enter a display name.';
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(cred => {
      // When a user signs up, store displayName and role = user by default
      return db.collection('users').doc(cred.user.uid).set({
        displayName,
        role: "user"  // default role
      });
    })
    .then(() => {
      signupForm.reset();
    })
    .catch(err => {
      signupError.textContent = err.message;
    });
});

// Logout button
logoutBtn.addEventListener('click', () => {
  auth.signOut();
});

// Load and listen to messages
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

// Display a message with admin highlight based on role
function displayMessage(msg) {
  const div = document.createElement('div');
  div.classList.add('message');

  const usernameSpan = document.createElement('div');
  usernameSpan.classList.add('username');

  const isAdmin = msg.role === "admin";

  usernameSpan.style.color = isAdmin ? 'orange' : '#00ff73';

  let usernameText = msg.displayName || 'Anonymous';

  if (isAdmin) {
    usernameText += ' [ADMIN]';
  }

  usernameSpan.textContent = usernameText;

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

// Send message with role included
chatForm.addEventListener('submit', async e => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  const user = auth.currentUser;
  if (!user) return;

  try {
    const userDoc = await db.collection('users').doc(user.uid).get();
    const data = userDoc.data();
    const displayName = data?.displayName || user.email;
    const role = data?.role || "user";

    await db.collection('messages').add({
      uid: user.uid,
      displayName,
      role,      // store role here
      text,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    messageInput.value = '';
  } catch (err) {
    console.error(err);
  }
});
