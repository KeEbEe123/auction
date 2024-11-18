import React from "react";
import globe from "../images/globe.png";

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-full">
      <img
        src={globe}
        alt="Loading spinner"
        className="animate-spin w-16 h-16"
      ></img>
    </div>
  );
}

export default LoadingSpinner;
