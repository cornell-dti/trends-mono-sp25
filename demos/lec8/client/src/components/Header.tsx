import { useState } from "react";
import { signIn, signOut } from "../auth/auth";
import { useAuth } from "../auth/AuthUserProvider";

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const { user } = useAuth();

  const handleLoginClick = async () => {
    if (isLoggedIn) {
      await signOut();
    } else {
      await signIn();
    }

    setIsLoggedIn(!isLoggedIn);
  };

  return (
    <div
      style={{
        width: "90vw",
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
      }}
    >
      {isLoggedIn && <p>Hello, {user?.displayName}</p>}
      <button onClick={handleLoginClick}>
        {isLoggedIn ? "Sign Out" : "Log In"}
      </button>
    </div>
  );
};

export default Header;
