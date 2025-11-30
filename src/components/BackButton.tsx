interface BackButtonProps {
  onClick: () => void;
}

export default function BackButton({ onClick }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        zIndex: 30,
        color: "white",
        top: "2rem",
        left: "2rem",
        fontSize: "1rem",
        fontFamily: "Times Newer Roman:Regular, sans-serif",
        background: "none",
        border: "none",
        outline: "none",
        cursor: "pointer",
      }}
    >
      ← Back
    </button>
  );
}
