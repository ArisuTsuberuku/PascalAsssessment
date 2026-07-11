import { doc, getDoc, setDoc, collection, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Assignment } from "@/types/assignment";
import { mockAssignment } from "@/constants/mockAssignment";

const COLLECTION_NAME = "assignments";

/**
 * Fetch an assignment document from Firestore by its ID.
 */
export async function getAssignment(
  assignmentId: string
): Promise<Assignment | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, assignmentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as Assignment;
    }
    return null;
  } catch (error) {
    console.error("Error fetching assignment from Firestore:", error);
    throw error;
  }
}

/**
 * Fetch all assignment documents from Firestore for the current teacher.
 */
export async function getAllAssignments(teacherId?: string): Promise<Assignment[]> {
  try {
    let currentTeacherId = teacherId || auth?.currentUser?.uid;
    if (!currentTeacherId && auth) {
      await auth.authStateReady();
      currentTeacherId = auth.currentUser?.uid;
    }
    if (!currentTeacherId) {
      console.warn("getAllAssignments called without authenticated teacherId");
      return [];
    }
    const assignmentsRef = collection(db, COLLECTION_NAME);
    const q = query(assignmentsRef, where("teacherId", "==", currentTeacherId));
    const querySnapshot = await getDocs(q);
    const assignments: Assignment[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      assignments.push({
        ...data,
        assignmentId: data.assignmentId || docSnap.id,
      } as Assignment);
    });
    return assignments;
  } catch (error) {
    console.error("Error fetching all assignments from Firestore:", error);
    return [];
  }
}

/**
 * Seed initial mock assignment data into Firestore under ID 'test-123'
 */
export async function initMockAssignmentToDB(
  targetId: string = "test-123"
): Promise<void> {
  try {
    const currentTeacherId = auth?.currentUser?.uid || "mock-teacher-id";
    const seedData: any = {
      ...mockAssignment,
      assignmentId: targetId,
      teacherId: currentTeacherId,
      updatedAt: serverTimestamp(),
    };
    const docRef = doc(db, COLLECTION_NAME, targetId);
    await setDoc(docRef, seedData);
    console.log(`Successfully seeded mock assignment to Firestore ID: ${targetId}`);
  } catch (error) {
    console.error("Error seeding mock assignment to Firestore:", error);
    throw error;
  }
}
