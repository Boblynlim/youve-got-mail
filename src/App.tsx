import { useEffect, useState } from "react";
import { motion } from "motion/react";
import imgBackground from "./assets/background.png";
import imgEnvelope from "./assets/envelope.png";
import imgOpenEnvelope from "./assets/open_envelope.png";
import imgNote from "./assets/note.png";
import { supabase } from "./supabaseClient";
import BackButton from "./components/BackButton";

export default function App() {
  const [frame, setFrame] = useState(1);
  const [page, setPage] = useState("animation"); // "animation", "code-input", or "letter"
  const [code, setCode] = useState(["", "", "", "", "", ""]); // 6-digit code
  const [letterContent, setLetterContent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Frame 1 to Frame 2 after 400ms delay
    const timer1 = setTimeout(() => {
      setFrame(2);
    }, 400);

    // Frame 2 to Frame 3 after 400ms + 800ms (animation) + 400ms delay
    const timer2 = setTimeout(() => {
      setFrame(3);
    }, 400 + 800 + 400);

    // Frame 3 to Frame 4: after envelope slides up (1200ms) + stays visible (1000ms)
    const timer3 = setTimeout(() => {
      setFrame(4);
    }, 400 + 800 + 400 + 1200 + 200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // Animation variants for gentle curve easing
  const gentleEasing = [0.25, 0.1, 0.25, 1]; // Cubic bezier for gentle curve

  // Code input page
  if (page === "code-input") {
    const handleCodeChange = (index: number, value: string) => {
      if (value.length <= 1 && /^\d*$/.test(value)) {
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        setError(""); // Clear error when user types

        // Auto-focus next input
        if (value && index < 5) {
          const nextInput = document.getElementById(`code-${index + 1}`);
          nextInput?.focus();
        }
      }
    };

    const handleKeyDown = (
      index: number,
      e: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (e.key === "Backspace") {
        if (code[index] === "") {
          // Current box is empty, delete previous box and move focus to it
          if (index > 0) {
            e.preventDefault();
            const newCode = [...code];
            newCode[index - 1] = "";
            setCode(newCode);
            const prevInput = document.getElementById(`code-${index - 1}`);
            prevInput?.focus();
          }
        }
        // If current box has a value, the default backspace behavior will clear it
      } else if (e.key === "Enter") {
        // Submit the code when Enter is pressed and all 6 digits are filled
        if (code.join("").length === 6) {
          handleOpenLetter();
        }
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text");
      const digits = pastedData.replace(/\D/g, "").slice(0, 6); // Extract only digits, max 6

      if (digits.length > 0) {
        const newCode = [...code];
        for (let i = 0; i < digits.length && i < 6; i++) {
          newCode[i] = digits[i];
        }
        setCode(newCode);
        setError(""); // Clear error when user pastes

        // Focus the last filled box or the next empty box
        const focusIndex = Math.min(digits.length, 5);
        const targetInput = document.getElementById(`code-${focusIndex}`);
        targetInput?.focus();
      }
    };

    const handleOpenLetter = async () => {
      const enteredCode = code.join("");

      if (enteredCode.length === 6) {
        // Check if code exists in Supabase database
        const { data, error: dbError } = await supabase
          .from("letters")
          .select("message")
          .eq("code", enteredCode)
          .single();

        if (dbError || !data) {
          setError("Invalid code. Please try again.");
        } else {
          setLetterContent(data.message);
          setError("");
          setPage("letter");
        }
      }
    };

    return (
      <div className="relative h-screen w-screen overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 w-full h-full z-0">
          <img
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            src={imgBackground}
          />
        </div>

        <BackButton onClick={() => setPage("animation")} />

        {/* Code input content - styled like page 1 text */}
        <div
          className="absolute flex flex-col font-['Times_Newer_Roman:Regular',sans-serif] leading-[20px] not-italic text-white tracking-[-1px] z-20 px-8"
          style={{
            left: "50%",
            top: "20%",
            width: "calc(100% - 6rem)",
            maxWidth: "340px",
            transform: "translateX(-50%)",
            fontSize: "24px",
          }}
        >
          <p style={{ marginBottom: "6rem", textAlign: "left" }}>
            input the last 6 digits of your phone number to open your letter:
          </p>

          {/* 6 input boxes */}
          <div
            style={{
              display: "flex",
              gap: "0.4rem",
              marginBottom: "2rem",
              justifyContent: "center",
            }}
          >
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                style={{
                  width: "3rem",
                  height: "4.5rem",
                  textAlign: "center",
                  fontSize: "1.25rem",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  border: "1px solid white",
                  borderRadius: ".5rem",
                  color: "white",
                }}
                className="focus:outline-none focus:border-white"
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <p
              className="text-white text-center"
              style={{
                fontSize: "16px",
                marginBottom: "1rem",
                alignSelf: "center",
              }}
            >
              {error}
            </p>
          )}

          {/* Open letter button */}
          <button
            onClick={handleOpenLetter}
            disabled={code.join("").length !== 6}
            style={{
              backgroundColor:
                code.join("").length !== 6
                  ? "rgba(127, 29, 29, 0.5)"
                  : "#b91c1c",
              color:
                code.join("").length !== 6
                  ? "rgba(255, 255, 255, 0.5)"
                  : "#ffffff",
              padding: "1rem 2rem",
              borderRadius: ".5rem",
              fontSize: "20px",
              fontFamily: "Times Newer Roman:Regular, sans-serif",
              cursor: code.join("").length !== 6 ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
              marginTop: "4rem",
              alignSelf: "center",
            }}
            className="hover:bg-red-800"
          >
            Open letter
          </button>
        </div>
      </div>
    );
  }

  // Letter page
  if (page === "letter") {
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        {/* Background image - fills entire screen */}
        <div className="absolute inset-0 w-full h-full">
          <img
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            src={imgBackground}
          />
        </div>

        <BackButton onClick={() => setPage("code-input")} />

        {/* Note image - centered and responsive */}
        <div
          className="absolute z-10"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <img
            alt="Note"
            src={imgNote}
            style={{
              width: "min(600px, 90vw)",
              maxWidth: "95vw",
              maxHeight: "95vh",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>

        {/* Message text container - overlaid on note */}
        <div
          className="absolute z-20"
          style={{
            width: "85vw",
            maxWidth: "380px",
            maxHeight: "70vh",
            left: "50%",
            top: "15%",
            transform: "translateX(-50%)",
            overflow: "auto",
            boxSizing: "border-box",
          }}
        >
          <p
            className="text-center"
            style={{
              fontSize: "clamp(1.5rem, calc(8rem - 5.5vw), 4.5rem)",
              fontFamily: "'Jazs Handwriting', sans-serif",
              lineHeight: ".5",
              letterSpacing: "-0.05em",
              color: "#484B7F",
              padding: "8px",
              whiteSpace: "pre-wrap",
            }}
          >
            {letterContent || "Your message will appear here"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Background image - fills entire screen */}
      <div className="absolute inset-0 w-full h-full">
        <img
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          src={imgBackground}
        />
      </div>

      {/* Frame 1: Animated text - fades in */}
      <motion.div
        className="absolute flex flex-col font-['Times_Newer_Roman:Regular',sans-serif] leading-[20px] not-italic text-white tracking-[-1px] z-20 px-8"
        style={{
          left: "50%",
          top: "64px",
          width: "calc(100% - 6rem)",
          maxWidth: "340px",
          fontSize: "24px",
        }} // width: calc(100% - 4rem) = full width minus px-8 margins
        initial={{ opacity: 0, x: "-50%" }}
        animate={{ opacity: frame >= 2 ? 1 : 0, x: "-50%" }}
        transition={{ duration: 0.8, ease: gentleEasing }}
      >
        <p className="mb-0">{`hi! `}</p>
        <p className="mb-0">&nbsp;</p>
        <p className="mb-0">{`you've got mail `}</p>
        <p className="mb-0">&nbsp;</p>
        <p className="mb-0">{`jaz has too many opinions to keep to herself so here's one about you! :-) `}</p>
      </motion.div>

      {/* Frame 2: Closed envelope - slides up from bottom */}
      <motion.div
        className="absolute z-10"
        style={{ left: "50%" }}
        initial={{ bottom: "-300px", x: "-50%", scale: 1 }}
        animate={{
          bottom: frame >= 3 ? "90px" : "-300px", // Adjust vertical position here
          opacity: frame >= 4 ? 0 : 1,
          x: "-50%",
          scale: 1, // Adjust scale here (1.0 = original, 1.5 = 150%, 2.0 = 200%)
        }}
        transition={{
          bottom: { duration: 0.75, ease: gentleEasing },
          opacity: { duration: 0 }, // Instant disappear
          x: { duration: 0 },
          scale: { duration: 0 },
        }}
      >
        <img
          alt=""
          className="object-contain"
          style={{
            width: "min(300px, 60vw)",
            maxWidth: "400px",
            height: "auto",
          }}
          src={imgEnvelope}
        />
      </motion.div>

      {/* Frame 3: Open envelope container - fades in, center aligned */}
      <motion.div
        className="absolute z-20"
        style={{ bottom: "160px", left: "50%" }} // Adjust vertical position here
        initial={{ opacity: 0, x: "-50%", scale: 1 }}
        animate={{ opacity: frame >= 4 ? 1 : 0, x: "-50%", scale: 1 }}
        transition={{ duration: 0.6, ease: gentleEasing }} // Instant appear
      >
        <img
          alt=""
          className="object-contain"
          style={{
            width: "min(280px, 50vw)",
            maxWidth: "380px",
            height: "auto",
          }}
          src={imgOpenEnvelope}
        />
      </motion.div>

      {/* Frame 4: Tap to read text - fades in */}
      <motion.div
        className="absolute text-white text-center font-['Times_Newer_Roman:Regular',sans-serif] text-[20px] tracking-[-1px] z-30"
        style={{ bottom: "60px", left: "50%" }} // Adjust position here (e.g., bottom: "80px", top: "500px")
        initial={{ opacity: 0, x: "-50%" }}
        animate={{ opacity: frame >= 4 ? 1 : 0, x: "-50%" }}
        transition={{ duration: 0.8, ease: gentleEasing }}
      >
        <p className="mb-0">tap to read</p>
      </motion.div>

      {/* Full screen clickable overlay - appears when tap to read is visible */}
      {frame >= 4 && (
        <div
          className="absolute inset-0 cursor-pointer"
          style={{ zIndex: 9999 }}
          onClick={() => setPage("code-input")}
        />
      )}
    </div>
  );
}
