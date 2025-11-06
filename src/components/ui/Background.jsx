import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";

export default function Background() {
  const { pathname } = useLocation();

  // sicher aus LocalStorage lesen (ohne Crash bei leerem Wert)
  const isLoggedIn = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      return !!u?.token;
    } catch {
      return false;
    }
  }, []);

  // Login-ähnliche Routen + Root (falls dort die Login-View gezeigt wird)
  const isLoginLikePath =
    pathname === "/" ||
    pathname === "/auth" ||
    pathname === "/login" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/login/");

  // Nur auf Login-Seiten ODER wenn nicht eingeloggt auf der Root
  const showLoginBg = !isLoggedIn && isLoginLikePath;

  return (
    <div
      className={`
        fixed w-screen z-[-1] h-screen min-h-screen
        bg-gradient-to-b from-slate-100 to-slate-200
        dark:from-neutral-900 dark:to-neutral-800
        transition-colors duration-300
      `}
    >
      {showLoginBg && (
        <div id="bg-wrap" className="fixed inset-0 z-[-1] bg-neutral-900">
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="Gradient1" cx="50%" cy="50%" fx="0%" fy="50%" r=".6">
                <animate attributeName="fx" dur="32s" values="0%;3%;0%" repeatCount="indefinite" />
                <stop offset="0%" stopColor="rgba(16,185,129,0.6)" />
                <stop offset="100%" stopColor="rgba(16,185,129,0)" />
              </radialGradient>

              <radialGradient id="Gradient2" cx="50%" cy="50%" fx="3%" fy="50%" r=".6">
                <animate attributeName="fx" dur="25s" values="0%;3%;0%" repeatCount="indefinite" />
                <stop offset="0%" stopColor="rgba(139,92,246,0.5)" />
                <stop offset="100%" stopColor="rgba(139,92,246,0)" />
              </radialGradient>

              <radialGradient id="Gradient3" cx="50%" cy="50%" fx="1%" fy="50%" r=".6">
                <animate attributeName="fx" dur="28s" values="0%;4%;0%" repeatCount="indefinite" />
                <stop offset="0%" stopColor="rgba(6,182,212,0.5)" />
                <stop offset="100%" stopColor="rgba(6,182,212,0)" />
              </radialGradient>
            </defs>

            <rect x="10%" y="5%" width="100%" height="100%" fill="url(#Gradient1)" transform="rotate(320 50 50)">
              <animate attributeName="x" dur="22s" values="20%;0%;20%" repeatCount="indefinite" />
              <animate attributeName="y" dur="24s" values="0%;20%;0%" repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="20s" repeatCount="indefinite" />
            </rect>

            <rect x="-5%" y="30%" width="100%" height="100%" fill="url(#Gradient2)" transform="rotate(250 50 50)">
              <animate attributeName="x" dur="26s" values="-20%;0%;-20%" repeatCount="indefinite" />
              <animate attributeName="y" dur="28s" values="0%;30%;0%" repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="18s" repeatCount="indefinite" />
            </rect>

            <rect x="5%" y="10%" width="100%" height="100%" fill="url(#Gradient3)" transform="rotate(140 50 50)">
              <animate attributeName="x" dur="24s" values="0%;20%;0%" repeatCount="indefinite" />
              <animate attributeName="y" dur="20s" values="0%;25%;0%" repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="16s" repeatCount="indefinite" />
            </rect>
          </svg>
        </div>
      )}
    </div>
  );
}