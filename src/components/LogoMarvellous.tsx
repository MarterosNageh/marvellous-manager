
import React from "react";
import { useDarkMode } from "@/hooks/use-dark-mode";
import Image from "Logos";

/**
 * Renders the Marvellous Studios logo that auto switches between black/white variant based on color scheme.
 */
const LogoMarvellous = ({
  className = "h-12 w-auto"
}: {
  className?: string;
}) => {
  const isDark = useDarkMode();
  const logoSrc = isDark ? "/logo-marvellous-white.png" : "/logo-marvellous-black.png";
  const alt = "Marvellous Studios Logo";
  
  return (
    <Image 
      src={logoSrc} 
      alt={alt} 
      className={className} 
    />
  );
};

export default LogoMarvellous;
