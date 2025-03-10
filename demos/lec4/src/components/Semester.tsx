import CourseCard from "./CourseCard";

type SemesterProps = {
  name: string;
  allCourses: Course[];
};

const Semester = ({ name, allCourses }: SemesterProps) => {
  return (
    <div className="semesterBox">
      <h2 className="semesterTitle">{name}</h2>
      <CourseCard course={allCourses[0]} />
    </div>
  );
};

export default Semester;
