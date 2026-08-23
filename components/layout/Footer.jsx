import Link from "next/link";
import { AGENCY, FOOTER_NAV, SITE } from "@/config/site";

import { Container } from "@/components/common/Container";
import { Logo } from "@/components/Logo";

export function Footer() {
  const year = new Date().getUTCFullYear();

  return (
    <footer className="border-border/60 mt-24 border-t">
      <Container size="wide" className="py-12">
        <div className="grid gap-10 md:grid-cols-[1.6fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="text-muted-foreground mt-4 max-w-xs text-sm">
              {SITE.description}
            </p>
          </div>
          {FOOTER_NAV.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold">{group.title}</h3>
              <ul className="mt-3 space-y-2.5">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-border/60 text-muted-foreground mt-10 flex flex-col items-center gap-3 border-t pt-6 text-xs sm:flex-row sm:justify-between">
          <p>
            © {year} {SITE.name}. {SITE.tagline}
          </p>
          <div className="flex items-center gap-3">
            <span>Commitments are real. Play responsibly.</span>
            <span className="text-border hidden sm:inline" aria-hidden>
              ·
            </span>
            <span>
              Crafted by{" "}
              <Link
                href={AGENCY.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/80 hover:text-primary font-medium transition-colors"
              >
                {AGENCY.name}
              </Link>
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
