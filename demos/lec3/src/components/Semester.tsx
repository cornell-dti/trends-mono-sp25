import { useEffect, useState } from "react";
import "./styles.css";
import { COURSES } from "../constants/consts";
import Dropdown from "./Dropdown";
import CourseCard from "./CourseCard";

type SemesterProps = {
  name: string;
};

const Semester = ({ name }: SemesterProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  useEffect(() => {
    const fetchData = () => COURSES;
    setAllCourses(fetchData());
  }, []);

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
        <CourseCard course={course} />
      ))}
    </div>
  );
};

export default Semester;
