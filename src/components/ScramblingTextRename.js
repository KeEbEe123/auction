import React, { useEffect, useRef } from "react";

const ScramblingTextRename = ({ text }) => {
  const textRef = useRef(null);
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; // Letters + Numbers

  useEffect(() => {
    const targetText = String(text); // Convert input to a string
    let iteration = 0;
    let interval = null;

    const scrambleText = () => {
      textRef.current.innerText = targetText
        .split("")
        .map((char, index) => {
          if (index < iteration) {
            return targetText[index]; // Preserve resolved characters
          }
          // Select random characters matching the type of the original character
          return /[0-9]/.test(char) // Check if it's a number
            ? Math.floor(Math.random() * 10) // Generate random number
            : characters[Math.floor(Math.random() * characters.length)];
        })
        .join("");

      if (iteration >= targetText.length) {
        clearInterval(interval);
      }

      iteration += 1 / 3; // Adjust speed of resolution
    };

    interval = setInterval(scrambleText, 30);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [text]);

  return (
    <span
      ref={textRef}
      className="text-6xl text-transparent bg-clip-text bg-gradient-to-t from-blue-700 to-blue-300 font-amsterdam mb-2"
    >
      {String(text)}
    </span>
  );
};

export default ScramblingTextRename;
