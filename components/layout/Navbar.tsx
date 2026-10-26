import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Search, User } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

type Props = {
  activePath?: string;
  userEmail?: string | null;
  showUserActions?: boolean;
};

export function Navbar({ activePath, userEmail, showUserActions = true }: Props) {
  const isAppNav = Boolean(activePath);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Find Jobs", href: "/find-jobs", icon: Search },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <header className="h-16 w-full bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Image
            src="/logo.png"
            alt="JobPilot"
            width={120}
            height={32}
            className="h-8 w-auto object-contain"
            style={{ width: "auto" }}
            priority
          />
        </Link>

        {isAppNav ? (
          <div className="flex items-center h-full gap-2 sm:gap-4 md:gap-6">
            {/* App Navigation Tabs */}
            <nav className="flex items-center h-full gap-2 sm:gap-6 md:gap-8">
              {navItems.map((item) => {
                const isActive = activePath === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`h-full flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-colors border-b-2 ${
                      isActive
                        ? "border-accent text-accent"
                        : "border-transparent text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Language Switcher & Authenticated User Actions */}
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-border h-8">
              <LanguageSwitcher />
              {showUserActions && (
                <>
                  {userEmail && (
                    <span className="text-xs text-text-secondary hidden xl:inline-block max-w-[160px] truncate">
                      {userEmail}
                    </span>
                  )}
                  <SignOutButton className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-text-secondary hover:text-text-primary border border-border bg-surface hover:bg-surface-secondary transition-colors cursor-pointer" />
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => {
                const isActive = activePath === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-medium transition-colors ${
                      isActive
                        ? "text-accent"
                        : "text-text-dark hover:text-accent"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Link
                href="/login"
                className="bg-text-darkest text-surface rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Start for free
              </Link>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
