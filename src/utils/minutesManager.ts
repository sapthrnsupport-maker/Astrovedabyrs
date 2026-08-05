import { UserProfile, RechargePlan, RechargeTransaction, UserActivityLog } from '../types';

const STORAGE_USERS_KEY = 'astroveda_users_v2';
const STORAGE_CURRENT_ID_KEY = 'astroveda_active_userid_v2';
const STORAGE_LOGS_KEY = 'astroveda_tx_logs_v2';
const STORAGE_ACTIVITY_KEY = 'astroveda_activity_logs_v2';

export const RECHARGE_PLANS: RechargePlan[] = [
  {
    id: 'plan_starter',
    minutes: 10,
    priceINR: 99,
    originalPriceINR: 199,
    discountPercentage: 50,
    badge: 'Starter Pass'
  },
  {
    id: 'plan_popular',
    minutes: 30,
    priceINR: 249,
    originalPriceINR: 599,
    discountPercentage: 58,
    badge: 'Most Popular',
    popular: true
  },
  {
    id: 'plan_pro',
    minutes: 60,
    priceINR: 449,
    originalPriceINR: 1199,
    discountPercentage: 62,
    badge: 'Value Pack'
  },
  {
    id: 'plan_unlimited',
    minutes: 120,
    priceINR: 799,
    originalPriceINR: 2399,
    discountPercentage: 66,
    badge: 'Guru VIP'
  }
];

const DEFAULT_USERS: { [id: string]: UserProfile } = {
  '880101': {
    id: '880101',
    name: 'Rahul Sharma',
    pin: '1234',
    gender: 'male',
    dob: '1996-08-15',
    tob: '10:30',
    pob: 'New Delhi, India',
    availableMinutes: 15,
    totalRechargedMinutes: 15,
    createdAt: new Date().toISOString()
  },
  '904212': {
    id: '904212',
    name: 'Priya Patel',
    pin: '1234',
    gender: 'female',
    dob: '1998-11-23',
    tob: '18:45',
    pob: 'Ahmedabad, India',
    availableMinutes: 30,
    totalRechargedMinutes: 30,
    createdAt: new Date().toISOString()
  }
};

const DEFAULT_LOGS: RechargeTransaction[] = [
  {
    id: 'tx_init_1',
    userId: '880101',
    userName: 'Rahul Sharma',
    minutesAdded: 15,
    amountPaid: 0,
    type: 'ADMIN_GRANT',
    method: 'Welcome Bonus',
    grantedBy: 'Guruji Admin',
    note: 'Initial Registration Bonus Minutes',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'tx_init_2',
    userId: '904212',
    userName: 'Priya Patel',
    minutesAdded: 30,
    amountPaid: 249,
    type: 'SELF_PURCHASE',
    method: 'UPI / GPay',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

export function getUsersDb(): { [id: string]: UserProfile } {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading users db:', e);
    return DEFAULT_USERS;
  }
}

export function saveUsersDb(users: { [id: string]: UserProfile }) {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users db:', e);
  }
}

export function getActiveUserId(): string {
  try {
    const id = localStorage.getItem(STORAGE_CURRENT_ID_KEY);
    if (id && getUsersDb()[id]) return id;
    // Do NOT auto-set a dummy account like 880101 with free minutes!
    return id || '';
  } catch (e) {
    return '';
  }
}

export function setActiveUserId(userId: string) {
  try {
    if (!userId) {
      localStorage.removeItem(STORAGE_CURRENT_ID_KEY);
    } else {
      localStorage.setItem(STORAGE_CURRENT_ID_KEY, userId);
    }
  } catch (e) {
    console.error('Error setting active user ID:', e);
  }
}

export function logoutUser() {
  try {
    localStorage.removeItem(STORAGE_CURRENT_ID_KEY);
  } catch (e) {
    console.error('Error logging out user:', e);
  }
}

export function getActiveUserProfile(): UserProfile | null {
  const users = getUsersDb();
  const id = getActiveUserId();
  if (!id) return null;
  if (users[id]) return users[id];
  return fetchUserById(id);
}

// Sync all users with server (2-way sync)
export async function syncAllUsersFromServer(): Promise<{ [id: string]: UserProfile }> {
  const localUsers = getUsersDb();
  try {
    // Step 1: Push local users to server sync endpoint
    await fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: localUsers })
    });

    // Step 2: Fetch full merged user database from server
    const res = await fetch('/api/users');
    if (res.ok) {
      const serverUsers = await res.json();
      if (serverUsers && typeof serverUsers === 'object') {
        const merged = { ...localUsers, ...serverUsers };
        saveUsersDb(merged);
        return merged;
      }
    }
  } catch (e) {
    console.error('Error syncing users from server:', e);
  }
  return getUsersDb();
}

// Live lookup of existing user by User ID or Email (Server + Cache)
export async function fetchUserByIdAsync(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  const clean = userId.trim();
  
  // 1. Check local storage cache
  const local = fetchUserById(clean);
  if (local) return local;

  // 2. Sync from server database to fetch users created on other devices
  try {
    const synced = await syncAllUsersFromServer();
    if (synced && typeof synced === 'object') {
      const match = fetchUserById(clean);
      if (match) return match;
    }
  } catch (e) {
    console.error('Error syncing before fetch:', e);
  }

  // 3. Fallback direct server fetch
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(clean)}`);
    if (res.ok) {
      const user = await res.json();
      if (user && user.id) {
        const users = getUsersDb();
        users[user.id] = user;
        saveUsersDb(users);
        return user;
      }
    }
  } catch (e) {
    console.error('Error fetching user from server:', e);
  }

  return fetchUserById(clean);
}

export function fetchUserById(userId: string): UserProfile | null {
  if (!userId) return null;
  const users = getUsersDb();
  const cleanUpper = userId.trim().toUpperCase();
  const cleanLower = userId.trim().toLowerCase();

  for (const [key, u] of Object.entries(users)) {
    if (!u) continue;
    if (key.trim().toUpperCase() === cleanUpper) return u;
    if (u.id && u.id.trim().toUpperCase() === cleanUpper) return u;
    if (u.email && u.email.trim().toLowerCase() === cleanLower) return u;
    if (u.name && u.name.trim().toLowerCase() === cleanLower) return u;
  }
  return null;
}

export function changeUserPin(
  userId: string,
  currentPin: string,
  newPin: string
): { success: boolean; message: string } {
  const users = getUsersDb();
  const cleanId = userId.trim().toUpperCase();
  const user = users[cleanId];
  if (!user) {
    return { success: false, message: 'User account not found.' };
  }

  const existingPin = user.pin || '1234';
  if (currentPin.trim() !== existingPin.trim()) {
    return { success: false, message: 'Current Security PIN / Password is incorrect!' };
  }

  if (!newPin.trim()) {
    return { success: false, message: 'New Security PIN / Password cannot be empty.' };
  }

  users[cleanId].pin = newPin.trim();
  saveUsersDb(users);

  // Background server sync
  fetch('/api/users/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: cleanId, updates: { pin: newPin.trim() } })
  }).catch(e => console.error('Error updating pin on server:', e));

  return { success: true, message: 'Security PIN / Password updated successfully!' };
}

export function adminResetUserPin(
  userId: string,
  newPin: string
): { success: boolean; message: string } {
  const users = getUsersDb();
  const cleanId = userId.trim().toUpperCase();
  if (!users[cleanId]) {
    return { success: false, message: `User ID '${cleanId}' not found.` };
  }
  if (!newPin.trim()) {
    return { success: false, message: 'PIN cannot be empty.' };
  }
  users[cleanId].pin = newPin.trim();
  saveUsersDb(users);

  // Background server sync
  fetch('/api/users/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: cleanId, updates: { pin: newPin.trim() } })
  }).catch(e => console.error('Error updating pin on server:', e));

  return { success: true, message: `PIN updated successfully for ${users[cleanId].name} (${cleanId})!` };
}

export function updateUserProfile(updated: Partial<UserProfile>) {
  const users = getUsersDb();
  const activeId = getActiveUserId();
  if (users[activeId]) {
    users[activeId] = { ...users[activeId], ...updated };
    saveUsersDb(users);

    // Background server sync
    fetch('/api/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: activeId, updates: updated })
    }).catch(e => console.error('Error updating user on server:', e));
  }
}

// Validate User Name (must contain alphabetic letters, not pure numbers)
export function validateUserName(name: string): { isValid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Name cannot be empty.' };
  }
  if (/^\d+$/.test(trimmed)) {
    return { isValid: false, error: 'Invalid Name! Name cannot be numbers only (e.g., 1234). Please enter a real name.' };
  }
  if (!/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: 'Name must contain actual alphabetic letters (e.g., Rohit, Rahul).' };
  }
  return { isValid: true };
}

// Generate unique 6-digit numeric User ID
export function generateNumericUserId(): string {
  const users = getUsersDb();
  let id = '';
  do {
    id = Math.floor(100000 + Math.random() * 900000).toString();
  } while (users[id]);
  return id;
}

// Verify User Password / PIN for Account Switch / Login (Server + Local Fallback)
export async function verifyUserPinAsync(
  userId: string,
  pinInput: string
): Promise<{ success: boolean; message: string; user?: UserProfile }> {
  const query = userId.trim();
  
  // First ensure local state has latest users from cloud server
  await syncAllUsersFromServer().catch(() => {});

  try {
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: query, pin: pinInput })
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      const users = getUsersDb();
      const realId = data.user.id;
      users[realId] = data.user;
      saveUsersDb(users);
      setActiveUserId(realId);
      return {
        success: true,
        message: `Logged in successfully as ${data.user.name} (${data.user.id})!`,
        user: data.user
      };
    }
  } catch (e) {
    console.error('Server login error, using local check:', e);
  }

  // Perform another sync in case account was created just moments ago on another device
  await syncAllUsersFromServer().catch(() => {});

  // Fallback to local check if server check fails or account was saved locally
  const localRes = verifyUserPin(query, pinInput);
  if (localRes.success && localRes.user) {
    // Sync local user to server
    fetch('/api/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localRes.user)
    }).catch(err => console.error('Error syncing local user to server:', err));
    return localRes;
  }

  return {
    success: false,
    message: localRes.message || `Account '${query}' not found or incorrect Security PIN!`
  };
}

export function verifyUserPin(userId: string, pinInput: string): { success: boolean; message: string; user?: UserProfile } {
  const user = fetchUserById(userId);
  if (!user) {
    return { success: false, message: `User ID '${userId}' does not exist.` };
  }
  
  // Default PIN if none set is '1234'
  const userPin = user.pin || '1234';
  if (pinInput.trim() !== userPin.trim()) {
    return { success: false, message: 'Incorrect Security PIN / Password! Access denied.' };
  }

  setActiveUserId(user.id);
  return {
    success: true,
    message: `Logged in successfully as ${user.name} (${user.id})!`,
    user
  };
}

export async function createNewUserAsync(params: {
  id?: string;
  name: string;
  email?: string;
  dob?: string;
  tob?: string;
  pob?: string;
  gender?: string;
  pin?: string;
  initialMinutes?: number;
}): Promise<{ success: boolean; message?: string; user?: UserProfile }> {
  try {
    const res = await fetch('/api/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      const users = getUsersDb();
      users[data.user.id] = data.user;
      saveUsersDb(users);
      setActiveUserId(data.user.id);
      await syncAllUsersFromServer().catch(() => {});
      return { success: true, user: data.user };
    } else {
      const localUser = createNewUser(params.id, params.name, params.initialMinutes || 15, params.pin || '1234');
      await syncAllUsersFromServer().catch(() => {});
      return { success: true, user: localUser };
    }
  } catch (e: any) {
    console.error('Error creating user on server, falling back to local creation:', e);
    try {
      const localUser = createNewUser(params.id, params.name, params.initialMinutes || 15, params.pin || '1234');
      await syncAllUsersFromServer().catch(() => {});
      return { success: true, user: localUser };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error creating account.' };
    }
  }
}

export function createNewUser(id?: string, name?: string, initialMinutes = 15, userPin = '1234'): UserProfile {
  const users = getUsersDb();
  const rawName = name && name.trim() ? name.trim() : 'Astro Seeker';
  
  // Validate name
  const nameCheck = validateUserName(rawName);
  if (!nameCheck.isValid) {
    throw new Error(nameCheck.error || 'Invalid name provided.');
  }

  let formattedId = id ? id.trim().toUpperCase() : '';

  // Check if ID already exists!
  if (formattedId && users[formattedId]) {
    const existing = users[formattedId];
    throw new Error(
      `User ID '${formattedId}' ALREADY EXISTS (${existing.name})! To access this existing account, please log in with Security PIN.`
    );
  }

  if (!formattedId) {
    formattedId = generateNumericUserId();
  }

  const profile: UserProfile = {
    id: formattedId,
    name: rawName,
    pin: userPin.trim() || '1234',
    gender: 'male',
    dob: '1998-01-01',
    tob: '12:00',
    pob: 'Delhi, India',
    availableMinutes: initialMinutes,
    totalRechargedMinutes: initialMinutes,
    createdAt: new Date().toISOString()
  };

  users[formattedId] = profile;
  saveUsersDb(users);
  setActiveUserId(formattedId);

  // Background server sync
  syncAllUsersFromServer().catch(e => console.error('Error syncing new user to server:', e));

  return profile;
}

// In-App Self / Profile Purchase of Minutes with Payment Method and Coupon Discount (Async Server Sync)
export async function purchaseMinutesForProfileAsync(
  targetProfileId: string,
  plan: RechargePlan,
  paymentMethod: string = 'UPI / GPay',
  discountAmount: number = 0
): Promise<{ success: boolean; newBalance: number; targetUser?: UserProfile; message?: string }> {
  const cleanId = targetProfileId.trim().toUpperCase() || getActiveUserId();
  const finalPrice = Math.max(0, plan.priceINR - discountAmount);
  const users = getUsersDb();
  const existingLocal = users[cleanId] || fetchUserById(cleanId);

  try {
    const res = await fetch('/api/users/recharge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: cleanId,
        minutes: plan.minutes,
        amountPaid: finalPrice,
        type: 'SELF_PURCHASE',
        method: paymentMethod,
        actionType: 'ADD',
        userProfile: existingLocal || undefined
      })
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      const realId = data.user.id;
      users[realId] = data.user;
      saveUsersDb(users);
      if (data.tx) addTransactionLog(data.tx);
      return { success: true, newBalance: data.user.availableMinutes, targetUser: data.user };
    }
  } catch (e) {
    console.error('Server recharge error, falling back to local purchase:', e);
  }

  return purchaseMinutesForProfile(targetProfileId, plan, paymentMethod, discountAmount);
}

export function purchaseMinutesForProfile(
  targetProfileId: string,
  plan: RechargePlan,
  paymentMethod: string = 'UPI / GPay',
  discountAmount: number = 0
): { success: boolean; newBalance: number; targetUser?: UserProfile; message?: string } {
  const users = getUsersDb();
  const cleanId = targetProfileId.trim().toUpperCase() || getActiveUserId();
  const targetUser = users[cleanId];

  if (!targetUser) {
    return {
      success: false,
      newBalance: 0,
      message: `User ID '${cleanId}' does not exist.`
    };
  }

  const finalPrice = Math.max(0, plan.priceINR - discountAmount);
  targetUser.availableMinutes += plan.minutes;
  targetUser.totalRechargedMinutes += plan.minutes;
  users[cleanId] = targetUser;
  saveUsersDb(users);

  // Background server sync
  fetch('/api/users/recharge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: cleanId,
      minutes: plan.minutes,
      amountPaid: finalPrice,
      type: 'SELF_PURCHASE',
      method: paymentMethod,
      actionType: 'ADD'
    })
  }).catch(e => console.error('Error syncing purchase to server:', e));

  // Record log
  addTransactionLog({
    id: `tx_checkout_${Date.now()}`,
    userId: cleanId,
    userName: targetUser.name,
    minutesAdded: plan.minutes,
    amountPaid: finalPrice,
    type: 'SELF_PURCHASE',
    method: paymentMethod,
    timestamp: new Date().toISOString()
  });

  return {
    success: true,
    newBalance: targetUser.availableMinutes,
    targetUser
  };
}

// In-App Self Purchase of Minutes
export function purchaseMinutesSelf(plan: RechargePlan): { success: boolean; newBalance: number; message?: string } {
  const activeId = getActiveUserId();
  const res = purchaseMinutesForProfile(activeId, plan, 'In-App Payment (UPI / Cards)');
  return { success: res.success, newBalance: res.newBalance, message: res.message };
}

// Admin / Astrologer ID Recharge function (Async Server Sync)
export async function adminRechargeUserAsync(
  targetUserId: string,
  minutesAmount: number,
  grantedBy: string = 'Astrologer Admin',
  note: string = 'Admin Manual Adjustment',
  actionType: 'ADD' | 'DEDUCT' = 'ADD'
): Promise<{ success: boolean; message: string; user?: UserProfile }> {
  const cleanId = targetUserId.trim().toUpperCase();

  try {
    const res = await fetch('/api/users/recharge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: cleanId,
        minutes: minutesAmount,
        grantedBy,
        note,
        actionType,
        type: 'ADMIN_GRANT',
        method: actionType === 'ADD' ? 'Admin Minutes Credit (+)' : 'Admin Minutes Debit (-)'
      })
    });

    const data = await res.json();
    if (res.ok && data.success && data.user) {
      const users = getUsersDb();
      users[cleanId] = data.user;
      saveUsersDb(users);
      if (data.tx) addTransactionLog(data.tx);

      const msg = actionType === 'ADD'
        ? `Successfully added +${minutesAmount} consultation minutes to User ID: ${cleanId}. New Balance: ${data.user.availableMinutes} mins.`
        : `Successfully deducted -${minutesAmount} consultation minutes from User ID: ${cleanId}. New Balance: ${data.user.availableMinutes} mins.`;

      return { success: true, message: msg, user: data.user };
    } else if (data.error) {
      return { success: false, message: `❌ ${data.error}` };
    }
  } catch (e) {
    console.error('Server recharge error, checking local:', e);
  }

  // Fallback to local
  return adminRechargeUser(targetUserId, minutesAmount, grantedBy, note, actionType);
}

// Admin / Astrologer ID Recharge function (Sync Fallback + Server Push)
export function adminRechargeUser(
  targetUserId: string,
  minutesAmount: number,
  grantedBy: string = 'Astrologer Admin',
  note: string = 'Admin Manual Adjustment',
  actionType: 'ADD' | 'DEDUCT' = 'ADD'
): { success: boolean; message: string; user?: UserProfile } {
  const users = getUsersDb();
  const cleanId = targetUserId.trim().toUpperCase();

  const targetUser = users[cleanId];

  // STRICT REJECTION: Do NOT auto-create profile if ID does not exist
  if (!targetUser) {
    return {
      success: false,
      message: `❌ Error: User ID '${cleanId}' does NOT exist in the system! Please verify the ID or create the account first.`
    };
  }

  if (actionType === 'ADD') {
    targetUser.availableMinutes += minutesAmount;
    targetUser.totalRechargedMinutes += minutesAmount;
  } else {
    targetUser.availableMinutes = Math.max(0, targetUser.availableMinutes - minutesAmount);
  }

  users[cleanId] = targetUser;
  saveUsersDb(users);

  // Background server sync
  fetch('/api/users/recharge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: cleanId,
      minutes: minutesAmount,
      grantedBy,
      note,
      actionType,
      type: 'ADMIN_GRANT',
      method: actionType === 'ADD' ? 'Admin Minutes Credit (+)' : 'Admin Minutes Debit (-)'
    })
  }).catch(e => console.error('Error syncing admin recharge to server:', e));

  // Record transaction
  addTransactionLog({
    id: `tx_admin_${Date.now()}`,
    userId: cleanId,
    userName: targetUser.name,
    minutesAdded: actionType === 'ADD' ? minutesAmount : -minutesAmount,
    amountPaid: 0,
    type: 'ADMIN_GRANT',
    method: actionType === 'ADD' ? 'Admin Minutes Credit (+)' : 'Admin Minutes Debit (-)',
    grantedBy: grantedBy,
    note: note,
    timestamp: new Date().toISOString()
  });

  const msg = actionType === 'ADD'
    ? `Successfully added +${minutesAmount} consultation minutes to User ID: ${cleanId}. New Balance: ${targetUser.availableMinutes} mins.`
    : `Successfully deducted -${minutesAmount} consultation minutes from User ID: ${cleanId}. New Balance: ${targetUser.availableMinutes} mins.`;

  return {
    success: true,
    message: msg,
    user: targetUser
  };
}

// Google Sign-In Integration helper (Async Server + Local Lookup for Cross-Device Support)
export async function loginWithGoogleAccountAsync(googleEmail: string, googleName: string): Promise<UserProfile> {
  const users = getUsersDb();
  const cleanEmail = googleEmail.trim().toLowerCase();
  
  // 1. Check local storage
  const existingLocal = Object.values(users).find(u => u && u.email && u.email.trim().toLowerCase() === cleanEmail);
  if (existingLocal) {
    setActiveUserId(existingLocal.id);
    return existingLocal;
  }

  // 2. Query cloud server for existing user account with this email
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(cleanEmail)}`);
    if (res.ok) {
      const serverUser = await res.json();
      if (serverUser && serverUser.id) {
        users[serverUser.id] = serverUser;
        saveUsersDb(users);
        setActiveUserId(serverUser.id);
        return serverUser;
      }
    }
  } catch (e) {
    console.error('Error querying Google user on server:', e);
  }

  // 3. Fallback to creating a new user profile
  return loginWithGoogleAccount(googleEmail, googleName);
}

export function loginWithGoogleAccount(googleEmail: string, googleName: string): UserProfile {
  const users = getUsersDb();
  
  // Find if email already associated with an existing account
  const existingUser = Object.values(users).find(u => u.email === googleEmail);
  if (existingUser) {
    setActiveUserId(existingUser.id);
    return existingUser;
  }

  // Assign numeric Google ID e.g. 908214
  const googleId = `90${Math.floor(1000 + Math.random() * 9000)}`;

  let user = users[googleId];
  if (!user) {
    user = {
      id: googleId,
      email: googleEmail,
      name: googleName && /[a-zA-Z]/.test(googleName) ? googleName : googleEmail.split('@')[0],
      gender: 'male',
      dob: '1998-06-15',
      tob: '12:00',
      pob: 'Delhi, India',
      availableMinutes: 15, // Google Sign-In Welcome Bonus
      totalRechargedMinutes: 15,
      createdAt: new Date().toISOString()
    };
    users[googleId] = user;
    saveUsersDb(users);

    // Background server sync
    fetch('/api/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    }).catch(e => console.error('Error syncing google user to server:', e));

    addTransactionLog({
      id: `tx_google_${Date.now()}`,
      userId: googleId,
      userName: user.name,
      minutesAdded: 15,
      amountPaid: 0,
      type: 'ADMIN_GRANT',
      method: 'Google Account Sign-In Bonus',
      grantedBy: 'System Google Auth',
      note: `Google Sign-In (${googleEmail}) Welcome Bonus`,
      timestamp: new Date().toISOString()
    });
  }

  setActiveUserId(googleId);
  return user;
}

// Deduct 1 minute during active consultation or reading
export function deductConsultationMinute(): { hasMinutes: boolean; remainingMinutes: number } {
  const users = getUsersDb();
  const activeId = getActiveUserId();
  const user = users[activeId];

  if (!user || user.availableMinutes <= 0) {
    return { hasMinutes: false, remainingMinutes: 0 };
  }

  user.availableMinutes = Math.max(0, user.availableMinutes - 1);
  users[activeId] = user;
  saveUsersDb(users);

  // Sync deduction with server in background
  fetch('/api/users/deduct-minute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: activeId })
  }).catch(err => console.error('Error syncing minute deduction to server:', err));

  return { hasMinutes: user.availableMinutes > 0, remainingMinutes: user.availableMinutes };
}

// Delete user account function (for Admin Panel)
export function deleteUserAccount(targetUserId: string): { success: boolean; message: string } {
  const users = getUsersDb();
  const cleanId = targetUserId.trim().toUpperCase();

  if (!users[cleanId]) {
    return { success: false, message: `User ID '${cleanId}' not found.` };
  }

  const deletedUserName = users[cleanId].name;
  delete users[cleanId];
  saveUsersDb(users);

  // Background server sync
  fetch(`/api/users/${encodeURIComponent(cleanId)}`, {
    method: 'DELETE'
  }).catch(e => console.error('Error deleting user on server:', e));

  // If deleted user was active, switch active ID to another existing user
  const remainingIds = Object.keys(users);
  if (getActiveUserId() === cleanId) {
    if (remainingIds.length > 0) {
      setActiveUserId(remainingIds[0]);
    } else {
      // create a default fallback user
      const fallback = createNewUser('USER-DEFAULT', 'Guest Astro User');
      setActiveUserId(fallback.id);
    }
  }

  addTransactionLog({
    id: `tx_del_${Date.now()}`,
    userId: cleanId,
    userName: deletedUserName,
    minutesAdded: 0,
    amountPaid: 0,
    type: 'ADMIN_GRANT',
    method: 'Account Deletion',
    grantedBy: 'Admin Control Panel',
    note: `User Account ${cleanId} permanently deleted by Admin.`,
    timestamp: new Date().toISOString()
  });

  return {
    success: true,
    message: `User account '${deletedUserName}' (${cleanId}) successfully deleted.`
  };
}

// Directly set user minutes balance
export function updateUserMinutesDirectly(
  targetUserId: string,
  newMinutesBalance: number
): { success: boolean; message: string; user?: UserProfile } {
  const users = getUsersDb();
  const cleanId = targetUserId.trim().toUpperCase();

  if (!users[cleanId]) {
    return { success: false, message: `User ID '${cleanId}' not found.` };
  }

  const targetUser = users[cleanId];
  const oldVal = targetUser.availableMinutes;
  targetUser.availableMinutes = Math.max(0, newMinutesBalance);
  users[cleanId] = targetUser;
  saveUsersDb(users);

  addTransactionLog({
    id: `tx_set_${Date.now()}`,
    userId: cleanId,
    userName: targetUser.name,
    minutesAdded: targetUser.availableMinutes - oldVal,
    amountPaid: 0,
    type: 'ADMIN_GRANT',
    method: 'Direct Balance Override',
    grantedBy: 'Admin Control Panel',
    note: `Balance updated directly from ${oldVal}m to ${targetUser.availableMinutes}m.`,
    timestamp: new Date().toISOString()
  });

  return {
    success: true,
    message: `Set User ID ${cleanId} balance to ${targetUser.availableMinutes} mins.`,
    user: targetUser
  };
}

export function getTransactionLogs(): RechargeTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_LOGS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(DEFAULT_LOGS));
      return DEFAULT_LOGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_LOGS;
  }
}

function addTransactionLog(log: RechargeTransaction) {
  const logs = getTransactionLogs();
  logs.unshift(log);
  try {
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    console.error('Error saving tx logs:', e);
  }
}

const DEFAULT_ACTIVITY_LOGS: UserActivityLog[] = [
  {
    id: 'act_1',
    userId: '880101',
    userName: 'Rahul Sharma',
    action: 'Asked AI Astrologer',
    details: 'Meri ex mere paas wapas aayegi ya nahi? Closure ki astrological prediction batayein.',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'act_2',
    userId: '904212',
    userName: 'Priya Patel',
    action: 'Asked AI Astrologer',
    details: 'Mere 10th House aur Sun/Saturn placements ke hisab se konsi career field best rahegi?',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'act_3',
    userId: '880101',
    userName: 'Rahul Sharma',
    action: 'Generated Kundali PDF',
    details: 'Viewed Dasha & Planet Chart for Rahul Sharma (1996-08-15)',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

export function getUserActivityLogs(): UserActivityLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVITY_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_ACTIVITY_KEY, JSON.stringify(DEFAULT_ACTIVITY_LOGS));
      return DEFAULT_ACTIVITY_LOGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_ACTIVITY_LOGS;
  }
}

export function addUserActivityLog(userId: string, userName: string, action: string, details: string) {
  if (!userId || !details) return;
  const logs = getUserActivityLogs();
  const newLog: UserActivityLog = {
    id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    userId: userId.trim().toUpperCase(),
    userName: userName.trim(),
    action: action,
    details: details.trim(),
    timestamp: new Date().toISOString()
  };
  logs.unshift(newLog);
  try {
    localStorage.setItem(STORAGE_ACTIVITY_KEY, JSON.stringify(logs.slice(0, 300)));
  } catch (e) {
    console.error('Error saving activity log:', e);
  }
}

export function clearUserActivityLogs() {
  try {
    localStorage.setItem(STORAGE_ACTIVITY_KEY, JSON.stringify([]));
  } catch (e) {
    console.error('Error clearing activity logs:', e);
  }
}

