import { useState } from "react";
import { API_URL } from "../environment";

type CourseCardProps = {
  course: Course;
  semesterId: string;
  onToggleDetails?: (course: Course) => void;
  onDeleteCourse?: (courseId: string) => void;
  isLoading?: boolean;
};

const updateCourseNotes = async (
  semesterId: string,
  courseId: string,
  notes: string
): Promise<boolean> => {
  const res = await fetch(
    `${API_URL}/api/semesters/${semesterId}/courses/${courseId}/notes`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    }
  );
  return res.ok;
};

const CourseCard = ({
  course,
  semesterId,
  onToggleDetails,
  onDeleteCourse,
  isLoading = false,
}: CourseCardProps) => {
  const [showDetails, setShowDetails] = useState(course.showDetails || false);
  const [notes, setNotes] = useState(course.notes || "");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const handleDetailsClick = () => {
    const newShowDetails = !showDetails;
    setShowDetails(newShowDetails);
    if (onToggleDetails) {
      onToggleDetails({ ...course, showDetails: newShowDetails });
    }
  };

  const handleDeleteClick = () => {
    if (onDeleteCourse && course.id) {
      onDeleteCourse(course.id);
    }
  };

  const handleEditNotes = () => {
    setIsEditingNotes(true);
  };

  const handleSaveNotes = async () => {
    if (!course.id) return;
    setIsSavingNotes(true);
    try {
      await updateCourseNotes(semesterId, course.id, notes);
      setIsEditingNotes(false);
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCancelEditNotes = () => {
    setNotes(course.notes || "");
    setIsEditingNotes(false);
  };

  return (
    <div className="courseCard">
      <div className="courseHeader">
        <p className="courseCode">
          {course.subject} {course.catalogNbr}
        </p>
        <p className="courseTitle">{course.titleShort}</p>
        <div className="courseActions">
          <button className="detailsToggle" onClick={handleDetailsClick}>
            {showDetails ? "Hide Details" : "Show Details"}
          </button>
          <button className="deleteButton" onClick={handleDeleteClick}>
            Delete
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="courseDetails">
          {isLoading ? (
            <p className="loading-message">Loading course details...</p>
          ) : (
            <>
              {course.credits !== undefined && (
                <p className="courseCredits">
                  <strong>Credits:</strong> {course.credits}
                </p>
              )}
              {course.description && (
                <p className="courseDescription">
                  <strong>Description:</strong> {course.description}
                </p>
              )}
              {course.whenOffered && (
                <p className="courseOffering">
                  <strong>When Offered:</strong> {course.whenOffered}
                </p>
              )}
              {course.instructors && course.instructors.length > 0 && (
                <div>
                  <p>
                    <strong>Instructors:</strong>
                  </p>
                  <ul className="instructorsList">
                    {course.instructors.map((instructor, index) => (
                      <li key={index}>
                        {instructor.firstName} {instructor.lastName}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="courseNotes">
                <h4>Notes:</h4>
                {isEditingNotes ? (
                  <div className="editNotesContainer">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={isSavingNotes}
                    />
                    <div className="notesActions">
                      <button
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                      >
                        {isSavingNotes ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={handleCancelEditNotes}
                        disabled={isSavingNotes}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="viewNotesContainer">
                    <p className="notesText">
                      {notes || "No notes added yet."}
                    </p>
                    <button onClick={handleEditNotes}>
                      {notes ? "Edit Notes" : "Add Notes"}
                    </button>
                  </div>
                )}
              </div>

              {!isLoading &&
                !course.description &&
                !course.credits &&
                !course.whenOffered &&
                (!course.instructors || course.instructors.length === 0) &&
                !notes && (
                  <p className="no-data-message">
                    No additional details available for this course.
                  </p>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseCard;
