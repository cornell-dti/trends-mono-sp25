import Semester from "./Semester";
import "./styles.css";
import { COURSES } from "../constants/consts";
import { useEffect, useState } from "react";

interface SemesterData {
  id: string;
  name: string;
}

const fetchAllSemesters = async (): Promise<SemesterData[]> => {
  const res = await fetch("http://localhost:8080/api/semesters");
  if (!res.ok) throw new Error("Failed to fetch semesters");
  return await res.json();
};

const addSemester = async (name: string): Promise<string | null> => {
  const res = await fetch("http://localhost:8080/api/semesters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.id;
};

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
        const semestersData = await fetchAllSemesters();
        setSemesters(semestersData);
        if (semestersData.length === 0) {
          const semesterId = await addSemester("Semester 1");
          if (semesterId) {
            setSemesters([{ id: semesterId, name: "Semester 1" }]);
          }
        }
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
        {semesters.map((sem) => (
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
