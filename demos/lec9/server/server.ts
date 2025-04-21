import express, { Express } from "express";
import cors from "cors";
import { db } from "./firebase";

const app: Express = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/api/", (req, res) => {
  res.send("hello world!");
});

app.post("/api/", async (req, res) => {
  const key = req.body.key;
  console.log(key);
  res.json({ message: "Hello, world!" });
});

// Get all semesters
app.get("/api/semesters", async (req, res) => {
  try {
    const snapshot = await db.collection("semesters").get();
    const semesters = snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }));
    res.json(semesters);
  } catch (error) {
    console.error("Error fetching semesters:", error);
    res.status(500).json({ error: "Failed to fetch semesters" });
  }
});

// Add a new semester
app.post("/api/semesters", async (req, res) => {
  const { name } = req.body;
  try {
    const docRef = await db.collection("semesters").add({ name });
    res.json({ id: docRef.id });
  } catch (error) {
    console.error("Error adding semester:", error);
    res.status(500).json({ error: "Failed to add semester" });
  }
});

// Get all courses for a semester
app.get("/api/semesters/:semesterId/courses", async (req, res) => {
  const { semesterId } = req.params;
  try {
    const snapshot = await db
      .collection(`semesters/${semesterId}/courses`)
      .get();
    const courses = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    res.json(courses);
  } catch (error) {
    console.error(`Error fetching courses for semester ${semesterId}:`, error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// Add a course to a semester
app.post("/api/semesters/:semesterId/courses", async (req, res) => {
  const { semesterId } = req.params;
  const course = req.body;
  try {
    // Remove id field if present
    const { id, ...courseData } = course;
    const docRef = await db
      .collection(`semesters/${semesterId}/courses`)
      .add(courseData);
    res.json({ id: docRef.id });
  } catch (error) {
    console.error(`Error adding course to semester ${semesterId}:`, error);
    res.status(500).json({ error: "Failed to add course" });
  }
});

// Delete a course from a semester
app.delete("/api/semesters/:semesterId/courses/:courseId", async (req, res) => {
  const { semesterId, courseId } = req.params;
  try {
    await db.doc(`semesters/${semesterId}/courses/${courseId}`).delete();
    res.json({ success: true });
  } catch (error) {
    console.error(
      `Error deleting course ${courseId} from semester ${semesterId}:`,
      error
    );
    res.status(500).json({ error: "Failed to delete course" });
  }
});

// Update course notes
app.patch(
  "/api/semesters/:semesterId/courses/:courseId/notes",
  async (req, res) => {
    const { semesterId, courseId } = req.params;
    const { notes } = req.body;
    try {
      await db
        .doc(`semesters/${semesterId}/courses/${courseId}`)
        .update({ notes });
      res.json({ success: true });
    } catch (error) {
      console.error(`Error updating notes for course ${courseId}:`, error);
      res.status(500).json({ error: "Failed to update notes" });
    }
  }
);

// Update course details (showDetails)
app.patch(
  "/api/semesters/:semesterId/courses/:courseId/details",
  async (req, res) => {
    const { semesterId, courseId } = req.params;
    const { showDetails } = req.body;
    try {
      await db
        .doc(`semesters/${semesterId}/courses/${courseId}`)
        .update({ showDetails });
      res.json({ success: true });
    } catch (error) {
      console.error(`Error updating details for course ${courseId}:`, error);
      res.status(500).json({ error: "Failed to update details" });
    }
  }
);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
