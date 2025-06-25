import { Auth } from 'aws-amplify';
import apiClient from './apiService';
import environment from '../config/environment';

class AuthService {
  constructor() {
    this.baseUrl = '/user';
    this.currentUser = null;
    this.authInfo = null;
    this.isConfigured = this.checkConfiguration();
  }

  // Check if AWS Cognito is properly configured
  checkConfiguration() {
    const config = environment.AWS_CONFIG;
    const isValid = config.region && 
                   config.userPoolId && 
                   config.userPoolWebClientId &&
                   !config.userPoolId.includes('XXXXXXXXX') &&
                   !config.userPoolWebClientId.includes('XXXXXXXXX');
    
    if (!isValid) {
      console.warn('⚠️ AWS Cognito non è configurato correttamente. Aggiorna src/config/environment.js con i tuoi parametri AWS.');
    }
    
    return isValid;
  }

  // Initialize authentication
  async initialize() {
    if (!this.isConfigured) {
      console.log('AWS Cognito not configured, skipping authentication');
      return null;
    }
    
    try {
      const user = await Auth.currentAuthenticatedUser();
      this.currentUser = user;
      await this.loadAuthInfo();
      return user;
    } catch (error) {
      console.log('No authenticated user');
      return null;
    }
  }

  // Sign in user
  async signIn(email, password) {
    if (!this.isConfigured) {
      throw this.handleError({
        message: 'AWS Cognito non è configurato. Aggiorna src/config/environment.js con i tuoi parametri AWS Cognito.',
        code: 'CONFIG_ERROR'
      });
    }
    
    try {
      const user = await Auth.signIn(email, password);
      this.currentUser = user;
      await this.loadAuthInfo();
      return user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Sign out user
  async signOut() {
    if (!this.isConfigured) {
      this.currentUser = null;
      this.authInfo = null;
      return true;
    }
    
    try {
      await Auth.signOut();
      this.currentUser = null;
      this.authInfo = null;
      return true;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Register new user
  async register(userData) {
    try {
      const response = await apiClient.post(this.baseUrl, userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get auth info
  getAuthInfo() {
    return this.authInfo;
  }

  // Load auth info from backend
  async loadAuthInfo() {
    try {
      if (!this.currentUser) return null;
      
      const email = this.currentUser.attributes?.email;
      if (!email) return null;

      const response = await apiClient.get(`${this.baseUrl}/auth`, {
        params: { email }
      });
      
      this.authInfo = response.data;
      return this.authInfo;
    } catch (error) {
      console.error('Error loading auth info:', error);
      return null;
    }
  }

  // Set auth info
  setAuthInfo(authInfo) {
    this.authInfo = authInfo;
  }

  // Check if user is authenticated
  async isAuthenticated() {
    if (!this.isConfigured) {
      return false;
    }
    
    try {
      await Auth.currentAuthenticatedUser();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get current session
  async getCurrentSession() {
    if (!this.isConfigured) {
      return null;
    }
    
    try {
      return await Auth.currentSession();
    } catch (error) {
      return null;
    }
  }

  // Error handler
  handleError(error) {
    console.error('AuthService Error:', error);
    return {
      message: error.message || 'Authentication error occurred',
      code: error.code || 'AUTH_ERROR'
    };
  }
}

export default new AuthService();