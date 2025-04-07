import { useEffect, useState } from "react";
import CourseCard from "./CourseCard";
import Dropdown from "./lib/Dropdown";
import SlideToggle from "./lib/SlideToggle";
import { fetchCourseDetails } from "../util";
import {
  fetchCoursesForSemester,
  addCourseToSemester,
  updateCourseDetails,
  deleteCourseFromSemester
} from "../firestoreUtils";

type SemesterProps = {
  semesterId: string;
  name: string;
  allCourses: Course[];
};

const Semester = ({ semesterId, name, allCourses }: SemesterProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [courseDetailsCache, setCourseDetailsCache] = useState<
    Record<string, Partial<Course>>
  >({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load courses from Firestore when component mounts
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

    // First add the course to Firestore
    const courseId = await addCourseToSemester(semesterId, course);

    if (!courseId) {
      console.error("Failed to add course to Firestore");
      return;
    }

    // Add the course with the Firestore document ID
    const newCourse = { ...course, id: courseId };
    setCourses([...courses, newCourse]);

    // If we're already fetching details for this course, don't fetch again
    if (loading[courseKey]) return;

    // Check if we already have details for this course
    if (!courseDetailsCache[courseKey]) {
      // Set loading state for this course
      setLoading(prev => ({ ...prev, [courseKey]: true }));

      try {
        // Fetch detailed information from the API
        const details = await fetchCourseDetails(
          course.subject,
          course.catalogNbr
        );

        // Update the cache with the fetched details
        setCourseDetailsCache({
          ...courseDetailsCache,
          [courseKey]: details
        });

        // Update the course in the courses array with the new details
        setCourses(prev =>
          prev.map(c =>
            c.subject === course.subject && c.catalogNbr === course.catalogNbr
              ? { ...c, ...details }
              : c
          )
        );
      } catch (error) {
        console.error("Error fetching course details:", error);
      } finally {
        // Clear loading state
        setLoading(prev => ({ ...prev, [courseKey]: false }));
      }
    } else {
      // If we already have details, use them
      setCourses(prev =>
        prev.map(c =>
          c.subject === course.subject && c.catalogNbr === course.catalogNbr
            ? { ...c, ...courseDetailsCache[courseKey] }
            : c
        )
      );
    }
  };

  const handleToggleDetails = async (updatedCourse: Course) => {
    if (!updatedCourse.id) return;

    // Update in Firestore
    await updateCourseDetails(
      semesterId,
      updatedCourse.id,
      !!updatedCourse.showDetails
    );

    // Update locally
    setCourses(prev =>
      prev.map(c =>
        c.id === updatedCourse.id
          ? { ...c, showDetails: updatedCourse.showDetails }
          : c
      )
    );
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!courseId) return;

    // Delete from Firestore
    const success = await deleteCourseFromSemester(semesterId, courseId);

    if (success) {
      // Remove from local state
      setCourses(courses.filter(c => c.id !== courseId));
    }
  };

  if (isLoading) {
    return <div className="semesterBox">Loading courses...</div>;
  }

  return (
    <div className="semesterBox">
      <div className="semesterHeader">
        <h2 className="semesterTitle">{name}</h2>
        <SlideToggle label="minimize" onChange={e => setIsMinimized(e)} />
      </div>
      {!isMinimized && (
        <>
          <Dropdown options={allCourses} onChange={handleAddCourse} />
          {courses.map(course => {
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
