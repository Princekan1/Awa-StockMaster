import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import type { Role } from '../types';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  role: Role;
  shopId: string;
}

const USERS_COLLECTION = 'users';
const INVITES_COLLECTION = 'staffInvites';

function inviteKey(email: string) {
  return email.trim().toLowerCase();
}

async function getInvite(email: string) {
  const raw = email.trim();
  const normalized = inviteKey(raw);
  const primary = await getDoc(doc(db, INVITES_COLLECTION, normalized));
  if (primary.exists()) return primary;
  if (raw !== normalized) {
    const exact = await getDoc(doc(db, INVITES_COLLECTION, raw));
    if (exact.exists()) return exact;
  }
  return primary;
}

async function ensureShop(shopId: string, ownerUid: string, displayName: string) {
  const shopRef = doc(db, 'shops', shopId);
  const snap = await getDoc(shopRef);
  if (!snap.exists()) {
    await setDoc(shopRef, {
      ownerUid,
      name: `${displayName || 'My'} Shop`,
      createdAt: serverTimestamp(),
    });
  }
  const settingsRef = doc(db, 'shops', shopId, 'settings', 'main');
  const settingsSnap = await getDoc(settingsRef);
  if (!settingsSnap.exists()) {
    await setDoc(settingsRef, {
      shopName: `${displayName || 'My'} Shop`,
      currency: 'NGN',
      defaultMinimumStock: 5,
      expiryWarningDays: 30,
      ownerUid,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const ref = doc(db, USERS_COLLECTION, user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data() as { role?: Role; displayName?: string; shopId?: string; email?: string };
    if (data.shopId) {
      const role: Role = data.role === 'owner' ? 'owner' : 'staff';

      if (role === 'staff') {
        const existingEmail = (user.email || data.email || '').trim().toLowerCase();
        const inviteSnap = existingEmail ? await getInvite(existingEmail) : null;
        if (!inviteSnap?.exists() || inviteSnap.data().status !== 'active' || inviteSnap.data().shopId !== data.shopId) {
          throw new Error('Your staff access is inactive. Ask the shop owner to enable your account.');
        }
      }

      return {
        uid: user.uid,
        email: user.email,
        displayName: data.displayName || user.displayName || user.email || 'User',
        role,
        shopId: data.shopId,
      };
    }
  }

  const email = user.email?.trim().toLowerCase() || '';
  if (email) {
    const inviteSnap = await getInvite(email);
    if (inviteSnap.exists()) {
      const invite = inviteSnap.data() as { shopId: string; name?: string; status?: string };
      if (invite.status !== 'inactive') {
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: invite.name || user.displayName || user.email || 'Staff',
          role: 'staff',
          shopId: invite.shopId,
        };
        await setDoc(ref, { ...profile, createdAt: serverTimestamp() }, { merge: true });
        return profile;
      }
    }
  }

  const shopId = `shop_${user.uid}`;
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email || 'Owner',
    role: 'owner',
    shopId,
  };

  // Create the owner profile first. Firestore security rules use the profile
  // to authorize the initial shop/settings writes.
  await setDoc(ref, { ...profile, createdAt: serverTimestamp() }, { merge: true });
  await ensureShop(shopId, user.uid, profile.displayName);
  return profile;
}

export async function signInEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function signUpEmail(email: string, password: string, displayName: string) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName.trim()) await updateProfile(cred.user, { displayName: displayName.trim() });
  return cred.user;
}

export async function sendPasswordReset(email: string) {
  const normalized = email.trim();
  if (!normalized) throw new Error('Please enter your email address first.');
  await sendPasswordResetEmail(auth, normalized);
}

export async function signInGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function signOutUser() {
  await signOut(auth);
}

export function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-email': return 'That email address looks invalid.';
    case 'auth/user-disabled': return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Incorrect email or password.';
    case 'auth/email-already-in-use': return 'An account with that email already exists.';
    case 'auth/weak-password': return 'Password should be at least 6 characters.';
    case 'auth/popup-closed-by-user': return 'Google sign-in was closed before completing.';
    case 'auth/network-request-failed': return 'Network error. Check your connection and try again.';
    case 'auth/too-many-requests': return 'Too many attempts. Please wait a little and try again.';
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key': return 'Firebase is not configured yet — add your project keys to .env.';
    default: return code ? `Sign-in failed (${code}).` : 'Sign-in failed. Please try again.';
  }
}
