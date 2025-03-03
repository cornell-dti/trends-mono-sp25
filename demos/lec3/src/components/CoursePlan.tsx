import { useState } from "react";
import Semester from "./Semester";
import "./styles.css";

const CoursePlan = () => {
  const [semesterCount, setSemesterCount] = useState<number>(1);

  const handleNewSemesterClick = () => {
    setSemesterCount(semesterCount + 1);
  };

  return (
    <div>
      <button className="newSemesterButton" onClick={handleNewSemesterClick}>
        + New Semester
      </button>
      <div className="semesterContainer">
        {Array.from({ length: semesterCount }).map((_, index) => (
          <Semester name={`Semester ${index + 1}`} />
        ))}
      </div>
    </div>
  );
};

export default CoursePlan;
