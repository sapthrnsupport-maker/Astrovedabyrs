import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  ShieldCheck,
  Zap,
  Sparkles,
  CreditCard,
  Lock,
  Clock,
  Gift,
  User,
  QrCode,
  Check,
  Tag,
  ArrowRight,
  Printer,
  Copy,
  Building,
  Wallet,
  Smartphone,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { UserProfile, RechargePlan } from '../types';
import {
  RECHARGE_PLANS,
  purchaseMinutesForProfile,
  adminRechargeUser,
  getTransactionLogs,
  getUsersDb,
  createNewUser
} from '../utils/minutesManager';

interface MinutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onRefreshProfile: () => void;
  initialMode?: 'USER_BUY' | 'ADMIN_GRANT';
}

type PaymentMethodType = 'upi' | 'card' | 'netbanking' | 'wallet';

interface AppliedCoupon {
  code: string;
  discountPercentage: number;
  fixedDiscountINR: number;
}

export const MinutesModal: React.FC<MinutesModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onRefreshProfile,
  initialMode = 'USER_BUY'
}) => {
  const [activeTab, setActiveTab] = useState<'USER_BUY' | 'ADMIN_GRANT'>(initialMode);

  // Target Profile Selection
  const [targetProfileType, setTargetProfileType] = useState<'SELF' | 'SAVED' | 'NEW'>('SELF');
  const [selectedSavedId, setSelectedSavedId] = useState<string>(userProfile.id);
  const [newProfileIdInput, setNewProfileIdInput] = useState<string>('');
  const [newProfileNameInput, setNewProfileNameInput] = useState<string>('');

  // Selected Extended Access Plan
  const [selectedPlan, setSelectedPlan] = useState<RechargePlan>(RECHARGE_PLANS[1]);

  // Payment Method Selection
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('upi');
  const [upiIdInput, setUpiIdInput] = useState('user@gpay');
  const [cardNumberInput, setCardNumberInput] = useState('4532 •••• •••• 8812');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Coupons
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState('');

  // Checkout Stages: 'FORM' -> 'PROCESSING' -> 'RECEIPT'
  const [checkoutStage, setCheckoutStage] = useState<'FORM' | 'PROCESSING' | 'RECEIPT'>('FORM');
  const [processingStepText, setProcessingStepText] = useState('Initiating secure gateway...');

  // Receipt Details
  const [completedTxn, setCompletedTxn] = useState<{
    txnId: string;
    profileId: string;
    profileName: string;
    minutesAdded: number;
    newBalance: number;
    amountPaid: number;
    method: string;
    timestamp: string;
  } | null>(null);

  // Admin Grant State
  const [adminTargetUserId, setAdminTargetUserId] = useState(userProfile.id);
  const [grantMinutes, setGrantMinutes] = useState(30);
  const [modalActionType, setModalActionType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [grantedByInput, setGrantedByInput] = useState('Astrologer Guruji');
  const [grantNoteInput, setGrantNoteInput] = useState('Vedic Consultation Extended Access');
  const [adminSuccessMsg, setAdminSuccessMsg] = useState('');

  // Passcode Security for Admin Grant Tab
  const [modalAdminPasscode, setModalAdminPasscode] = useState('');
  const [isModalAdminAuth, setIsModalAdminAuth] = useState(false);
  const [modalAuthError, setModalAuthError] = useState('');

  const handleVerifyModalPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    const validCodes = ['9905122139', '8800', '7860', '1008'];
    if (validCodes.includes(modalAdminPasscode.trim())) {
      setIsModalAdminAuth(true);
      setModalAuthError('');
    } else {
      setModalAuthError('Incorrect Passcode! Access denied. Please enter a valid Admin Passcode.');
    }
  };

  if (!isOpen) return null;

  const usersDb = getUsersDb();
  const allSavedProfiles = Object.values(usersDb);

  // Resolve Target Profile Details
  let resolvedTargetId = userProfile.id;
  let resolvedTargetName = userProfile.name;
  let resolvedCurrentBalance = userProfile.availableMinutes;

  if (targetProfileType === 'SAVED') {
    const saved = usersDb[selectedSavedId] || userProfile;
    resolvedTargetId = saved.id;
    resolvedTargetName = saved.name;
    resolvedCurrentBalance = saved.availableMinutes;
  } else if (targetProfileType === 'NEW') {
    resolvedTargetId = newProfileIdInput.trim().toUpperCase() || 'NEW-PROFILE';
    resolvedTargetName = newProfileNameInput.trim() || 'New Astro Client';
    resolvedCurrentBalance = usersDb[resolvedTargetId]?.availableMinutes || 0;
  }

  // Calculate Discounts & Final Price
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountPercentage > 0) {
      discountAmount = Math.round((selectedPlan.priceINR * appliedCoupon.discountPercentage) / 100);
    } else if (appliedCoupon.fixedDiscountINR > 0) {
      discountAmount = appliedCoupon.fixedDiscountINR;
    }
  }
  const finalPayablePrice = Math.max(0, selectedPlan.priceINR - discountAmount);

  // Apply Coupon Code
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponInput.trim().toUpperCase();

    if (!code) return;

    if (code === 'ASTRO50') {
      setAppliedCoupon({ code: 'ASTRO50', discountPercentage: 50, fixedDiscountINR: 0 });
    } else if (code === 'GURU20' || code === 'VEDA20') {
      setAppliedCoupon({ code: 'GURU20', discountPercentage: 0, fixedDiscountINR: 20 });
    } else if (code === 'FREEPASS') {
      setAppliedCoupon({ code: 'FREEPASS', discountPercentage: 100, fixedDiscountINR: 0 });
    } else {
      setCouponError('Invalid promo code. Try ASTRO50 for 50% discount or GURU20 for ₹20 off.');
    }
  };

  // Submit Mock Checkout
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let createdId = resolvedTargetId;

    // If new profile type, ensure created in DB with valid name check
    if (targetProfileType === 'NEW') {
      try {
        const nu = createNewUser(newProfileIdInput.trim(), newProfileNameInput.trim() || 'New Client', 0);
        createdId = nu.id;
      } catch (err: any) {
        alert(err.message || 'Invalid User Name. Please enter a valid name.');
        return;
      }
    }

    setCheckoutStage('PROCESSING');
    setProcessingStepText('Connecting to Bank Secure Gateway...');

    setTimeout(() => {
      setProcessingStepText(`Verifying entitlement for ${createdId}...`);
      setTimeout(() => {
        setProcessingStepText(`Crediting ${selectedPlan.minutes} Mins access time...`);
        setTimeout(() => {
          let methodLabel = 'UPI / GPay';
          if (paymentMethod === 'card') methodLabel = 'Debit/Credit Card';
          if (paymentMethod === 'netbanking') methodLabel = `Net Banking (${selectedBank})`;
          if (paymentMethod === 'wallet') methodLabel = 'Paytm Wallet';

          const res = purchaseMinutesForProfile(
            createdId,
            selectedPlan,
            methodLabel,
            discountAmount
          );

          if (!res.success || !res.targetUser) {
            alert(res.message || 'Payment processing failed. User ID not found.');
            setCheckoutStage('FORM');
            return;
          }

          const txnId = `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;
          setCompletedTxn({
            txnId,
            profileId: res.targetUser.id,
            profileName: res.targetUser.name,
            minutesAdded: selectedPlan.minutes,
            newBalance: res.newBalance,
            amountPaid: finalPayablePrice,
            method: methodLabel,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });

          onRefreshProfile();
          setCheckoutStage('RECEIPT');
        }, 600);
      }, 600);
    }, 600);
  };

  // Handle Admin Direct Grant
  const handleAdminGrantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSuccessMsg('');

    if (!adminTargetUserId.trim() || grantMinutes <= 0) return;

    const res = adminRechargeUser(
      adminTargetUserId,
      grantMinutes,
      grantedByInput,
      grantNoteInput || (modalActionType === 'ADD' ? 'Admin Minutes Grant' : 'Admin Minutes Deduction'),
      modalActionType
    );
    if (res.success) {
      setAdminSuccessMsg(`✅ ${res.message}`);
      onRefreshProfile();
    } else {
      setAdminSuccessMsg(`${res.message}`);
    }
  };

  const txLogs = getTransactionLogs().slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-md shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-300">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-serif">Checkout & Extended Access Portal</h3>
              <p className="text-xs text-gray-300">Purchase extended consultation time for any profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 bg-black/20 p-2 gap-2">
          <button
            onClick={() => {
              setActiveTab('USER_BUY');
              setCheckoutStage('FORM');
            }}
            className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'USER_BUY'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Profile Checkout (Extend Access)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('ADMIN_GRANT');
            }}
            className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'ADMIN_GRANT'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-300" />
            <span>Astrologer Admin Direct Allocation</span>
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-thin">
          {activeTab === 'USER_BUY' && (
            <>
              {/* STAGE 1: CHECKOUT FORM */}
              {checkoutStage === 'FORM' && (
                <div className="space-y-6">
                  {/* STEP 1: Select Target Profile to Extend */}
                  <div className="space-y-3 bg-white/5 border border-white/10 rounded-3xl p-4">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <User className="w-4 h-4 text-indigo-400" />
                      <span>1. Select Profile to Extend Access</span>
                    </label>

                    {/* Active Account Banner for User Buy */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-mono tracking-wider">
                          Recharging Active Account (Your ID)
                        </span>
                        <span className="font-bold text-white text-sm">{userProfile.name}</span>
                        <span className="text-indigo-300 font-mono ml-2">({userProfile.id})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400 block text-[10px]">Balance Projection</span>
                        <span className="font-bold text-emerald-400 text-xs">
                          {userProfile.availableMinutes} Mins <ArrowRight className="inline w-3 h-3 text-gray-500 mx-0.5" />{' '}
                          <span className="text-indigo-300 font-extrabold text-sm">
                            {userProfile.availableMinutes + selectedPlan.minutes} Mins
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* STEP 2: Choose Extended Access Time Package */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-white flex items-center justify-between uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        <span>2. Choose Extended Access Package</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 lowercase font-mono">Instant Activation</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {RECHARGE_PLANS.map((plan) => {
                        const isSelected = selectedPlan.id === plan.id;
                        return (
                          <div
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan)}
                            className={`relative p-4 rounded-3xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-indigo-400 shadow-xl shadow-indigo-600/10 scale-[1.02]'
                                : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}
                          >
                            {plan.badge && (
                              <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-[10px] font-bold text-white shadow-md">
                                {plan.badge}
                              </span>
                            )}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xl font-black font-serif text-white">
                                {plan.minutes} <span className="text-xs font-sans text-gray-400 font-normal">Mins Access</span>
                              </span>
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                                SAVE {plan.discountPercentage}%
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-bold text-indigo-300">₹{plan.priceINR}</span>
                              <span className="text-xs text-gray-500 line-through">₹{plan.originalPriceINR}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">
                              ~₹{(plan.priceINR / plan.minutes).toFixed(1)}/min • Full Kundali & AI Chat Unlocked
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* STEP 3: Promo / Coupon Code Section */}
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-4 space-y-3">
                    <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-indigo-400" />
                        <span>Promo Code / Coupon</span>
                      </span>
                      <span className="text-[10px] text-indigo-300">Try ASTRO50 or GURU20</span>
                    </label>

                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Enter Promo Code (e.g. ASTRO50)"
                        className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white uppercase font-mono focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-indigo-200 font-bold text-xs border border-white/10 transition-all cursor-pointer"
                      >
                        Apply
                      </button>
                    </form>

                    {couponError && <p className="text-[11px] text-rose-400">{couponError}</p>}

                    {appliedCoupon && (
                      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>
                            Coupon <strong>{appliedCoupon.code}</strong> Applied!
                          </span>
                        </div>
                        <span className="font-bold">-₹{discountAmount} OFF</span>
                      </div>
                    )}
                  </div>

                  {/* STEP 4: Payment Gateway & Method Selector */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <CreditCard className="w-4 h-4 text-indigo-400" />
                      <span>3. Select Payment Method</span>
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {[
                        { id: 'upi', label: 'UPI / GPay', icon: Smartphone },
                        { id: 'card', label: 'Debit/Credit', icon: CreditCard },
                        { id: 'netbanking', label: 'Net Banking', icon: Building },
                        { id: 'wallet', label: 'Wallets', icon: Wallet }
                      ].map((m) => {
                        const Icon = m.icon;
                        const isSel = paymentMethod === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setPaymentMethod(m.id as PaymentMethodType)}
                            className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                              isSel
                                ? 'bg-indigo-500/20 border-indigo-400 text-white font-bold shadow-md'
                                : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/15'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isSel ? 'text-indigo-400' : 'text-gray-500'}`} />
                            <span>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Payment Inputs per Method */}
                    <div className="p-3 bg-black/40 border border-white/10 rounded-2xl text-xs space-y-2">
                      {paymentMethod === 'upi' && (
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">
                            UPI ID (Google Pay / PhonePe / Paytm / BHIM)
                          </label>
                          <input
                            type="text"
                            value={upiIdInput}
                            onChange={(e) => setUpiIdInput(e.target.value)}
                            placeholder="username@upi or username@okaxis"
                            className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      )}

                      {paymentMethod === 'card' && (
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Mock Card Number</label>
                          <input
                            type="text"
                            value={cardNumberInput}
                            onChange={(e) => setCardNumberInput(e.target.value)}
                            className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      )}

                      {paymentMethod === 'netbanking' && (
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Select Bank</label>
                          <select
                            value={selectedBank}
                            onChange={(e) => setSelectedBank(e.target.value)}
                            className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                          >
                            <option value="HDFC Bank" className="bg-slate-900 text-white">HDFC Bank</option>
                            <option value="State Bank of India" className="bg-slate-900 text-white">State Bank of India (SBI)</option>
                            <option value="ICICI Bank" className="bg-slate-900 text-white">ICICI Bank</option>
                            <option value="Axis Bank" className="bg-slate-900 text-white">Axis Bank</option>
                            <option value="Kotak Mahindra" className="bg-slate-900 text-white">Kotak Mahindra</option>
                          </select>
                        </div>
                      )}

                      {paymentMethod === 'wallet' && (
                        <div className="text-[11px] text-indigo-300">
                          Paytm Wallet / Amazon Pay linked balance auto-deduct simulation enabled.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Summary & Final Checkout Button */}
                  <div className="bg-black/40 border border-white/10 rounded-3xl p-5 space-y-4">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-gray-400">
                        <span>Package: {selectedPlan.minutes} Mins Access Pass</span>
                        <span>₹{selectedPlan.originalPriceINR}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400">
                        <span>Package Instant Discount ({selectedPlan.discountPercentage}%)</span>
                        <span>-₹{selectedPlan.originalPriceINR - selectedPlan.priceINR}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-400 font-bold">
                          <span>Coupon Discount ({appliedCoupon?.code})</span>
                          <span>-₹{discountAmount}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
                        <span className="font-bold text-sm text-white">Total Payable Amount</span>
                        <span className="text-2xl font-black font-serif text-indigo-300">₹{finalPayablePrice}</span>
                      </div>
                    </div>

                    <form onSubmit={handleCheckoutSubmit}>
                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm shadow-xl shadow-indigo-600/30 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Lock className="w-4 h-4" />
                        <span>
                          Complete Mock Payment ₹{finalPayablePrice} & Add {selectedPlan.minutes} Mins
                        </span>
                      </button>
                    </form>

                    <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500">
                      <span>✓ 256-Bit SSL Encrypted</span>
                      <span>•</span>
                      <span>✓ Instant Entitlement Credited</span>
                      <span>•</span>
                      <span>✓ Guaranteed Privacy</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 2: PROCESSING SIMULATION */}
              {checkoutStage === 'PROCESSING' && (
                <div className="py-16 text-center space-y-6">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-indigo-300 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold font-serif text-white">Processing Your Checkout</h3>
                    <p className="text-xs text-indigo-300 font-mono animate-pulse">{processingStepText}</p>
                  </div>

                  <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                    Simulating payment confirmation with Razorpay / Gateway. Please do not close this modal.
                  </p>
                </div>
              )}

              {/* STAGE 3: RECEIPT CONFIRMATION */}
              {checkoutStage === 'RECEIPT' && completedTxn && (
                <div className="space-y-6">
                  <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-3xl p-6 text-center space-y-3 shadow-xl">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto">
                      <CheckCircle className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold font-serif text-emerald-100">
                      Payment Successful & Access Granted!
                    </h3>
                    <p className="text-xs text-emerald-200">
                      {completedTxn.minutesAdded} Extended Consultation Minutes have been added to profile{' '}
                      <strong className="text-white">{completedTxn.profileName}</strong> ({completedTxn.profileId}).
                    </p>
                  </div>

                  {/* Receipt Details Card */}
                  <div className="bg-black/40 border border-white/10 rounded-3xl p-5 space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="font-serif font-bold text-indigo-300 text-sm">Official Receipt</span>
                      <span className="font-mono text-gray-400 text-[10px]">{completedTxn.txnId}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-gray-300">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Entitlement Account</span>
                        <span className="font-bold text-white">{completedTxn.profileName}</span>
                        <div className="font-mono text-[10px] text-gray-400">{completedTxn.profileId}</div>
                      </div>

                      <div>
                        <span className="text-gray-400 block text-[10px]">Access Minutes Added</span>
                        <span className="font-bold text-emerald-400 text-sm">+{completedTxn.minutesAdded} Mins</span>
                      </div>

                      <div>
                        <span className="text-gray-400 block text-[10px]">Total New Balance</span>
                        <span className="font-bold text-indigo-300">{completedTxn.newBalance} Minutes</span>
                      </div>

                      <div>
                        <span className="text-gray-400 block text-[10px]">Payment Method</span>
                        <span className="font-medium text-gray-200">{completedTxn.method}</span>
                      </div>

                      <div>
                        <span className="text-gray-400 block text-[10px]">Amount Paid</span>
                        <span className="font-bold text-white text-sm">₹{completedTxn.amountPaid}</span>
                      </div>

                      <div>
                        <span className="text-gray-400 block text-[10px]">Transaction Time</span>
                        <span className="text-gray-300">{completedTxn.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        onClose();
                        setCheckoutStage('FORM');
                      }}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs hover:brightness-110 transition-all cursor-pointer"
                    >
                      Return to App & Start Reading
                    </button>
                    <button
                      onClick={() => {
                        alert(`Receipt ${completedTxn.txnId} copied to clipboard!`);
                      }}
                      className="px-4 py-3 rounded-xl bg-white/10 text-gray-300 font-bold text-xs hover:bg-white/15 flex items-center gap-1.5 border border-white/10 cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: ASTROLOGER ADMIN DIRECT ALLOCATION */}
          {activeTab === 'ADMIN_GRANT' && (
            <div className="space-y-5">
              {!isModalAdminAuth ? (
                <div className="p-6 bg-black/40 border border-purple-500/30 rounded-3xl space-y-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white font-serif text-base">Protected Admin Access</h4>
                    <p className="text-xs text-gray-300 mt-1">
                      Enter secret Admin Security Passcode to authorize direct consultation time allocation.
                    </p>
                  </div>

                  <form onSubmit={handleVerifyModalPasscode} className="space-y-3 max-w-sm mx-auto">
                    <input
                      type="password"
                      value={modalAdminPasscode}
                      onChange={(e) => {
                        setModalAdminPasscode(e.target.value);
                        if (modalAuthError) setModalAuthError('');
                      }}
                      placeholder="Enter Admin Passcode"
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white text-center font-mono tracking-widest focus:outline-none focus:border-purple-500"
                      required
                    />

                    {modalAuthError && (
                      <p className="text-[11px] text-rose-400 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                        {modalAuthError}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs hover:brightness-110 cursor-pointer shadow-lg shadow-purple-600/30"
                    >
                      Unlock Admin Grant Panel
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  <div className="bg-purple-500/20 border border-purple-500/30 rounded-2xl p-4 text-xs text-purple-200 space-y-1">
                    <div className="font-bold text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-300" />
                        <span>Astrologer Admin Access Control</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        Authorized Admin Session
                      </span>
                    </div>
                    <p className="text-purple-200/80">
                      Enter any User ID below and specify the consultation minutes to grant. The target account will instantly receive the allocated minutes.
                    </p>
                  </div>

              {adminSuccessMsg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-xs text-emerald-200 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>{adminSuccessMsg}</div>
                </div>
              )}

              <form onSubmit={handleAdminGrantSubmit} className="space-y-4">
                {/* Action Mode Toggle */}
                <div>
                  <label className="text-xs font-semibold text-gray-300 mb-1 block">Select Admin Action</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setModalActionType('ADD')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        modalActionType === 'ADD'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md'
                          : 'bg-black/30 text-gray-400 border-white/10'
                      }`}
                    >
                      + Add Minutes (Credit)
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalActionType('DEDUCT')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        modalActionType === 'DEDUCT'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-md'
                          : 'bg-black/30 text-gray-400 border-white/10'
                      }`}
                    >
                      - Remove Minutes (Debit)
                    </button>
                  </div>
                </div>

                {/* Target User ID Input */}
                <div>
                  <label className="text-xs font-semibold text-gray-300 mb-1 flex items-center justify-between">
                    <span>Target User ID</span>
                    <span className="text-[10px] text-purple-300 font-normal">e.g. USER-9821</span>
                  </label>
                  <input
                    type="text"
                    value={adminTargetUserId}
                    onChange={(e) => setAdminTargetUserId(e.target.value)}
                    placeholder="Enter Target User ID (e.g. USER-9821)"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                {/* Minutes Preset Selector */}
                <div>
                  <label className="text-xs font-semibold text-gray-300 mb-1 block">
                    Minutes to {modalActionType === 'ADD' ? 'Add (+)' : 'Remove (-)'}
                  </label>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {[5, 15, 30, 60, 120].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setGrantMinutes(m)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          grantMinutes === m
                            ? modalActionType === 'ADD'
                              ? 'bg-emerald-600 text-white border-emerald-400'
                              : 'bg-rose-600 text-white border-rose-400'
                            : 'bg-black/30 border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        {modalActionType === 'ADD' ? `+${m}m` : `-${m}m`}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={grantMinutes}
                      onChange={(e) => setGrantMinutes(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-xs text-gray-400 whitespace-nowrap">Minutes</span>
                  </div>
                </div>

                {/* Granted By & Note */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Authorized By</label>
                    <input
                      type="text"
                      value={grantedByInput}
                      onChange={(e) => setGrantedByInput(e.target.value)}
                      className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Note / Reason</label>
                    <input
                      type="text"
                      value={grantNoteInput}
                      onChange={(e) => setGrantNoteInput(e.target.value)}
                      className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Submit Grant Button */}
                <button
                  type="submit"
                  className={`w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 ${
                    modalActionType === 'ADD'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/30'
                      : 'bg-gradient-to-r from-rose-600 to-pink-600 shadow-rose-600/30'
                  }`}
                >
                  <Gift className="w-4 h-4" />
                  <span>
                    {modalActionType === 'ADD' ? `Add +${grantMinutes}` : `Remove -${grantMinutes}`} Minutes to User ID ({adminTargetUserId || 'Target'})
                  </span>
                </button>
              </form>

              {/* Recent Grant History Logs */}
              <div className="pt-3 border-t border-white/10">
                <h4 className="text-xs font-semibold text-gray-400 mb-2">Recent Recharge Activity</h4>
                <div className="space-y-1.5">
                  {txLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between px-3 py-1.5 rounded-2xl bg-black/30 border border-white/5 text-[11px]"
                    >
                      <div>
                        <span className="font-mono text-purple-300 font-bold">{log.userId}</span>
                        <span className="text-gray-400 ml-2">({log.userName})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400">+{log.minutesAdded} Mins</span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
        </div>
      </div>
    </div>
  );
};
