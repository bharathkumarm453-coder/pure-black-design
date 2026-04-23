import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import SplashScreen from "./components/SplashScreen";

const queryClient = new QueryClient();

const SPLASH_KEY = "ada_splash_shown";

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem(SPLASH_KEY);
  });
  const [splashDone, setSplashDone] = useState(!showSplash);

  useEffect(() => {
    if (!showSplash) return;
    sessionStorage.setItem(SPLASH_KEY, "1");
  }, [showSplash]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange={false}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AnimatePresence mode="wait">
            {showSplash && !splashDone && (
              <SplashScreen
                key="splash"
                onComplete={() => {
                  setSplashDone(true);
                  setTimeout(() => setShowSplash(false), 500);
                }}
              />
            )}
          </AnimatePresence>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
