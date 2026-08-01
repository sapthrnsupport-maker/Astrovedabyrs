import { UserProfile, RechargePlan, RechargeTransaction } from '../types';

const STORAGE_USERS_KEY = 'astroveda_users_v1';
const STORAGE_CURRENT_ID_KEY = 'astroveda_active_userid_v1';
const STORAGE_LOGS_KEY = 'astroveda_tx_logs_v1';

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
  'USER-9821': {
    id: 'USER-9821',
    name: 'Rahul Sharma',
    gender: 'male',
    dob: '1996-08-15',
    tob: '10:30',
    pob: 'New Delhi, India',
    availableMinutes: 15,
    totalRechargedMinutes: 15,
    createdAt: new Date().toISOString()
  },
  'USER-4412': {
    id: 'USER-4412',
    name: 'Priya Patel',
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
    userId: 'USER-9821',
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
    userId: 'USER-4412',
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
    if (id) return id;
    const firstId = Object.keys(getUsersDb())[0] || 'USER-9821';
    localStorage.setItem(STORAGE_CURRENT_ID_KEY, firstId);
    return firstId;
  } catch (e) {
    return 'USER-9821';
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

  // If active ID doesn't exist, create it
  const newProfile: UserProfile = {
    id,
    name: 'Astro Seeker',
    gender: 'male',
    dob: '1998-05-15',
    tob: '12:00',
    pob: 'Mumbai, India',
    availableMinutes: 10,
    totalRechargedMinutes: 10,
    createdAt: new Date().toISOString()
  };
  users[id] = newProfile;
  saveUsersDb(users);
  return newProfile;
}

export function updateUserProfile(updated: Partial<UserProfile>) {
  const users = getUsersDb();
  const activeId = getActiveUserId();
  if (users[activeId]) {
    users[activeId] = { ...users[activeId], ...updated };
    saveUsersDb(users);
  }
}

export function createNewUser(id: string, name: string, initialMinutes = 10): UserProfile {
  const users = getUsersDb();
  const formattedId = id.trim().toUpperCase() || `USER-${Math.floor(1000 + Math.random() * 9000)}`;

  const profile: UserProfile = {
    id: formattedId,
    name: name.trim() || 'Astro User',
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
): { success: boolean; newBalance: number; targetUser: UserProfile } {
  const users = getUsersDb();
  const cleanId = targetProfileId.trim().toUpperCase() || getActiveUserId();
  let targetUser = users[cleanId];

  if (!targetUser) {
    targetUser = {
      id: cleanId,
      name: `User ${cleanId}`,
      gender: 'male',
      dob: '1998-01-01',
      tob: '12:00',
      pob: 'India',
      availableMinutes: 0,
      totalRechargedMinutes: 0,
      createdAt: new Date().toISOString()
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
export function purchaseMinutesSelf(plan: RechargePlan): { success: boolean; newBalance: number } {
  const activeId = getActiveUserId();
  const res = purchaseMinutesForProfile(activeId, plan, 'In-App Payment (UPI / Cards)');
  return { success: res.success, newBalance: res.newBalance };
}

// Admin / Astrologer ID Recharge function ("mai kisi ki id dalunga or jitne minutes dunga utna usko allow ho jaega")
export function adminRechargeUser(
  targetUserId: string,
  minutesToAdd: number,
  grantedBy: string = 'Astrologer Admin',
  note: string = 'Admin Manual Grant'
): { success: boolean; message: string; user?: UserProfile } {
  const users = getUsersDb();
  const cleanId = targetUserId.trim().toUpperCase();

  let targetUser = users[cleanId];

  // If user ID doesn't exist yet, automatically create profile with this ID!
  if (!targetUser) {
    targetUser = {
      id: cleanId,
      name: `User ${cleanId}`,
      gender: 'male',
      dob: '1998-01-01',
      tob: '12:00',
      pob: 'India',
      availableMinutes: 0,
      totalRechargedMinutes: 0,
      createdAt: new Date().toISOString()
    };
  }

  targetUser.availableMinutes += minutesToAdd;
  targetUser.totalRechargedMinutes += minutesToAdd;
  users[cleanId] = targetUser;
  saveUsersDb(users);

  // Record transaction
  addTransactionLog({
    id: `tx_admin_${Date.now()}`,
    userId: cleanId,
    userName: targetUser.name,
    minutesAdded: minutesToAdd,
    amountPaid: 0,
    type: 'ADMIN_GRANT',
    method: 'Admin Panel Allocation',
    grantedBy: grantedBy,
    note: note,
    timestamp: new Date().toISOString()
  });

  return {
    success: true,
    message: `Successfully granted ${minutesToAdd} consultation minutes to User ID: ${cleanId}. New Balance: ${targetUser.availableMinutes} mins.`,
    user: targetUser
  };
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
