import { useState } from "react";

type SlideToggleProps = {
  label: string;
  onChange: (val: boolean) => void;
};

const SlideToggle = ({ label, onChange }: SlideToggleProps) => {
  const [on, setOn] = useState(false);
  return (
    <div className="toggle-container">
      <div
        className={`toggle-switch ${on ? "on" : "off"}`}
        onClick={() => {
          onChange(!on);
          setOn((prev) => !prev);
        }}
      >
        <div className="toggle-circle"></div>
      </div>
      <p>{label}</p>
    </div>
  );
};

export default SlideToggle;
