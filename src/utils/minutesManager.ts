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
    const firstId = Object.keys(getUsersDb())[0] || '880101';
    localStorage.setItem(STORAGE_CURRENT_ID_KEY, firstId);
    return firstId;
  } catch (e) {
    return '880101';
  }
}

export function setActiveUserId(userId: string) {
  try {
    localStorage.setItem(STORAGE_CURRENT_ID_KEY, userId);
  } catch (e) {
    console.error('Error setting active user ID:', e);
  }
}

export function getActiveUserProfile(): UserProfile {
  const users = getUsersDb();
  const id = getActiveUserId();
  if (users[id]) return users[id];

  const firstId = Object.keys(users)[0];
  if (firstId) {
    setActiveUserId(firstId);
    return users[firstId];
  }

  // If no user exists, create default
  const newProfile: UserProfile = {
    id: '880101',
    name: 'Astro Seeker',
    pin: '1234',
    gender: 'male',
    dob: '1998-05-15',
    tob: '12:00',
    pob: 'Mumbai, India',
    availableMinutes: 15,
    totalRechargedMinutes: 15,
    createdAt: new Date().toISOString()
  };
  users['880101'] = newProfile;
  saveUsersDb(users);
  setActiveUserId('880101');
  return newProfile;
}

// Live lookup of existing user by User ID
export function fetchUserById(userId: string): UserProfile | null {
  if (!userId) return null;
  const users = getUsersDb();
  const clean = userId.trim().toUpperCase();
  return users[clean] || null;
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
  return { success: true, message: `PIN updated successfully for ${users[cleanId].name} (${cleanId})!` };
}

export function updateUserProfile(updated: Partial<UserProfile>) {
  const users = getUsersDb();
  const activeId = getActiveUserId();
  if (users[activeId]) {
    users[activeId] = { ...users[activeId], ...updated };
    saveUsersDb(users);
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

// Verify User Password / PIN for Account Switch / Login
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
  return profile;
}

// In-App Self / Profile Purchase of Minutes with Payment Method and Coupon Discount
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

// Admin / Astrologer ID Recharge function
// STRICT CHECK: Reject if User ID does NOT exist!
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

// Google Sign-In Integration helper
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

