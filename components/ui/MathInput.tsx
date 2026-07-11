"use client";

import React, { useEffect, useRef } from "react";

// Safely import MathLive only on the client side
if (typeof window !== "undefined") {
  import("mathlive").then((mathlive) => {
    // FIX: Use self-hosted fonts from the Next.js public directory.
    // This completely bypasses CORS and 404 CDN issues.
    mathlive.MathfieldElement.fontsDirectory = "/mathlive-fonts";
  });
}

export interface MathInputProps {
  value: string;
  onChange: (latex: string) => void;
  placeholder?: string;
  className?: string;
}

export const MathInput: React.FC<MathInputProps> = ({
  value = "",
  onChange,
  placeholder = "Nhập công thức toán học...",
  className = "",
}) => {
  const mfRef = useRef<any>(null);

  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;

    // Prevent cursor jumping by only updating if values differ
    if (mf.value !== value) {
      mf.value = value;
    }

    const handleInput = (e: any) => {
      onChange(e.target.value);
    };

    mf.addEventListener("input", handleInput);
    return () => mf.removeEventListener("input", handleInput);
  }, [value, onChange]);

  return (
    <div className={`math-input-wrapper w-full h-full flex items-center justify-center ${className}`}>
      {/* @ts-ignore - Web component */}
      <math-field ref={mfRef} virtual-keyboard-mode="manual">
        {/* Placeholder logic if needed */}
      </math-field>
    </div>
  );
};

export default MathInput;
