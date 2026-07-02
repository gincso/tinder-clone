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
import { DEV_MODE, DEV_SETTINGS } from '../config/devMode';

class AuthService {
  private app: FirebaseApp | null = null;
  private auth: any = null;
  private devUser: any = null;
  private initialized = false;

  constructor() {
    if (DEV_MODE) {
      this.initialized = true;
      this.devUser = DEV_SETTINGS.defaultUser;
      return;
    }
    try {
      this.app = initializeApp(FIREBASE_CONFIG);
      this.auth = getAuth(this.app);
      this.initialized = true;
    } catch (e) {
      console.warn('Firebase init failed, using dev mode:', e);
      this.initialized = true;
      this.devUser = DEV_SETTINGS.defaultUser;
    }
  }

  private isDev(): boolean {
    return DEV_MODE || !this.auth;
  }

  getCurrentUser(): User | null {
    if (this.isDev()) return this.devUser as any;
    return this.auth?.currentUser || null;
  }

  onAuthChanged(callback: (user: User | null) => void): () => void {
    if (this.isDev()) {
      setTimeout(() => callback(this.devUser as any), 100);
      return () => {};
    }
    return onAuthStateChanged(this.auth, callback);
  }

  async signUp(email: string, password: string, name: string): Promise<User> {
    if (this.isDev()) {
      this.devUser = { ...DEV_SETTINGS.defaultUser, email, displayName: name, uid: 'user_self' };
      return this.devUser as any;
    }
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(result.user, { displayName: name });
    return result.user;
  }

  async signIn(email: string, password: string): Promise<User> {
    if (this.isDev()) {
      this.devUser = { ...DEV_SETTINGS.defaultUser, email };
      return this.devUser as any;
    }
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    return result.user;
  }

  async signOut(): Promise<void> {
    if (this.isDev()) {
      this.devUser = null;
      return;
    }
    await signOut(this.auth);
  }

  async updateProfile(displayName?: string, photoURL?: string): Promise<void> {
    if (this.isDev()) {
      if (this.devUser) {
        Object.assign(this.devUser, { displayName, photoURL });
      }
      return;
    }
    const user = this.auth.currentUser;
    if (!user) throw new Error('No user logged in');
    await updateProfile(user, { displayName, photoURL });
  }
}

export const authService = new AuthService();
