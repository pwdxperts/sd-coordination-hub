"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle } from "lucide-react";

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

      document.cookie = `session=${data.token || "active"}; path=/; max-age=28800`;

      if (data.mfaRequired) {
        router.push(`/login/mfa?userId=${data.userId}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* LEFT — Light info panel */}
      <div className="hidden lg:flex lg:w-[440px] bg-gradient-to-b from-slate-50 to-gray-50 flex-col justify-center p-10 border-r border-gray-100">
        <div className="mb-10">
          <img src="/logo.jpg" alt="CoGTA" className="h-16 w-auto object-contain mb-6" />
          <h1 className="text-xl font-bold text-gray-900 leading-snug mb-1">
            National Service Delivery<br />Coordination Hub
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            CoGTA&apos;s central platform for tracking and coordinating service delivery interventions.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-600">Multi-channel case intake, verification, and classification</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-600">Provincial &amp; municipal escalation management and tracking</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-600">Role-based secure access for national, provincial and municipal users</span>
          </div>
          <p className="text-[10px] text-gray-400 pt-6">
            &copy; {new Date().getFullYear()} Department of Cooperative Governance &mdash; Republic of South Africa
          </p>
        </div>
      </div>

      {/* RIGHT — Login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <img src="/logo.jpg" alt="CoGTA" className="h-14 w-auto object-contain mx-auto mb-4" />
          </div>

          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="px-8 pt-8 pb-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">Secure Access</p>
              <h2 className="text-lg font-bold text-gray-900">Sign In</h2>
              <p className="text-sm text-gray-400 mt-0.5">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="px-8 pb-8 pt-4 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none pr-10"
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
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-[10px] text-gray-400 mt-4">
            Authorized Access Only &mdash; Republic of South Africa
          </p>
        </div>
      </div>
    </div>
  );
}
