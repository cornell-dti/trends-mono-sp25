type CourseCardProps = {
  course: Course;
  onClick?: (course: Course) => void;
};

const CourseCard = ({ course, onClick }: CourseCardProps) => (
  <div
    className="courseCard"
    onClick={onClick ? () => onClick(course) : undefined}
  >
    <p className="courseCode">
      {course.subject} {course.catalogNbr}
    </p>
    <p className="courseTitle">{course.titleShort}</p>
  </div>
);

export default CourseCard;
