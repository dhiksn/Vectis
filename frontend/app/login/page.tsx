"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, User, AlertCircle } from "lucide-react";
import { KeyButton } from "@/components/ui/KeyButton";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.login(username, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4 selection:bg-accent/30 selection:text-ink">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded bg-accent flex items-center justify-center text-accent-ink font-display font-bold text-lg mx-auto mb-3 shadow-md">
            VC
          </div>
          <h1 className="font-display font-semibold text-xl text-ink tracking-tight">
            VECTIS
          </h1>
          <p className="font-mono text-xs text-muted mt-1 uppercase tracking-wider">
            COBALT VPS CONTROL GATEWAY
          </p>
        </div>

        {/* Login Box */}
        <div className="cut p-6 bg-paper-2 border-rule shadow-lg">
          {error && (
            <div className="cut p-3 mb-4 bg-error/10 border-error/30 text-error text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-display font-medium text-muted uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-paper border border-rule rounded text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent font-display transition-colors"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-display font-medium text-muted uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-paper border border-rule rounded text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent font-display transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <KeyButton
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading}
              >
                <ShieldCheck size={16} />
                <span>{loading ? "Authenticating..." : "Sign In to Control Center"}</span>
              </KeyButton>
            </div>
          </form>

          <div className="mt-4 pt-4 border-t border-rule text-center">
            <span className="text-[11px] text-muted font-mono">
              Protected by bcrypt + HTTP-Only JWT Session
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
