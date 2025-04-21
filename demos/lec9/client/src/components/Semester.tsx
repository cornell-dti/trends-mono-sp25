import { useEffect, useState } from "react";
import CourseCard from "./CourseCard";
import Dropdown from "./lib/Dropdown";
import SlideToggle from "./lib/SlideToggle";
import { fetchCourseDetails } from "../util";
import { API_URL } from "../environment";

type SemesterProps = {
  semesterId: string;
  name: string;
  allCourses: Course[];
};

const fetchCoursesForSemester = async (
  semesterId: string
): Promise<Course[]> => {
  const res = await fetch(`${API_URL}/api/semesters/${semesterId}/courses`);
  if (!res.ok) throw new Error("Failed to fetch courses");
  return await res.json();
};

const addCourseToSemester = async (
  semesterId: string,
  course: Course
): Promise<string | null> => {
  const res = await fetch(`${API_URL}/api/semesters/${semesterId}/courses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(course),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.id;
};

const updateCourseDetails = async (
  semesterId: string,
  courseId: string,
  showDetails: boolean
): Promise<boolean> => {
  const res = await fetch(
    `${API_URL}/api/semesters/${semesterId}/courses/${courseId}/details`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showDetails }),
    }
  );
  return res.ok;
};

const deleteCourseFromSemester = async (
  semesterId: string,
  courseId: string
): Promise<boolean> => {
  const res = await fetch(
    `${API_URL}/api/semesters/${semesterId}/courses/${courseId}`,
    {
      method: "DELETE",
    }
  );
  return res.ok;
};

const Semester = ({ semesterId, name, allCourses }: SemesterProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [courseDetailsCache, setCourseDetailsCache] = useState<
    Record<string, Partial<Course>>
  >({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      setIsLoading(true);
      try {
        const coursesData = await fetchCoursesForSemester(semesterId);
        setCourses(coursesData);
      } catch (error) {
        console.error(
          `Error loading courses for semester ${semesterId}:`,
          error
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadCourses();
  }, [semesterId]);

  const handleAddCourse = async (course: Course) => {
    const courseKey = `${course.subject}-${course.catalogNbr}`;
    const courseId = await addCourseToSemester(semesterId, course);
    if (!courseId) {
      console.error("Failed to add course to Firestore");
      return;
    }
    const newCourse = { ...course, id: courseId };
    setCourses([...courses, newCourse]);
    if (loading[courseKey]) return;
    if (!courseDetailsCache[courseKey]) {
      setLoading((prev) => ({ ...prev, [courseKey]: true }));
      try {
        const details = await fetchCourseDetails(
          course.subject,
          course.catalogNbr
        );
        setCourseDetailsCache({
          ...courseDetailsCache,
          [courseKey]: details,
        });
        setCourses((prev) =>
          prev.map((c) =>
            c.subject === course.subject && c.catalogNbr === course.catalogNbr
              ? { ...c, ...details }
              : c
          )
        );
      } catch (error) {
        console.error("Error fetching course details:", error);
      } finally {
        setLoading((prev) => ({ ...prev, [courseKey]: false }));
      }
    } else {
      setCourses((prev) =>
        prev.map((c) =>
          c.subject === course.subject && c.catalogNbr === course.catalogNbr
            ? { ...c, ...courseDetailsCache[courseKey] }
            : c
        )
      );
    }
  };

  const handleToggleDetails = async (updatedCourse: Course) => {
    if (!updatedCourse.id) return;
    await updateCourseDetails(
      semesterId,
      updatedCourse.id,
      !!updatedCourse.showDetails
    );
    setCourses((prev) =>
      prev.map((c) =>
        c.id === updatedCourse.id
          ? { ...c, showDetails: updatedCourse.showDetails }
          : c
      )
    );
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!courseId) return;
    const success = await deleteCourseFromSemester(semesterId, courseId);
    if (success) {
      setCourses(courses.filter((c) => c.id !== courseId));
    }
  };

  if (isLoading) {
    return <div className="semesterBox">Loading courses...</div>;
  }

  return (
    <div className="semesterBox">
      <div className="semesterHeader">
        <h2 className="semesterTitle">{name}</h2>
        <SlideToggle label="minimize" onChange={(e) => setIsMinimized(e)} />
      </div>
      {!isMinimized && (
        <>
          <Dropdown options={allCourses} onChange={handleAddCourse} />
          {courses.map((course) => {
            const courseKey = `${course.subject}-${course.catalogNbr}`;
            return (
              <CourseCard
                key={course.id || `${courseKey}-${Math.random()}`}
                course={course}
                onToggleDetails={handleToggleDetails}
                onDeleteCourse={handleDeleteCourse}
                semesterId={semesterId}
                isLoading={loading[courseKey]}
              />
            );
          })}
        </>
      )}
    </div>
  );
};

export default Semester;
