import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  arrayUnion,
} from 'firebase/firestore'
import { db } from './firebase'

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function createHousehold(userId, name) {
  const ref = doc(collection(db, 'households'))
  const inviteCode = generateInviteCode()

  await setDoc(ref, {
    name,
    memberIds: [userId],
    inviteCode,
    createdBy: userId,
    createdAt: Timestamp.now(),
  })

  await setDoc(doc(db, 'users', userId), { householdId: ref.id }, { merge: true })

  return { id: ref.id, inviteCode }
}

export async function joinHousehold(userId, inviteCode) {
  const q = query(
    collection(db, 'households'),
    where('inviteCode', '==', inviteCode.toUpperCase().trim())
  )
  const snap = await getDocs(q)

  if (snap.empty) {
    throw new Error('Code invite invalide')
  }

  const householdDoc = snap.docs[0]
  const data = householdDoc.data()

  if (data.memberIds.length >= 2) {
    throw new Error('Ce foyer a deja 2 membres')
  }

  if (data.memberIds.includes(userId)) {
    throw new Error('Vous etes deja membre de ce foyer')
  }

  await setDoc(doc(db, 'households', householdDoc.id), {
    memberIds: arrayUnion(userId),
  }, { merge: true })

  await setDoc(doc(db, 'users', userId), { householdId: householdDoc.id }, { merge: true })

  return { id: householdDoc.id }
}
