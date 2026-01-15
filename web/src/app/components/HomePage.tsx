"use client";

import { useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  targetAlpha: number;
}

import { ScrambleText } from "./ScrambleText";

export default function HomePage({ onConnect }: { onConnect: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div className="relative min-h-screen bg-[#08080c] overflow-hidden">
      {/* Custom Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-deep-drift"
        style={{
          backgroundImage: 'url(/background_v3.png)',
          filter: 'contrast(1.3) brightness(1.5)',
          opacity: 1
        }}
      />

      {/* Overlay removed for maximum visibility */}

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-neutral-400 font-medium">
              <ScrambleText text="Live on Mantle Sepolia Testnet" />
            </span>
          </div>

          {/* Logo */}
          <div className="mb-8 select-none">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter cursor-default">
              <span className="text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.15)] inline-block">
                {"Mantle".split("").map((char, i) => (
                  <span
                    key={`mantle-${i}`}
                    className="animate-jump-in inline-block hover:animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {char}
                  </span>
                ))}
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary drop-shadow-[0_0_30px_var(--color-primary)] inline-block">
                {"Frac".split("").map((char, i) => (
                  <span
                    key={`frac-${i}`}
                    className="animate-jump-in inline-block hover:animate-bounce"
                    style={{ animationDelay: `${(i + 6) * 0.1}s` }}
                  >
                    {char}
                  </span>
                ))}
              </span>
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-xl md:text-2xl lg:text-3xl text-neutral-300 font-light mb-4 max-w-2xl mx-auto leading-relaxed h-[3.5rem] flex items-center justify-center">
            <ScrambleText
              text="Turn NFTs into Liquid Assets"
              className="inline-block"
              startDelay={500}
            />
          </p>

          <p className="text-neutral-500 mb-12 max-w-xl mx-auto h-6 flex items-center justify-center">
            <ScrambleText
              text="Fractionalize and trade instantly on Mantle Network."
              className="inline-block"
              startDelay={1500}
              scrambleSpeed={20}
            />
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              onClick={onConnect}
              size="lg"
              variant="gradient"
              className="text-lg px-12 py-7 font-bold rounded-full shadow-[0_0_40px_-10px_var(--color-primary)] hover:shadow-[0_0_60px_-10px_var(--color-secondary)] transition-all hover:scale-105"
            >
              Connect Wallet
            </Button>
          </div>


          {/* Stats removed as requested */}

        </div>

        {/* Footer */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-neutral-600 text-xs font-mono uppercase tracking-widest">
            Powered by Mantle Network
          </p>
        </div>
      </div>
    </div>
  );
}
