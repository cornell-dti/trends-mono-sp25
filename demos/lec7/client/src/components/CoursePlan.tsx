import Semester from "./Semester";
import "./styles.css";
import { COURSES } from "../constants/consts";
import { useEffect, useState } from "react";
import { fetchAllSemesters, addSemester } from "../firestoreUtils";

interface SemesterData {
  id: string;
  name: string;
}

const CoursePlan = () => {
  const [semesters, setSemesters] = useState<SemesterData[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const handleNewSemesterClick = async () => {
    const newSemName = `Semester ${semesters.length + 1}`;
    const semesterId = await addSemester(newSemName);

    if (semesterId) {
      setSemesters([...semesters, { id: semesterId, name: newSemName }]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Get all semesters from Firestore
        const semestersData = await fetchAllSemesters();
        setSemesters(semestersData);

        // If no semesters exist, create the first one
        if (semestersData.length === 0) {
          const semesterId = await addSemester("Semester 1");
          if (semesterId) {
            setSemesters([{ id: semesterId, name: "Semester 1" }]);
          }
        }

        // Set course data from constants
        setAllCourses(COURSES);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div>Loading course plan...</div>;
  }

  return (
    <div>
      <button className="newSemesterButton" onClick={handleNewSemesterClick}>
        + New Semester
      </button>
      <div className="semesterContainer">
        {semesters.map(sem => (
          <Semester
            key={sem.id}
            semesterId={sem.id}
            name={sem.name}
            allCourses={allCourses}
          />
        ))}
      </div>
    </div>
  );
};

export default CoursePlan;
