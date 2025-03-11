import { useState } from "react";
import CourseCard from "./CourseCard";
import Dropdown from "./lib/Dropdown";
import SlideToggle from "./lib/SlideToggle";

type SemesterProps = {
  name: string;
  allCourses: Course[];
};

const Semester = ({ name, allCourses }: SemesterProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="semesterBox">
      <div className="semesterHeader">
        <h2 className="semesterTitle">{name}</h2>
        <SlideToggle label="minimize" onChange={(e) => setIsMinimized(e)} />
      </div>
      {!isMinimized && (
        <>
          <Dropdown
            options={allCourses}
            onChange={(val) => setCourses([...courses, val])}
          />
          {courses.map((course) => (
            <CourseCard course={course} />
          ))}
        </>
      )}
    </div>
  );
};

export default Semester;
