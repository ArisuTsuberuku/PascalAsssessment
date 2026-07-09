"use client";

import React, { useEffect, useRef } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          readonly?: boolean;
          class?: string;
        },
        HTMLElement
      >;
    }
  }
}

interface MathLiveInputProps {
  value: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
}

export default function MathLiveInput({
  value,
  onChange,
  readOnly,
  placeholder,
  className = "",
}: MathLiveInputProps) {
  const mfRef = useRef<any>(null);

  useEffect(() => {
    import("mathlive").then((ml) => {
      if (typeof window !== "undefined") {
        if ((window as any).mathVirtualKeyboard) {
          (window as any).mathVirtualKeyboard.fontsDirectory =
            "https://unpkg.com/mathlive/dist/fonts";
        }
        if (ml && (ml as any).MathfieldElement) {
          (ml as any).MathfieldElement.fontsDirectory =
            "https://unpkg.com/mathlive/dist/fonts";
        }
      }
    });
  }, []);

  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;

    if (mf.value !== value) {
      mf.value = value || "";
    }
  }, [value]);

  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;

    const handleInput = () => {
      onChange(mf.value);
    };

    mf.addEventListener("input", handleInput);
    return () => mf.removeEventListener("input", handleInput);
  }, [onChange]);

  return (
    <math-field
      ref={mfRef}
      readonly={readOnly ? true : undefined}
      class={`w-full h-full min-h-[36px] bg-white/90 backdrop-blur-sm border border-indigo-400 rounded-md px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
    >
      {value}
    </math-field>
  );
}
