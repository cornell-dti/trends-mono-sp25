/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc, // preferred in latest versions of firebase
  updateDoc // preferred in new versions of firebase
} from "firebase/firestore";
import { db } from "./firebase";

// Get all semesters and their courses
export const fetchAllSemesters = async (): Promise<{
  name: string;
  id: string;
}[]> => {
  try {
    const semestersRef = collection(db, "semesters");
    const snapshot = await getDocs(semestersRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name
    }));
  } catch (error) {
    console.error("Error fetching semesters:", error);
    return [];
  }
};

// Add a new semester
export const addSemester = async (name: string): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, "semesters"), { name });
    return docRef.id;
  } catch (error) {
    console.error("Error adding semester:", error);
    return null;
  }
};

// Get all courses for a semester
export const fetchCoursesForSemester = async (
  semesterId: string
): Promise<Course[]> => {
  try {
    const coursesRef = collection(db, `semesters/${semesterId}/courses`);
    const snapshot = await getDocs(coursesRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }) as Course);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
};

// Add a course to a semester
export const addCourseToSemester = async (
  semesterId: string,
  course: Course
): Promise<string | null> => {
  try {
    const { id, ...courseData } = course;

    const docRef = await addDoc(
      collection(db, `semesters/${semesterId}/courses`),
      courseData
    );
    return docRef.id;
  } catch (error) {
    console.error("Error adding course:", error);
    return null;
  }
};

// Delete a course from a semester
export const deleteCourseFromSemester = async (
  semesterId: string,
  courseId: string
): Promise<boolean> => {
  try {
    const docRef = doc(db, `semesters/${semesterId}/courses`, courseId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting course:", error);
    return false;
  }
};

// Update course notes
export const updateCourseNotes = async (
  semesterId: string,
  courseId: string,
  notes: string
): Promise<boolean> => {
  try {
    const docRef = doc(db, `semesters/${semesterId}/courses`, courseId);
    await updateDoc(docRef, { notes });
    return true;
  } catch (error) {
    console.error("Error updating course notes:", error);
    return false;
  }
};

// Update course details to show or hide
export const updateCourseDetails = async (
  semesterId: string,
  courseId: string,
  showDetails: boolean
): Promise<boolean> => {
  try {
    const docRef = doc(db, `semesters/${semesterId}/courses`, courseId);
    await updateDoc(docRef, { showDetails });
    return true;
  } catch (error) {
    console.error("Error updating course details:", error);
    return false;
  }
};

