import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import { FIREBASE_CONFIG } from '../config/firebase';

class AuthService {
  private app: FirebaseApp;
  private auth;

  constructor() {
    this.app = initializeApp(FIREBASE_CONFIG);
    this.auth = getAuth(this.app);
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  onAuthChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
  }

  async signUp(email: string, password: string, name: string): Promise<User> {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(result.user, { displayName: name });
    return result.user;
  }

  async signIn(email: string, password: string): Promise<User> {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    return result.user;
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  async updateProfile(displayName?: string, photoURL?: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No user logged in');
    await updateProfile(user, { displayName, photoURL });
  }
}

export const authService = new AuthService();
