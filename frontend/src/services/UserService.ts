import { db } from '../firebase/config';
import { collection, setDoc, getDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import type { User } from '../types/User';

// Collection: users. The document ID is the Firebase Auth UID.
const COLLECTION = 'users';

// ~~~~~~~~~~ CREATE ~~~~~~~~~~

export const createUser = async (UID: string, data: Omit<User, 'UID'>): Promise<void> => {
  try {
    await setDoc(doc(db, COLLECTION, UID), { UID, ...data });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// ~~~~~~~~~~ READ ~~~~~~~~~~

// Get a user by UID (the document ID, so no query is needed)
export const getUser = async (UID: string): Promise<User | null> => {
  try {
    const snap = await getDoc(doc(db, COLLECTION, UID));
    return snap.exists() ? (snap.data() as User) : null;
  } catch (error) {
    console.error(`Error getting user by UID "${UID}":`, error);
    throw error;
  }
};

// Get a user by email
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const snap = await getDocs(query(collection(db, COLLECTION), where('email', '==', email)));
    return snap.empty ? null : (snap.docs[0].data() as User);
  } catch (error) {
    console.error(`Error getting user by email "${email}":`, error);
    throw error;
  }
};

// Get a user by studentID
export const getUserByStudentID = async (studentID: string): Promise<User | null> => {
  try {
    const snap = await getDocs(query(collection(db, COLLECTION), where('studentID', '==', studentID)));
    return snap.empty ? null : (snap.docs[0].data() as User);
  } catch (error) {
    console.error(`Error getting user by student ID "${studentID}":`, error);
    throw error;
  }
};

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    return snap.docs.map(d => d.data() as User);
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Get all users by account status (e.g. the 'Pending' ones waiting for admin approval)
export const getUsersByStatus = async (accStatus: User['accStatus']): Promise<User[]> => {
  try {
    const snap = await getDocs(query(collection(db, COLLECTION), where('accStatus', '==', accStatus)));
    return snap.docs.map(d => d.data() as User);
  } catch (error) {
    console.error(`Error getting "${accStatus}" users:`, error);
    throw error;
  }
};

// Get all users who are also volunteers
export const getVolunteerUsers = async (): Promise<User[]> => {
  try {
    const snap = await getDocs(query(collection(db, COLLECTION), where('isVolunteer', '==', true)));
    return snap.docs.map(d => d.data() as User);
  } catch (error) {
    console.error('Error getting volunteer users:', error);
    throw error;
  }
};

// ~~~~~~~~~~ UPDATE ~~~~~~~~~~

export const updateUser = async (UID: string, updates: Partial<Omit<User, 'UID'>>): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION, UID), { ...updates });
  } catch (error) {
    console.error(`Error updating user "${UID}":`, error);
    throw error;
  }
};

// ~~~~~~~~~~ DELETE ~~~~~~~~~~

export const deleteUser = async (UID: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION, UID));
  } catch (error) {
    console.error(`Error deleting user "${UID}":`, error);
    throw error;
  }
};