"use client";

import { useEffect, useState } from "react";

type Props = {
  text: string;
  corruptLevel?: number; // 0-10
  className?: string;
};

const GLITCH_CHARS = "　░▒▓█│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀";

export function CorruptedText({ text, corruptLevel = 0, className = "" }: Props) {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    if (corruptLevel <= 0) {
      setDisplayText(text);
      return;
    }

    const interval = setInterval(() => {
      const chars = text.split("");
      const corrupted = chars.map((char) => {
        if (char === "\n" || char === " ") return char;
        const roll = Math.random();
        if (roll < corruptLevel * 0.02) {
          return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        }
        return char;
      });
      setDisplayText(corrupted.join(""));
    }, 200);

    return () => clearInterval(interval);
  }, [text, corruptLevel]);

  return (
    <span className={className}>
      {displayText}
    </span>
  );
}
