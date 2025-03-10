import { useEffect, useState } from "react";
import Semester from "./Semester";
import "./styles.css";
import { COURSES } from "../constants/consts";

const CoursePlan = () => {
  const [semesterCount, setSemesterCount] = useState<number>(1);
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  const handleNewSemesterClick = () => {
    setSemesterCount(semesterCount + 1);
  };

  useEffect(() => {
    const fetchData = () => COURSES;
    setAllCourses(fetchData());
  }, []);

  return (
    <div>
      <button className="newSemesterButton" onClick={handleNewSemesterClick}>
        + New Semester
      </button>
      <div className="semesterContainer">
        {Array.from({ length: semesterCount }).map((_, index) => (
          <Semester name={`Semester ${index + 1}`} allCourses={allCourses} />
        ))}
      </div>
    </div>
  );
};

export default CoursePlan;
