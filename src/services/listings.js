import {
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export function getListingsRef(householdId) {
  return collection(db, 'households', householdId, 'listings')
}

export function getListingRef(householdId, listingId) {
  return doc(db, 'households', householdId, 'listings', listingId)
}

export async function addListing(householdId, data) {
  const ref = await addDoc(getListingsRef(householdId), {
    ...data,
    votes: {},
    lastSeenBy: {},
    status: 'active',
    importedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return ref.id
}

export async function updateListing(householdId, listingId, data) {
  const ref = getListingRef(householdId, listingId)
  await updateDoc(ref, {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

export async function voteListing(householdId, listingId, userId, vote) {
  const ref = getListingRef(householdId, listingId)
  await updateDoc(ref, {
    [`votes.${userId}`]: vote,
    updatedAt: Timestamp.now(),
  })
}

export async function markSeen(householdId, listingId, userId) {
  const ref = getListingRef(householdId, listingId)
  await updateDoc(ref, {
    [`lastSeenBy.${userId}`]: Timestamp.now(),
  })
}

export async function archiveListing(householdId, listingId) {
  const ref = getListingRef(householdId, listingId)
  await updateDoc(ref, {
    status: 'archived',
    updatedAt: Timestamp.now(),
  })
}

export async function unarchiveListing(householdId, listingId) {
  const ref = getListingRef(householdId, listingId)
  await updateDoc(ref, {
    status: 'active',
    updatedAt: Timestamp.now(),
  })
}

export async function deleteListing(householdId, listingId) {
  const ref = getListingRef(householdId, listingId)
  await deleteDoc(ref)
}
