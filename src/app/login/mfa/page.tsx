"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MfaPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Get user info from cookie
    const cookies = document.cookie.split(";").reduce((acc: Record<string, string>, c) => {
      const [key, val] = c.trim().split("=");
      acc[key] = val;
      return acc;
    }, {});
    if (!cookies.session) {
      router.push("/login");
    }
    try {
      const session = JSON.parse(atob(cookies.session));
      setUserName(session.role?.replace(/_/g, " ") || "User");
    } catch {
      router.push("/login");
    }
  }, [router]);

  const handleCodeChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`mfa-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit on full code
    if (newCode.every((d) => d !== "")) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`mfa-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (token: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Invalid verification code");
        setCode(["", "", "", "", "", ""]);
        document.getElementById("mfa-0")?.focus();
      }
    } catch {
      setError("Connection error");
    }
    setLoading(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    if (/^\d{6}$/.test(text)) {
      const digits = text.split("");
      setCode(digits);
      handleVerify(text);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 login-bg-pattern">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 right-0 w-96 h-96 rounded-full bg-blue-50/60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-amber-50/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px]">
        <div className="flag-bar rounded-t-xl" />

        <div className="bg-white rounded-b-xl rounded-tr-xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="px-8 pt-10 pb-6 text-center">
            {/* Shield icon */}
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-100">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h1 className="text-xl font-bold text-gray-900">Two-Factor Authentication</h1>
            <p className="text-sm text-gray-500 mt-1">
              Enter the 6-digit code from your authenticator app
            </p>
            <p className="text-xs text-gray-400 mt-1 capitalize">{userName}</p>
          </div>

          <div className="border-t border-gray-100" />

          <div className="px-8 py-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 text-center">
                {error}
              </div>
            )}

            <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`mfa-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-lg outline-none transition-all ${
                    digit ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
                  } focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <button
              onClick={() => handleVerify(code.join(""))}
              disabled={loading || code.some((d) => d === "")}
              className="w-full py-2.5 bg-gradient-to-r from-blue-700 to-blue-600 text-white rounded-lg font-medium text-sm hover:from-blue-800 hover:to-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying...
                </span>
              ) : (
                "Verify"
              )}
            </button>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  document.cookie = "session=; path=/; max-age=0";
                  router.push("/login");
                }}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Back to login
              </button>
            </div>
          </div>

          <div className="px-8 pb-6">
            <div className="border-t border-gray-100 pt-4 text-center">
              <p className="text-xs text-gray-400">
                Republic of South Africa &copy; {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
