import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Loader2, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Mode = "signin" | "signup";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate("/", { replace: true });
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Account created! You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/`,
      });
      if (result.error) throw result.error;
      // If not redirected, session is already set; auth listener will navigate.
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      toast.error(msg);
      setGoogleLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={20} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[380px]"
      >
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center shadow-lg">
            <Activity size={22} className="text-background" strokeWidth={2.25} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight lowercase">ada</h1>
          <p className="text-[12px] uppercase tracking-[0.2em] text-muted-foreground">
            Trading Journal
          </p>
        </div>

        <div className="surface-card p-6 md:p-7 space-y-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <h2 className="text-[20px] font-semibold tracking-tight">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-[13px] text-muted-foreground mt-1">
                {mode === "signin"
                  ? "Sign in to access your trades anywhere"
                  : "Start tracking your trades with cloud sync"}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full h-11 rounded-xl border border-border bg-background hover:bg-muted/60 transition-colors flex items-center justify-center gap-2.5 text-[13.5px] font-medium disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2c-2 1.4-4.5 2.3-7.3 2.3-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.3 5.2C41.9 35 44 29.9 44 24c0-1.3-.1-2.3-.4-3.5z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-background text-[14px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
              />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 characters)"
                className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-background text-[14px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-xl bg-foreground text-background text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="text-center text-[12.5px] text-muted-foreground">
            {mode === "signin" ? "New to ada? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-foreground font-medium hover:underline underline-offset-2"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/70 mt-6">
          Your trades are private. Only you can see your data.
        </p>
      </motion.div>
    </div>
  );
}
