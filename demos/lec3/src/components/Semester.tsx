import { useState } from "react";
import Dropdown from "./Dropdown";
import CourseCard from "./CourseCard";

type SemesterProps = {
  name: string;
  allCourses: Course[];
};

const Semester = ({ name, allCourses }: SemesterProps) => {
  const [courses, setCourses] = useState<Course[]>([]);

  const filteredCourseOptions = allCourses.filter((c) => !courses.includes(c));

  return (
    <div className="semesterBox">
      <h2 className="semesterTitle">{name}</h2>
      <div>
        <Dropdown
          options={filteredCourseOptions}
          onChange={(value) => setCourses([...courses, value])}
        />
      </div>
      {courses.map((course) => (
        <CourseCard
          course={course}
          onClick={(course) => setCourses(courses.filter((c) => c != course))}
        />
      ))}
    </div>
  );
};

export default Semester;
