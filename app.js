// ================= STATE & CONFIGURATION ================= //
let currentUser = null;
let birthdays = [];
let countdownInterval = null;
let clockInterval = null;
let activeConfetti = false;

// Default Users (Seed)
const DEFAULT_ACCOUNTS = [
  { username: 'admin', password: 'password123' }
];

// Seed Birthdays for new accounts
const SEED_BIRTHDAYS = [
  {
    id: 'seed-1',
    name: 'Sophia Loren',
    date: '1995-07-12',
    category: 'Family',
    omitYear: false,
    color: '#8b5cf6', // Violet
    notes: 'Loves fresh lavender bouquets and dark chocolate.'
  },
  {
    id: 'seed-2',
    name: 'Liam Chen',
    date: '1998-03-24',
    category: 'Friend',
    omitYear: false,
    color: '#06b6d4', // Cyan
    notes: 'Coffee connoisseur. Gift idea: artisanal beans.'
  },
  {
    id: 'seed-3',
    name: 'Diana Prince',
    date: '1989-10-30',
    category: 'Work',
    omitYear: true,
    color: '#10b981', // Emerald
    notes: 'Very organized. Prefers minimalist journals.'
  },
  {
    id: 'seed-4',
    name: 'Oliver Queen',
    date: '2026-06-29', // Set near current local time (June 28, 2026)
    category: 'Other',
    omitYear: false,
    color: '#ec4899', // Rose
    notes: 'Likes target archery and leather accessories.'
  }
];

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initClock();
});

// ================= TOAST NOTIFICATIONS ================= //
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✨';
  if (type === 'error') icon = '⚠️';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;
  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'toast-slide-in 0.3s reverse forwards';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 4000);
}

// ================= CLOCK ================= //
function initClock() {
  const clockEl = document.getElementById('live-clock');
  
  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hoursStr = String(hours).padStart(2, '0');
    
    clockEl.textContent = `${hoursStr}:${minutes}:${seconds} ${ampm}`;
  }
  
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
}

// ================= AUTHENTICATION ================= //
function initAuth() {
  // Ensure default accounts exist
  if (!localStorage.getItem('auraremind_accounts')) {
    localStorage.setItem('auraremind_accounts', JSON.stringify(DEFAULT_ACCOUNTS));
  }

  // Check existing session
  const savedSession = localStorage.getItem('auraremind_session');
  if (savedSession) {
    currentUser = savedSession;
    loadDashboard();
  } else {
    showAuthPage();
  }
}

function showAuthPage() {
  document.getElementById('auth-page').classList.remove('hidden');
  document.getElementById('dashboard-page').classList.add('hidden');
  if (countdownInterval) clearInterval(countdownInterval);
}

function switchAuthTab(tab) {
  const loginTab = document.getElementById('tab-login');
  const registerTab = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (tab === 'login') {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
  } else {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
  }
}

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
}

function getAccounts() {
  return JSON.parse(localStorage.getItem('auraremind_accounts') || '[]');
}

function saveAccounts(accounts) {
  localStorage.setItem('auraremind_accounts', JSON.stringify(accounts));
}

function handleLogin(event) {
  event.preventDefault();
  const usernameInput = document.getElementById('login-username').value.trim();
  const passwordInput = document.getElementById('login-password').value;
  const rememberMe = document.getElementById('remember-me').checked;

  const accounts = getAccounts();
  const user = accounts.find(acc => acc.username.toLowerCase() === usernameInput.toLowerCase());

  if (user && user.password === passwordInput) {
    currentUser = user.username;
    localStorage.setItem('auraremind_session', currentUser);
    
    // Seed default birthdays on first-ever login of admin
    const userBirthdaysKey = `auraremind_birthdays_${currentUser}`;
    if (!localStorage.getItem(userBirthdaysKey)) {
      localStorage.setItem(userBirthdaysKey, JSON.stringify(SEED_BIRTHDAYS));
    }

    showToast(`Welcome back, ${currentUser}!`, 'success');
    loadDashboard();
    document.getElementById('login-form').reset();
  } else {
    showToast('Invalid username or password.', 'error');
  }
}

function handleRegister(event) {
  event.preventDefault();
  const usernameInput = document.getElementById('register-username').value.trim();
  const passwordInput = document.getElementById('register-password').value;
  const confirmPasswordInput = document.getElementById('register-confirm-password').value;

  if (usernameInput.length < 3) {
    showToast('Username must be at least 3 characters.', 'error');
    return;
  }

  if (passwordInput.length < 6) {
    showToast('Password must be at least 6 characters.', 'error');
    return;
  }

  if (passwordInput !== confirmPasswordInput) {
    showToast('Passwords do not match.', 'error');
    return;
  }

  const accounts = getAccounts();
  const exists = accounts.some(acc => acc.username.toLowerCase() === usernameInput.toLowerCase());

  if (exists) {
    showToast('Username is already taken.', 'error');
    return;
  }

  // Create account
  accounts.push({ username: usernameInput, password: passwordInput });
  saveAccounts(accounts);

  // Seed default data for the new user
  const userBirthdaysKey = `auraremind_birthdays_${usernameInput}`;
  localStorage.setItem(userBirthdaysKey, JSON.stringify(SEED_BIRTHDAYS));

  showToast('Registration successful! Logging in...', 'success');
  currentUser = usernameInput;
  localStorage.setItem('auraremind_session', currentUser);
  loadDashboard();
  document.getElementById('register-form').reset();
}

function handleLogout() {
  localStorage.removeItem('auraremind_session');
  currentUser = null;
  showToast('Logged out successfully.', 'info');
  showAuthPage();
}

function showForgotPassword(event) {
  event.preventDefault();
  showToast('Feature coming soon! Contact support to reset.', 'info');
}

// ================= BIRTHDAY STATE MANAGEMENT ================= //
function getUserBirthdaysKey() {
  return `auraremind_birthdays_${currentUser}`;
}

function loadBirthdays() {
  const key = getUserBirthdaysKey();
  birthdays = JSON.parse(localStorage.getItem(key) || '[]');
}

function saveBirthdaysState() {
  const key = getUserBirthdaysKey();
  localStorage.setItem(key, JSON.stringify(birthdays));
}

// ================= UTILITIES: ZODIAC & AGE ================= //
function getZodiacSign(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.getMonth() + 1; // 1-12

  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { name: 'Aquarius', icon: '♒' };
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return { name: 'Pisces', icon: '♓' };
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { name: 'Aries', icon: '♈' };
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { name: 'Taurus', icon: '♉' };
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return { name: 'Gemini', icon: '♊' };
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return { name: 'Cancer', icon: '♋' };
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { name: 'Leo', icon: '♌' };
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { name: 'Virgo', icon: '♍' };
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { name: 'Libra', icon: '♎' };
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { name: 'Scorpio', icon: '♏' };
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { name: 'Sagittarius', icon: '♐' };
  return { name: 'Capricorn', icon: '♑' };
}

function getAgeInfo(dateStr, omitYear) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const birthDate = new Date(dateStr);
  const birthMonth = birthDate.getMonth();
  const birthDay = birthDate.getDate();

  // Next birthday calculation
  let nextBday = new Date(today.getFullYear(), birthMonth, birthDay);
  if (nextBday < today) {
    nextBday.setFullYear(today.getFullYear() + 1);
  }

  // Days remaining calculation
  const oneDayMs = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.ceil((nextBday - today) / oneDayMs);

  const isToday = daysRemaining === 365 || daysRemaining === 0 || 
                  (today.getMonth() === birthMonth && today.getDate() === birthDay);

  const actualDaysRemaining = isToday ? 0 : daysRemaining;

  // Age calculation
  let currentAge = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthMonth;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
    currentAge--;
  }

  const turningAge = omitYear ? null : currentAge + 1;
  const ageDisplay = omitYear ? null : currentAge;

  // Badge Text
  let badgeText = '';
  if (isToday) {
    badgeText = 'Today! 🎉';
  } else if (actualDaysRemaining === 1) {
    badgeText = 'Tomorrow';
  } else {
    badgeText = `In ${actualDaysRemaining} days`;
  }

  return {
    currentAge: ageDisplay,
    turningAge,
    daysRemaining: actualDaysRemaining,
    badgeText,
    isToday,
    nextBirthdayDate: nextBday
  };
}

// ================= DASHBOARD CORE LOGIC ================= //
function loadDashboard() {
  document.getElementById('auth-page').classList.add('hidden');
  document.getElementById('dashboard-page').classList.remove('hidden');
  
  // Set User Details
  document.getElementById('user-greeting').textContent = `Hi, ${currentUser}`;
  document.getElementById('user-avatar').textContent = currentUser.charAt(0).toUpperCase();

  loadBirthdays();
  handleFilterSort();
  startConfettiLoop();
}

function handleFilterSort() {
  const searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
  const categoryFilter = document.getElementById('filter-category').value;
  const sortBy = document.getElementById('sort-by').value;

  let filtered = [...birthdays];

  // Search
  if (searchQuery) {
    filtered = filtered.filter(b => b.name.toLowerCase().includes(searchQuery));
  }

  // Category
  if (categoryFilter !== 'all') {
    filtered = filtered.filter(b => b.category === categoryFilter);
  }

  // Add metrics for sorting
  const enriched = filtered.map(b => {
    const ageInfo = getAgeInfo(b.date, b.omitYear);
    return { ...b, ageInfo };
  });

  // Sort
  if (sortBy === 'upcoming') {
    enriched.sort((a, b) => a.ageInfo.daysRemaining - b.ageInfo.daysRemaining);
  } else if (sortBy === 'name') {
    enriched.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'age') {
    // Sort by age turning (oldest to youngest, omitYear items go last)
    enriched.sort((a, b) => {
      if (a.omitYear && !b.omitYear) return 1;
      if (!a.omitYear && b.omitYear) return -1;
      if (a.omitYear && b.omitYear) return 0;
      return a.ageInfo.turningAge - b.ageInfo.turningAge;
    });
  } else if (sortBy === 'date') {
    // Sort by calendar month/day
    enriched.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getMonth() !== dateB.getMonth()) {
        return dateA.getMonth() - dateB.getMonth();
      }
      return dateA.getDate() - dateB.getDate();
    });
  }

  renderGrid(enriched);
  renderStats();
  updateSpotlight();
}

function renderStats() {
  const totalCount = birthdays.length;
  const currentMonth = new Date().getMonth();
  const thisMonthCount = birthdays.filter(b => {
    const bMonth = new Date(b.date).getMonth();
    return bMonth === currentMonth;
  }).length;

  document.getElementById('stat-total').textContent = totalCount;
  document.getElementById('stat-month').textContent = thisMonthCount;
}

function updateSpotlight() {
  if (countdownInterval) clearInterval(countdownInterval);

  if (birthdays.length === 0) {
    document.getElementById('spotlight-name').textContent = 'No Birthdays';
    document.getElementById('spotlight-turning').textContent = 'Add a birthday to start tracking';
    document.getElementById('spotlight-date').textContent = '📅 --';
    document.getElementById('spotlight-avatar').textContent = '?';
    document.getElementById('spotlight-avatar').style.background = '';
    document.getElementById('spotlight-zodiac-icon').textContent = '✨';
    document.getElementById('spotlight-zodiac-name').textContent = 'Sign';
    
    document.getElementById('countdown-days').textContent = '00';
    document.getElementById('countdown-hours').textContent = '00';
    document.getElementById('countdown-minutes').textContent = '00';
    document.getElementById('countdown-seconds').textContent = '00';
    return;
  }

  // Get nearest upcoming birthday
  const enriched = birthdays.map(b => {
    return { ...b, ageInfo: getAgeInfo(b.date, b.omitYear) };
  });

  // Sort by days remaining
  enriched.sort((a, b) => a.ageInfo.daysRemaining - b.ageInfo.daysRemaining);
  const nextUp = enriched[0];

  const zodiac = getZodiacSign(nextUp.date);
  
  // Set Spotlight Details
  document.getElementById('spotlight-name').textContent = nextUp.name;
  document.getElementById('spotlight-zodiac-icon').textContent = zodiac.icon;
  document.getElementById('spotlight-zodiac-name').textContent = zodiac.name;
  
  const bdate = new Date(nextUp.date);
  const formattingOptions = { month: 'long', day: 'numeric' };
  if (!nextUp.omitYear) formattingOptions.year = 'numeric';
  document.getElementById('spotlight-date').textContent = `📅 ${bdate.toLocaleDateString(undefined, formattingOptions)}`;
  
  // Avatar
  const avatarEl = document.getElementById('spotlight-avatar');
  avatarEl.textContent = nextUp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  avatarEl.style.background = nextUp.color;

  // Turning display
  if (nextUp.ageInfo.isToday) {
    document.getElementById('spotlight-turning').textContent = nextUp.omitYear ? 'Celebrating today! 🎉' : `Turning ${nextUp.ageInfo.turningAge} today! 🎉`;
    activeConfetti = true;
  } else {
    document.getElementById('spotlight-turning').textContent = nextUp.omitYear ? 'Upcoming Birthday' : `Turning ${nextUp.ageInfo.turningAge}`;
    activeConfetti = false;
  }

  // Live Countdown Countdown setup
  function runCountdown() {
    const now = new Date();
    // Next birthday targets midnight (local time) on the calendar day
    const nextBdayDate = nextUp.ageInfo.nextBirthdayDate;
    
    let diff = nextBdayDate - now;

    if (diff <= 0 && nextUp.ageInfo.isToday) {
      // If it is today, we count down to midnight tonight (end of today)
      const endOfToday = new Date(nextBdayDate.getFullYear(), nextBdayDate.getMonth(), nextBdayDate.getDate(), 23, 59, 59, 999);
      diff = endOfToday - now;
    }

    if (diff < 0) {
      diff = 0;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('countdown-days').textContent = String(days).padStart(2, '0');
    document.getElementById('countdown-hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('countdown-minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('countdown-seconds').textContent = String(seconds).padStart(2, '0');
  }

  runCountdown();
  countdownInterval = setInterval(runCountdown, 1000);
}

function renderGrid(list) {
  const grid = document.getElementById('birthday-grid');
  grid.innerHTML = '';

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state glass-panel">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <p>No matches found matching filters.</p>
      </div>
    `;
    return;
  }

  list.forEach(b => {
    const zodiac = getZodiacSign(b.date);
    const initials = b.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const formattedDate = new Date(b.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: b.omitYear ? undefined : 'numeric'
    });

    const isBdayToday = b.ageInfo.isToday;
    const badgeClass = isBdayToday ? 'countdown-badge today' : 'countdown-badge';

    const card = document.createElement('div');
    card.className = 'birthday-card glass-panel';
    card.style.setProperty('--card-theme', b.color);
    
    // Notes block logic
    const notesHTML = b.notes ? `<div class="card-notes" title="${b.notes}">${b.notes}</div>` : '';
    
    // Age string
    let ageString = '';
    if (!b.omitYear) {
      ageString = isBdayToday ? `Turns ${b.ageInfo.turningAge}` : `Turns ${b.ageInfo.turningAge} (${b.ageInfo.currentAge} yrs old)`;
    } else {
      ageString = 'Age Omitted';
    }

    card.innerHTML = `
      <div class="card-top">
        <div class="avatar-md">${initials}</div>
        <div class="card-tags">
          <span class="category-tag">${b.category}</span>
          <span class="${badgeClass}">${b.ageInfo.badgeText}</span>
        </div>
      </div>
      <div class="card-body">
        <h3>${b.name}</h3>
        <p class="card-subtitle">📅 ${formattedDate}</p>
        <p class="card-subtitle" style="font-weight: 500; color: var(--accent-cyan);">${ageString}</p>
        <div class="card-zodiac">
          <span>${zodiac.icon}</span>
          <span>${zodiac.name}</span>
        </div>
        ${notesHTML}
      </div>
      <div class="card-footer">
        <button class="btn-card-action" onclick="openEditModal('${b.id}')" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </button>
        <button class="btn-card-action delete" onclick="handleDeleteBirthday('${b.id}')" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ================= MODAL CONTROLS ================= //
function openModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

function toggleYearInput(prefix) {
  const omitChecked = document.getElementById(`${prefix}-omit-year`).checked;
  const dateInput = document.getElementById(`${prefix}-date`);
  
  // Set helper description or restrictions if needed.
  // Note: Standard <input type="date"> requires year to parse correctly in native browsers.
  // When omit year is true, we still save the full date including year, but visually skip rendering the age calculations.
}

// ================= CRUD IMPLEMENTATION ================= //
function handleAddBirthday(event) {
  event.preventDefault();
  
  const name = document.getElementById('add-name').value.trim();
  const date = document.getElementById('add-date').value;
  const category = document.getElementById('add-category').value;
  const omitYear = document.getElementById('add-omit-year').checked;
  const color = document.querySelector('input[name="add-color"]:checked').value;
  const notes = document.getElementById('add-notes').value.trim();

  const newBday = {
    id: 'bday-' + Date.now(),
    name,
    date,
    category,
    omitYear,
    color,
    notes
  };

  birthdays.push(newBday);
  saveBirthdaysState();
  handleFilterSort();
  closeModal('add-modal');
  document.getElementById('add-birthday-form').reset();
  showToast(`${name}'s birthday added!`, 'success');
}

function openEditModal(id) {
  const b = birthdays.find(item => item.id === id);
  if (!b) return;

  document.getElementById('edit-id').value = b.id;
  document.getElementById('edit-name').value = b.name;
  document.getElementById('edit-date').value = b.date;
  document.getElementById('edit-category').value = b.category;
  document.getElementById('edit-omit-year').checked = b.omitYear;
  document.getElementById('edit-notes').value = b.notes || '';

  // Select matching radio color
  const radio = document.querySelector(`input[name="edit-color"][value="${b.color}"]`);
  if (radio) {
    radio.checked = true;
  }

  openModal('edit-modal');
}

function handleEditBirthday(event) {
  event.preventDefault();
  
  const id = document.getElementById('edit-id').value;
  const name = document.getElementById('edit-name').value.trim();
  const date = document.getElementById('edit-date').value;
  const category = document.getElementById('edit-category').value;
  const omitYear = document.getElementById('edit-omit-year').checked;
  const color = document.querySelector('input[name="edit-color"]:checked').value;
  const notes = document.getElementById('edit-notes').value.trim();

  const idx = birthdays.findIndex(item => item.id === id);
  if (idx !== -1) {
    birthdays[idx] = {
      id,
      name,
      date,
      category,
      omitYear,
      color,
      notes
    };
    
    saveBirthdaysState();
    handleFilterSort();
    closeModal('edit-modal');
    showToast(`Updated details for ${name}`, 'success');
  }
}

function handleDeleteBirthday(id) {
  const b = birthdays.find(item => item.id === id);
  if (!b) return;

  if (confirm(`Are you sure you want to delete ${b.name}'s birthday?`)) {
    birthdays = birthdays.filter(item => item.id !== id);
    saveBirthdaysState();
    handleFilterSort();
    showToast(`Removed birthday entry.`, 'info');
  }
}

// ================= EXPORT & IMPORT ================= //
function exportData() {
  if (birthdays.length === 0) {
    showToast('No birthday records to export.', 'error');
    return;
  }

  const dataStr = JSON.stringify(birthdays, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `auraremind_backup_${currentUser}_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('Backup JSON exported successfully!', 'success');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        // Validate keys briefly
        const valid = imported.every(item => item.name && item.date && item.category);
        if (valid) {
          // Re-generate IDs to prevent duplicates and append or replace
          const updatedImported = imported.map(item => ({
            ...item,
            id: item.id || 'bday-' + Math.random().toString(36).substr(2, 9)
          }));
          
          birthdays = [...birthdays, ...updatedImported];
          
          // Deduplicate by Name & Date
          const uniqueMap = {};
          birthdays.forEach(item => {
            const key = `${item.name.toLowerCase()}_${item.date}`;
            uniqueMap[key] = item;
          });
          birthdays = Object.values(uniqueMap);

          saveBirthdaysState();
          handleFilterSort();
          showToast(`Successfully imported ${updatedImported.length} birthday records!`, 'success');
        } else {
          showToast('Invalid backup file structure.', 'error');
        }
      } else {
        showToast('JSON structure is incorrect.', 'error');
      }
    } catch(err) {
      showToast('Error reading JSON file.', 'error');
    }
  };
  reader.readAsText(file);
  // reset file input
  event.target.value = '';
}

// ================= CONFETTI CANVAS EFFECTS ================= //
function startConfettiLoop() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  
  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const colors = ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b'];
  const particles = [];

  for (let i = 0; i < 70; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height - height,
      r: Math.random() * 6 + 4,
      d: Math.random() * height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    });
  }

  function draw() {
    if (!currentUser) return; // Stop drawing when logged out
    
    ctx.clearRect(0, 0, width, height);

    if (activeConfetti) {
      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

        if (p.y > height) {
          p.x = Math.random() * width;
          p.y = -20;
          p.tilt = Math.random() * 10 - 5;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });
    }

    requestAnimationFrame(draw);
  }

  draw();
}
