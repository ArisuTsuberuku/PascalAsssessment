import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
 * Fetch all assignment documents from Firestore.
 */
export async function getAllAssignments(): Promise<Assignment[]> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
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
 * (and optionally also under targetId if specified for testing).
 */
export async function initMockAssignmentToDB(
  targetId: string = "test-123"
): Promise<void> {
  try {
    const seedData: Assignment = {
      ...mockAssignment,
      assignmentId: targetId,
    };
    const docRef = doc(db, COLLECTION_NAME, targetId);
    await setDoc(docRef, seedData);
    console.log(`Successfully seeded mock assignment to Firestore ID: ${targetId}`);
  } catch (error) {
    console.error("Error seeding mock assignment to Firestore:", error);
    throw error;
  }
}
