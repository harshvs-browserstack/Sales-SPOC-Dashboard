import { Injectable, signal } from '@angular/core';

export interface DummyUser {
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class DummyAuthService {
  // Dummy user data
  private readonly DUMMY_USER: DummyUser = {
    name: 'Harsh',
    email: 'harshvardhan@browserstack.com'
  };

  // Auth state
  private loggedIn = signal<boolean>(false);
  private currentUser = signal<DummyUser | null>(null);

  constructor() {
    // Check if user was previously logged in (persisted in localStorage)
    this.loadAuthState();
  }

  isLoggedIn() {
    return this.loggedIn.asReadonly();
  }

  getUser() {
    return this.currentUser.asReadonly();
  }

  signIn() {
    this.loggedIn.set(true);
    this.currentUser.set(this.DUMMY_USER);
    this.saveAuthState();
  }

  signOut() {
    this.loggedIn.set(false);
    this.currentUser.set(null);
    this.clearAuthState();
  }

  private loadAuthState() {
    try {
      if (typeof localStorage === 'undefined') return;
      const stored = localStorage.getItem('dummy_auth_state');
      if (stored === 'logged_in') {
        this.loggedIn.set(true);
        this.currentUser.set(this.DUMMY_USER);
      }
    } catch (e) {
      console.warn('Could not load auth state from localStorage');
    }
  }

  private saveAuthState() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem('dummy_auth_state', 'logged_in');
    } catch (e) {
      console.warn('Could not save auth state to localStorage');
    }
  }

  private clearAuthState() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.removeItem('dummy_auth_state');
    } catch (e) {
      console.warn('Could not clear auth state from localStorage');
    }
  }
}
