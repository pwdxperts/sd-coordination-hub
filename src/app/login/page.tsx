"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, ShieldCheck, Activity, MapPin, TrendingUp, Bell } from "lucide-react";

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

      // Store session
      document.cookie = `session=${data.token || "active"}; path=/; max-age=28800`;

      // Check if MFA is required
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
    <div className="min-h-screen flex login-bg-pattern">
      {/* LEFT — Information Panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Top content */}
        <div className="relative z-10 p-10 xl:p-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <img src="/logo.jpg" alt="CoGTA" className="h-10 w-auto object-contain rounded" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Department of Cooperative Governance</p>
              <p className="text-lg font-bold">NSDCH</p>
            </div>
          </div>

          <h1 className="text-2xl xl:text-3xl font-bold leading-tight mb-4">
            National Service Delivery<br />Coordination Hub
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed mb-8">
            A centralised platform for tracking, managing, and coordinating service delivery 
            interventions across all provinces, municipalities, and sectors in South Africa.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <Activity className="w-5 h-5 text-blue-300 mb-2" />
              <p className="text-2xl font-bold">9</p>
              <p className="text-xs text-blue-200">Provinces Monitored</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <MapPin className="w-5 h-5 text-blue-300 mb-2" />
              <p className="text-2xl font-bold">257</p>
              <p className="text-xs text-blue-200">Municipalities</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <TrendingUp className="w-5 h-5 text-blue-300 mb-2" />
              <p className="text-2xl font-bold">30+</p>
              <p className="text-xs text-blue-200">Active Cases</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <Bell className="w-5 h-5 text-blue-300 mb-2" />
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-xs text-blue-200">Real-time Monitoring</p>
            </div>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-1 h-1 rounded-full bg-blue-300" />
              <span className="text-sm text-blue-100">Real-time case intake from WhatsApp, email & social media</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-1 h-1 rounded-full bg-blue-300" />
              <span className="text-sm text-blue-100">Multi-level escalation: Municipal → Provincial → National → Ministerial</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-1 h-1 rounded-full bg-blue-300" />
              <span className="text-sm text-blue-100">Role-based access: Public, Analysts, Coordinators, Executives, Admin</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-1 h-1 rounded-full bg-blue-300" />
              <span className="text-sm text-blue-100">Geographic visualisation & sector-based performance tracking</span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 p-10 xl:p-12 border-t border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-0.5">
              <div className="w-6 h-1 bg-red-500 rounded-sm" />
              <div className="w-6 h-1 bg-white rounded-sm" />
              <div className="w-6 h-1 bg-blue-500 rounded-sm" />
              <div className="w-6 h-1 bg-green-600 rounded-sm" />
              <div className="w-6 h-1 bg-yellow-500 rounded-sm" />
            </div>
            <span className="text-xs text-blue-300">Republic of South Africa</span>
          </div>
          <p className="text-[11px] text-blue-400/70">
            &copy; {new Date().getFullYear()} Department of Cooperative Governance. All rights reserved.<br />
            Secure Platform &mdash; Authorized Access Only
          </p>
        </div>
      </div>

      {/* RIGHT — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo — visible only on small screens */}
          <div className="lg:hidden text-center mb-8">
            <img src="/logo.jpg" alt="CoGTA" className="h-12 w-auto object-contain mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900">Service Delivery Hub</h2>
            <p className="text-sm text-gray-500">Sign in to access the platform</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-8 pb-4">
              <div className="hidden lg:block mb-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
                  Secure Access
                </p>
                <h2 className="text-xl font-bold text-gray-900">Sign In</h2>
                <p className="text-sm text-gray-500 mt-1">Enter your credentials to access the platform</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all pr-10"
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
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-600/25"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Republic of South Africa &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}