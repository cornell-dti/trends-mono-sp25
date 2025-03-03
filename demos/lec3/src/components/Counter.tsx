import { useState } from "react";

const Counter = () => {
  const [count, setCount] = useState<number>(0);

  return (
    <div>
      <p>Count:</p>
      <button onClick={() => setCount(count + 1)}>{count}</button>
    </div>
  );
};

export default Counter;
