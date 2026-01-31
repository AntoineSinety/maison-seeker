import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

const googleProvider = new GoogleAuthProvider()

export async function signInWithGoogle() {
  const { user } = await signInWithPopup(auth, googleProvider)

  // Check if user profile exists, create if not
  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Utilisateur',
      photoURL: user.photoURL || null,
      householdId: null,
      createdAt: Timestamp.now(),
    })
  }

  return user
}

export async function signOut() {
  return firebaseSignOut(auth)
}
