import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot, setDoc, getDoc, Timestamp } from 'firebase/firestore'
import { auth, db } from '../services/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      if (!firebaseUser) {
        setUserProfile(null)
        setLoading(false)
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!user) return

    const userRef = doc(db, 'users', user.uid)

    // Creer le document user s'il n'existe pas encore (premiere connexion Google)
    getDoc(userRef).then((snap) => {
      if (!snap.exists()) {
        setDoc(userRef, {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          householdId: null,
          createdAt: Timestamp.now(),
        })
      }
    })

    const unsubscribe = onSnapshot(userRef, (snap) => {
      setUserProfile(snap.exists() ? snap.data() : null)
      setLoading(false)
    })
    return unsubscribe
  }, [user])

  return (
    <AuthContext.Provider value={{ user, userProfile, setUserProfile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
