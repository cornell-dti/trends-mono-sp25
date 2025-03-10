import { useState } from "react";
import Dropdown from "./lib/Dropdown";
import CourseCard from "./CourseCard";
import SlideToggle from "./lib/SlideToggle";

type SemesterProps = {
  name: string;
  allCourses: Course[];
};

const Semester = ({ name, allCourses }: SemesterProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const filteredCourseOptions = allCourses.filter((c) => !courses.includes(c));

  return (
    <div className="semesterBox">
      <div className="semesterHeader">
        <h2 className="semesterTitle">{name}</h2>
        <SlideToggle
          label={"minimize"}
          onChange={(toggle) => setIsMinimized(toggle)}
        />
      </div>
      {!isMinimized && (
        <>
          <div>
            <Dropdown
              options={filteredCourseOptions}
              onChange={(value) => setCourses([...courses, value])}
            />
          </div>
          {courses.map((course) => (
            <CourseCard
              course={course}
              onClick={(course) =>
                setCourses(courses.filter((c) => c != course))
              }
            />
          ))}
        </>
      )}
    </div>
  );
};

export default Semester;
