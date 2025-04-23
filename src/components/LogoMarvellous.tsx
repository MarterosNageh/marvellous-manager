
import React from "react";

// Simple SVG logo, can be replaced with your assets
const LogoMarvellous = ({ className = "h-8 w-auto" }) => (
  <img
    src="/logo-marvellous.svg"
    alt="Marvellous Logo"
    className={className}
    style={{ maxHeight: 48 }}
    onError={(e) => {
      // fallback if image not found
      (e.target as HTMLElement).outerHTML = '<span style="font-weight:bold;font-size:1.3em">M</span>';
    }}
  />
);

export default LogoMarvellous;
