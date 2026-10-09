import { db } from '../firebase/config';
import { collection, setDoc, getDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import type { Volunteer } from '../types/Volunteer';

// Collection: volunteers. The document ID is the user's UID (same as in users).
const COLLECTION = 'volunteers';

// ~~~~~~~~~~ CREATE ~~~~~~~~~~

export const createVolunteer = async (UID: string, data: Omit<Volunteer, 'UID'>): Promise<void> => {
  try {
    await setDoc(doc(db, COLLECTION, UID), { UID, ...data });
  } catch (error) {
    console.error('Error creating volunteer:', error);
    throw error;
  }
};

// ~~~~~~~~~~ READ ~~~~~~~~~~

// Get a volunteer by UID
export const getVolunteer = async (UID: string): Promise<Volunteer | null> => {
  try {
    const snap = await getDoc(doc(db, COLLECTION, UID));
    return snap.exists() ? (snap.data() as Volunteer) : null;
  } catch (error) {
    console.error(`Error getting volunteer by UID "${UID}":`, error);
    throw error;
  }
};

// Get all volunteers
export const getAllVolunteers = async (): Promise<Volunteer[]> => {
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    return snap.docs.map(d => d.data() as Volunteer);
  } catch (error) {
    console.error('Error getting all volunteers:', error);
    throw error;
  }
};

// Get all volunteers by preferred support mode
export const getVolunteersByPrefSupportMode = async (mode: Volunteer['prefSupportMode']): Promise<Volunteer[]> => {
  try {
    const snap = await getDocs(query(collection(db, COLLECTION), where('prefSupportMode', '==', mode)));
    return snap.docs.map(d => d.data() as Volunteer);
  } catch (error) {
    console.error(`Error getting "${mode}" volunteers:`, error);
    throw error;
  }
};

// Get all volunteers who cover a category. volCategories is one delimited string, so this filters in the
// browser: fine for a small volunteer list, but not something to run on a huge collection.
export const getVolunteersByCategory = async (category: string): Promise<Volunteer[]> => {
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    return snap.docs
      .map(d => d.data() as Volunteer)
      .filter(volunteer => volunteer.volCategories?.toLowerCase().includes(category.toLowerCase()));
  } catch (error) {
    console.error(`Error getting volunteers for category "${category}":`, error);
    throw error;
  }
};

// ~~~~~~~~~~ UPDATE ~~~~~~~~~~

// avgRating should really be recalculated on the server after each feedback, not edited from the browser
export const updateVolunteer = async (UID: string, updates: Partial<Omit<Volunteer, 'UID'>>): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION, UID), { ...updates });
  } catch (error) {
    console.error(`Error updating volunteer "${UID}":`, error);
    throw error;
  }
};

// ~~~~~~~~~~ DELETE ~~~~~~~~~~

export const deleteVolunteer = async (UID: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION, UID));
  } catch (error) {
    console.error(`Error deleting volunteer "${UID}":`, error);
    throw error;
  }
};