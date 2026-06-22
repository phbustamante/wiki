import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import logo from "@/assets/jimi-logo.png";

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#1B75D2] shadow-soft">
        <div className="flex h-28 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-4 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <img
              src={logo}
              alt="jimiiot"
              className="h-20 w-20 object-contain sm:h-28 sm:w-28"
            />
            <span className="hidden text-xl font-bold tracking-tight text-white sm:block">
              Central de Automação JIMI
            </span>
          </Link>

          <ThemeToggle />
        </div>
      </header>

      <main
        key={pathname}
        className="mx-auto max-w-6xl animate-fade-in px-4 py-8 sm:px-6 sm:py-10"
      >
        {children}
      </main>
    </div>
  );
}
