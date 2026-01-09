"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";
import Header from "./Header";
import { useState, useEffect } from "react";

export default function ConditionalHeader() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial hydration, render nothing to prevent mismatch
  if (!mounted) {
    return null;
  }

  // Hide header on home page when not logged in (fullscreen HomePage)
  if (pathname === "/" && !isLoggedIn) {
    return null;
  }

  return <Header />;
}
