import Link from "next/link";
import Image from "next/image";

type Props = {
  activePath?: string;
};

export function Navbar({ activePath }: Props) {
  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Find Jobs", href: "/find-jobs" },
    { label: "Profile", href: "/profile" },
  ];

  return (
    <header className="h-16 w-full bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto h-full px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
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
          <Link
            href="/login"
            className="bg-text-darkest text-surface rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Start for free
          </Link>
        </div>
      </div>
    </header>
  );
}
