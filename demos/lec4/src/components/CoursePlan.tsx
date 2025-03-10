import Semester from "./Semester";
import "./styles.css";
import { COURSES } from "../constants/consts";
import { useState } from "react";

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
        <Semester name={"Semester 1"} allCourses={COURSES} />
      </div>
    </div>
  );
};

export default CoursePlan;
