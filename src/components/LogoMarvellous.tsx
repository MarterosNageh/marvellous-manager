
import React from "react";

// LogoMarvellous component now supports an optional "minimal" prop.
// When minimal is true, show just the M part (crop via objectPosition).
const LogoMarvellous = ({
  className = "h-8 w-auto",
  minimal = false
}: { className?: string; minimal?: boolean }) => (
  <img
    src="/lovable-uploads/c502e181-7b80-4ce8-9ede-46b793ad5b71.png"
    alt="Marvellous Studios Logo"
    className={className}
    style={{
      maxHeight: minimal ? 36 : 48,
      objectFit: minimal ? "cover" : "contain",
      objectPosition: minimal ? "top" : "center"
    }}
    draggable={false}
  />
);

export default LogoMarvellous;
