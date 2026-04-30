import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Check if user is in the admins collection
        let isCollectionAdmin = false;
        try {
          if (user.email) {
            const adminRef = doc(db, 'admins', user.email);
            const adminDoc = await getDoc(adminRef);
            isCollectionAdmin = adminDoc.exists();
          }
        } catch (err: any) {
          if (err.code === 'unavailable' || err.message.includes('offline')) {
            console.warn("Firestore is offline, skipping admin collection check.");
          } else {
            console.log("Not an explicit admin or permission denied:", err.message);
          }
        }
        
        const isEmailAdmin = user.email === "outgame954@gmail.com";
        const isUidAdmin = user.uid === "uVa43jYv4IUCt1XRsSO8inSrtiA2";
        setIsAdmin(isEmailAdmin || isCollectionAdmin || isUidAdmin);

        // Update user profile
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              displayName: user.displayName,
              email: user.email,
              role: (isEmailAdmin || isCollectionAdmin || isUidAdmin) ? 'admin' : 'client'
            });
          }
        } catch (err: any) {
          if (err.code === 'unavailable' || err.message.includes('offline')) {
            console.warn("Firestore is offline, profile sync skipped.");
          } else {
            console.error("Error syncing user profile:", err);
          }
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    // Prompt the user to select an account even if they are already signed in
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Authentication Error:", err);
      if (err.code === 'auth/popup-blocked') {
        alert("Sign-in popup was blocked by your browser. Please allow popups for this site and try again.");
      } else if (err.code === 'auth/cancelled-by-user') {
        // Silently handle user cancellation
      } else {
        alert(`Sign-in failed: ${err.message}. If you're on a mobile device or iframe, try opening the app in a new tab.`);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
