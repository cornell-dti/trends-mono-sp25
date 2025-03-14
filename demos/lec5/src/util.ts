/**
 * Makes an array with the integers from 0 (inclusive) to n (exclusive).
 * @param n The size of the array with numbers from [0..n-1]. Requires n >= 0.
 */
export const makeArray = (num: number) => Array.from(Array(num).keys());

/**
 * Fetches detailed course information from the Cornell API
 * @param subject The course subject code (e.g., "CS")
 * @param catalogNbr The course catalog number (e.g., 1110)
 */
export const fetchCourseDetails = async (
  subject: string,
  catalogNbr: number
): Promise<Partial<Course>> => {
  try {
    // Properly format the API URL according to Cornell's documentation
    // Format: https://<HOST>/api/<VERSION>/<method>.<responseFormat>?parameters
    const response = await fetch(
      `https://classes.cornell.edu/api/2.0/search/classes.json?roster=SP25&subject=${subject}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Find the specific course in the API response by matching the catalogNbr
    const courseData = data?.data?.classes?.find(
      (course: Course) => Number(course.catalogNbr) === catalogNbr
    );

    if (!courseData) {
      console.warn(`Course ${subject} ${catalogNbr} not found in API response`);
      return {};
    }

    // Extract the relevant information
    const details: Partial<Course> = {};

    // Get description
    if (courseData.description) {
      details.description = courseData.description;
    }

    // Get credits from the first enroll group
    if (courseData.enrollGroups && courseData.enrollGroups.length > 0) {
      details.credits = courseData.enrollGroups[0].unitsMinimum;
    }

    // Get when offered information
    if (courseData.catalogWhenOffered) {
      details.whenOffered = courseData.catalogWhenOffered;
    }

    // Get instructors from the first meeting of the first class section of the first enroll group
    if (
      courseData.enrollGroups &&
      courseData.enrollGroups.length > 0 &&
      courseData.enrollGroups[0].classSections &&
      courseData.enrollGroups[0].classSections.length > 0 &&
      courseData.enrollGroups[0].classSections[0].meetings &&
      courseData.enrollGroups[0].classSections[0].meetings.length > 0 &&
      courseData.enrollGroups[0].classSections[0].meetings[0].instructors
    ) {
      const instructorsData =
        courseData.enrollGroups[0].classSections[0].meetings[0].instructors;
      details.instructors = instructorsData.map((instructor: Instructor) => ({
        firstName: instructor.firstName,
        lastName: instructor.lastName,
        netid: instructor.netid
      }));
    }

    return details;
  } catch (error) {
    console.error("Error fetching course details:", error);
    return {};
  }
};
