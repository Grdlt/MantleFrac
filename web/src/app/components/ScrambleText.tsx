"use client";

import { useEffect, useRef, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";

interface ScrambleTextProps {
    text: string;
    className?: string;
    scrambleSpeed?: number;
    revealSpeed?: number;
    startDelay?: number;
}

export function ScrambleText({
    text,
    className = "",
    scrambleSpeed = 30,
    revealSpeed = 50,
    startDelay = 0,
}: ScrambleTextProps) {
    const [displayText, setDisplayText] = useState("");
    const [isDone, setIsDone] = useState(false);
    const frameRef = useRef<number>(0);
    const iterationRef = useRef<number>(0);

    useEffect(() => {


        // Initial random string of same length
        setDisplayText(
            text
                .split("")
                .map(() => CHARS[Math.floor(Math.random() * CHARS.length)])
                .join("")
        );

        const startScramble = () => {
            const animate = () => {
                setDisplayText((prev) =>
                    prev
                        .split("")
                        .map((char, index) => {
                            if (index < iterationRef.current) {
                                return text[index];
                            }
                            return CHARS[Math.floor(Math.random() * CHARS.length)];
                        })
                        .join("")
                );

                if (iterationRef.current >= text.length) {
                    setIsDone(true);
                    return;
                }

                iterationRef.current += 1 / 3; // Slow down the reveal
                frameRef.current = requestAnimationFrame(animate);
            };

            animate();
        };

        const timeoutId = setTimeout(startScramble, startDelay);

        return () => {
            clearTimeout(timeoutId);
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [text, startDelay]);

    return (
        <span className={className}>
            {displayText}
        </span>
    );
}
