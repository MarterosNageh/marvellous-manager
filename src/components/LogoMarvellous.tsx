import React from "react";

// LogoMarvellous component now supports an optional "minimal" prop.
// When minimal is true, show just the M part (crop via objectPosition).
const LogoMarvellous = ({
  className = "h-8 w-auto",
  minimal = false
}: { className?: string; minimal?: boolean }) => (
  <img
    src="https://raw.githubusercontent.com/MarterosNageh/marvellous-manager/main/public/marvellous-logo-black.png"
    alt="Marvellous Studios Logo"
    className={className}
    style={{
      maxHeight: minimal ? 56 : 68,
      objectFit: minimal ? "cover" : "contain",
      objectPosition: minimal ? "top" : "center"
    }}
    draggable={false}
  />
);

export default LogoMarvellous;