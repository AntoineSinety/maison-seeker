import { createContext, useContext, useState, useEffect } from 'react'
import { doc, collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuthContext } from './AuthContext'

const HouseholdContext = createContext(null)

export function HouseholdProvider({ children }) {
  const { userProfile } = useAuthContext()
  const [household, setHousehold] = useState(null)
  const [members, setMembers] = useState({})
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  const householdId = userProfile?.householdId

  useEffect(() => {
    if (!householdId) {
      setHousehold(null)
      setListings([])
      setMembers({})
      setLoading(false)
      return
    }

    const unsub = onSnapshot(doc(db, 'households', householdId), (snap) => {
      setHousehold(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    })
    return unsub
  }, [householdId])

  // Charger les profils des membres du foyer
  useEffect(() => {
    const memberIds = household?.memberIds
    if (!memberIds?.length) {
      setMembers({})
      return
    }

    const unsubs = memberIds.map((uid) =>
      onSnapshot(doc(db, 'users', uid), (snap) => {
        if (snap.exists()) {
          setMembers((prev) => ({ ...prev, [uid]: snap.data() }))
        }
      })
    )

    return () => unsubs.forEach((u) => u())
  }, [household?.memberIds?.join(',')])

  useEffect(() => {
    if (!householdId) return

    const q = query(
      collection(db, 'households', householdId, 'listings'),
      orderBy('importedAt', 'desc')
    )

    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setListings(items)
      setLoading(false)
    })
    return unsub
  }, [householdId])

  return (
    <HouseholdContext.Provider value={{ household, householdId, members, listings, loading }}>
      {children}
    </HouseholdContext.Provider>
  )
}

export function useHouseholdContext() {
  const ctx = useContext(HouseholdContext)
  if (!ctx) throw new Error('useHouseholdContext must be used within HouseholdProvider')
  return ctx
}
