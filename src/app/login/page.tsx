"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 login-bg-pattern">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-50/60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-100/40 blur-3xl" />
        {/* Subtle flag watermark */}
        <div className="absolute bottom-10 left-10 opacity-[0.03]">
          <svg width="200" height="140" viewBox="0 0 100 70">
            <rect width="100" height="14" fill="#006b3f"/>
            <rect y="14" width="100" height="14" fill="#ffb612"/>
            <rect y="28" width="100" height="14" fill="#000000"/>
            <rect y="42" width="100" height="14" fill="#ffffff"/>
            <rect y="56" width="100" height="14" fill="#de3535"/>
          </svg>
        </div>
      </div>

      <div className="relative w-full max-w-[440px]">
        {/* Flag accent bar at top */}
        <div className="flag-bar rounded-t-xl" />

        {/* Login Card */}
        <div className="bg-white rounded-b-xl rounded-tr-xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header with Coat of Arms */}
          <div className="px-8 pt-10 pb-6 text-center">
            {/* South African Coat of Arms SVG */}
            <div className="mx-auto mb-5 w-24 h-24">
              <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Eagle with spread wings */}
                <g transform="translate(100, 25)">
                  {/* Wings */}
                  <path d="M-70 10 C-85 -15 -55 -35 -35 -25 C-25 -20 -15 -10 -8 -2 L-70 10Z" fill="#FFB612" stroke="#000" strokeWidth="0.5"/>
                  <path d="M70 10 C85 -15 55 -35 35 -25 C25 -20 15 -10 8 -2 L70 10Z" fill="#FFB612" stroke="#000" strokeWidth="0.5"/>
                  {/* Eagle body */}
                  <ellipse cx="0" cy="5" rx="8" ry="14" fill="#FFB612" stroke="#000" strokeWidth="0.5"/>
                  {/* Head */}
                  <circle cx="0" cy="-12" r="5" fill="#000"/>
                  {/* Eye */}
                  <circle cx="1.5" cy="-13" r="1.5" fill="white"/>
                  <circle cx="1.5" cy="-13" r="0.7" fill="#000"/>
                  {/* Beak */}
                  <path d="M0 -8 L-2 -5 L2 -5Z" fill="#FFB612"/>
                </g>

                {/* Shield */}
                <g transform="translate(100, 68)">
                  <path d="M-22 -25 L22 -25 L28 10 C28 25 0 40 0 40 C0 40 -28 25 -28 10Z" fill="#006b3f" stroke="#000" strokeWidth="0.8"/>
                  {/* Shield inner - left figure */}
                  <path d="M-15 -10 C-15 -10 -10 -5 -10 0 C-10 8 -20 8 -20 0 C-20 -5 -15 -10 -15 -10Z" fill="#FFB612" stroke="#000" strokeWidth="0.3"/>
                  {/* Shield inner - right figure */}
                  <path d="M15 -10 C15 -10 10 -5 10 0 C10 8 20 8 20 0 C20 -5 15 -10 15 -10Z" fill="#FFB612" stroke="#000" strokeWidth="0.3"/>
                  {/* Shield divider */}
                  <line x1="-28" y1="-5" x2="28" y2="-5" stroke="#000" strokeWidth="0.5"/>
                  {/* Small dots on shield */}
                  <circle cx="-8" cy="12" r="1" fill="#FFB612"/>
                  <circle cx="8" cy="12" r="1" fill="#FFB612"/>
                  <circle cx="0" cy="18" r="1" fill="#FFB612"/>
                </g>

                {/* Spears crossed behind shield */}
                <g transform="translate(100, 68)">
                  <line x1="-45" y1="35" x2="15" y2="-30" stroke="#006b3f" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="45" y1="35" x2="-15" y2="-30" stroke="#006b3f" strokeWidth="2.5" strokeLinecap="round"/>
                  {/* Spear tips */}
                  <circle cx="15" cy="-30" r="2" fill="#FFB612"/>
                  <circle cx="-15" cy="-30" r="2" fill="#FFB612"/>
                </g>

                {/* Wheat stalks */}
                <g transform="translate(100, 115)">
                  {/* Left stalk */}
                  <path d="M-30 0 C-35 -10 -45 -15 -50 -25" stroke="#FFB612" strokeWidth="1.5" fill="none"/>
                  <path d="M-30 0 C-25 -10 -15 -15 -10 -25" stroke="#FFB612" strokeWidth="1.5" fill="none"/>
                  <circle cx="-50" cy="-25" r="2" fill="#FFB612"/>
                  <circle cx="-10" cy="-25" r="2" fill="#FFB612"/>
                  {/* Right stalk */}
                  <path d="M30 0 C35 -10 45 -15 50 -25" stroke="#FFB612" strokeWidth="1.5" fill="none"/>
                  <path d="M30 0 C25 -10 15 -15 10 -25" stroke="#FFB612" strokeWidth="1.5" fill="none"/>
                  <circle cx="50" cy="-25" r="2" fill="#FFB612"/>
                  <circle cx="10" cy="-25" r="2" fill="#FFB612"/>
                  {/* Center dot */}
                  <circle cx="0" cy="2" r="1.5" fill="#FFB612"/>
                </g>

                {/* Banner at bottom */}
                <g transform="translate(100, 152)">
                  <path d="M-55 0 C-55 -8 55 -8 55 0 C55 8 -55 8 -55 0Z" fill="#FFB612" stroke="#000" strokeWidth="0.5"/>
                  {/* Text lines on banner */}
                  <text x="0" y="2" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#006b3f" fontFamily="serif">!KE E: /XARRA //KE</text>
                </g>

                {/* Outward rays/starburst from center */}
                <g opacity="0.3">
                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => {
                    const rad = angle * Math.PI / 180;
                    const x1 = 100 + Math.cos(rad) * 55;
                    const y1 = 90 + Math.sin(rad) * 55;
                    const x2 = 100 + Math.cos(rad) * 70;
                    const y2 = 90 + Math.sin(rad) * 70;
                    return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFB612" strokeWidth="1"/>;
                  })}
                </g>

                {/* Outer ring */}
                <circle cx="100" cy="85" r="68" fill="none" stroke="#FFB612" strokeWidth="1" opacity="0.4"/>
                <circle cx="100" cy="85" r="72" fill="none" stroke="#FFB612" strokeWidth="0.5" opacity="0.2"/>
              </svg>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-700 mb-1">
              Republic of South Africa
            </p>
            <p className="text-sm font-medium text-gray-600">
              Department of Cooperative Governance
            </p>
            <h1 className="mt-2 text-xl font-bold text-blue-900 leading-tight">
              National Service Delivery<br/>Coordination Hub
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-medium tracking-wider uppercase">
              War Room Command Centre
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@cogta.gov.za"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-700 to-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:from-blue-800 hover:to-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-6">
            <div className="border-t border-gray-100 pt-4 text-center">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Secure Platform &bull; Authorized Access Only
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Republic of South Africa &copy; {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
