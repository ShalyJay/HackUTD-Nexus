import { db, auth } from '../firebase';
import { collection, doc, setDoc, getDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  accountType: 'vendors' | 'clients' | 'admin';
  status: 'pending' | 'active' | 'suspended';
  onboardingComplete: boolean;
  createdAt: Timestamp | Date;
  lastUpdated: Timestamp | Date;
}

export class UserService {
  private static readonly USERS_COLLECTION = 'users';

  // Create a temporary user in memory (NOT in Firebase)
  // This user only exists until they pass compliance
  static async createTemporaryUserSession(userData: Omit<UserProfile, 'userId' | 'status' | 'onboardingComplete' | 'createdAt' | 'lastUpdated'>, password: string): Promise<{ userId: string; password: string; userData: Omit<UserProfile, 'userId' | 'status' | 'onboardingComplete' | 'createdAt' | 'lastUpdated'> }> {
    try {
      console.log("Creating temporary user session (pre-compliance)...");
      
      // Do NOT create Firebase Auth yet
      // Just prepare the data for storage in sessionStorage
      const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        userId: tempUserId,
        password: password,
        userData: userData
      };
    } catch (error) {
      console.error("Error creating temporary session:", error);
      throw error;
    }
  }

  // Only create Firebase user AFTER compliance passes
  static async createPermanentUserAfterCompliance(userData: Omit<UserProfile, 'userId' | 'status' | 'onboardingComplete' | 'createdAt' | 'lastUpdated'>, password: string): Promise<UserProfile> {
    try {
      console.log("Creating permanent Firebase user after compliance passed...");
      // Now create Firebase Auth user
      const { user } = await createUserWithEmailAndPassword(auth, userData.email, password);

      const now = Timestamp.now();
      const permanentUserData: UserProfile = {
        userId: user.uid,
        ...userData,
        status: 'active',
        onboardingComplete: true,
        createdAt: now,
        lastUpdated: now
      };

      // Store in permanent collection
      await setDoc(doc(db, this.USERS_COLLECTION, user.uid), permanentUserData);
      console.log("Permanent user created in Firebase");

      return permanentUserData;
    } catch (error) {
      console.error("Error creating permanent user:", error);
      throw error;
    }
  }

  // Get user profile
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    // Check permanent collection only (since we now store directly there after compliance)
    const userDoc = await getDoc(doc(db, this.USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }

    return null;
  }

  // Get all users visible to the given user
  static async getVisibleUsers(userId: string): Promise<UserProfile[]> {
    const userProfile = await this.getUserProfile(userId);
    if (!userProfile) throw new Error('User not found');

    const usersRef = collection(db, this.USERS_COLLECTION);
    let q;

    switch (userProfile.accountType) {
      case 'admin':
        // Admins can see all users
        q = query(usersRef);
        break;
      case 'vendors':
        // Vendors can only see admin's client side
        q = query(usersRef, where('accountType', '==', 'clients'));
        break;
      case 'clients':
        // Clients can only see admin's vendor side
        q = query(usersRef, where('accountType', '==', 'vendors'));
        break;
      default:
        throw new Error('Invalid account type');
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
  }

  // Sign in user
  static async signIn(email: string, password: string): Promise<UserProfile> {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    const profile = await this.getUserProfile(user.uid);
    if (!profile) throw new Error('User profile not found');
    return profile;
  }

  // Update user profile with documents and last upload info
  static async updateUserWithUpload(
    userId: string, 
    uploadData: {
      documentNames: string[];
      documentCount: number;
      lastUploadDate: Timestamp | Date;
      uploadedFiles?: {
        soc2?: string;
        iso27001?: string;
        auditReports?: string;
        insurance?: string;
      };
    }
  ): Promise<void> {
    try {
      console.log("Updating user profile with upload info:", userId);
      
      const userRef = doc(db, this.USERS_COLLECTION, userId);
      
      await setDoc(userRef, {
        lastUploadedDocuments: uploadData.documentNames,
        documentCount: uploadData.documentCount,
        lastUploadDate: uploadData.lastUploadDate,
        uploadedFiles: uploadData.uploadedFiles || {},
        lastUpdated: Timestamp.now()
      }, { merge: true });
      
      console.log("User profile updated with upload information");
    } catch (error) {
      console.error("Error updating user profile with upload:", error);
      throw error;
    }
  }
}