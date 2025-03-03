import { useState } from "react";

type DropdownProps = {
  options: Course[];
  onChange: (value: Course) => void;
};

const getCourseCode = (course: Course) =>
  `${course.subject} ${course.catalogNbr}`;

const Dropdown = ({ options, onChange }: DropdownProps) => {
  const [query, setQuery] = useState("");

  const handleOptionClick = (value: Course) => {
    setQuery("");
    onChange(value);
  };

  const searchOptions = options.filter((option) =>
    getCourseCode(option)
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase())
  );

  return (
    <div className="dropdown">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="courseSearchBar"
      />
      {query.length >= 2 && (
        <div className="dropdownMenu">
          {searchOptions.map((option) => (
            <p
              className="dropdownOption"
              onClick={() => handleOptionClick(option)}
            >
              {getCourseCode(option)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
export default Dropdown;
