"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/config/site";
import { Check, Copy, Mail, Share2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Minimal inline brand marks (lucide dropped brand icons).
function XMark(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}
function WhatsappMark(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Zm-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884Zm8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}
function LinkedinMark(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  );
}
function RedditMark(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M24 11.779c0-1.459-1.192-2.645-2.657-2.645-.715 0-1.363.286-1.84.746-1.81-1.191-4.259-1.949-6.971-2.046l1.483-4.669 4.016.941-.006.058c0 1.193.975 2.163 2.174 2.163 1.198 0 2.172-.97 2.172-2.163s-.975-2.164-2.172-2.164c-.92 0-1.704.574-2.021 1.379l-4.329-1.015a.379.379 0 0 0-.44.26l-1.654 5.208c-2.759.087-5.25.842-7.089 2.043a2.65 2.65 0 0 0-1.84-.746C1.192 9.134 0 10.32 0 11.779c0 .967.526 1.812 1.304 2.273a4.15 4.15 0 0 0-.045.564c0 2.87 3.463 5.203 7.739 5.203 4.276 0 7.74-2.333 7.74-5.203 0-.19-.016-.378-.045-.563.781-.461 1.309-1.306 1.309-2.274Z" />
    </svg>
  );
}
function FacebookMark(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
    </svg>
  );
}

function absoluteUrl(url) {
  if (!url) return SITE.url;
  if (url.startsWith("http")) return url;
  return `${SITE.url}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Share dialog. Copy uses the canonical URL; social options open intent pages.
 * (Analytics events wired in Phase 6.)
 */
export function ShareButton({
  url,
  title = SITE.name,
  message,
  variant = "outline",
  size = "sm",
  label = "Share",
  iconOnly = false,
  className,
}) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const shareUrl = absoluteUrl(url);
  const blurb = message ?? title;
  const withUrl = `${blurb}\n\n${shareUrl}`;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
  }, []);

  async function nativeShare() {
    try {
      await navigator.share({ title, text: blurb, url: shareUrl });
    } catch (error) {
      if (error?.name !== "AbortError")
        toast.error("Couldn't open the share sheet");
    }
  }

  const platforms = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: WhatsappMark,
      href: `https://wa.me/?text=${encodeURIComponent(withUrl)}`,
    },
    {
      key: "x",
      label: "X",
      icon: XMark,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(blurb)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      icon: LinkedinMark,
      // share-offsite works on mobile (app + web); feed/?shareActive is desktop-only.
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      key: "reddit",
      label: "Reddit",
      icon: RedditMark,
      href: `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`,
    },
    {
      key: "facebook",
      label: "Facebook",
      icon: FacebookMark,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      key: "email",
      label: "Email",
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(withUrl)}`,
    },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link");
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={iconOnly ? "icon-sm" : size}
          className={className}
          aria-label={iconOnly ? "Share" : undefined}
        >
          <Share2 />
          {iconOnly ? null : label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this challenge</DialogTitle>
          <DialogDescription>
            Sharing helps commitments spread. Every share counts.
          </DialogDescription>
        </DialogHeader>

        {canNativeShare ? (
          <Button onClick={nativeShare} className="w-full">
            <Share2 />
            Share via your apps
          </Button>
        ) : null}

        <div className="grid grid-cols-3 gap-2">
          {platforms.map((platform) => (
            <a
              key={platform.key}
              href={platform.href}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border bg-card/50 text-muted-foreground hover:bg-muted hover:text-foreground flex flex-col items-center gap-2 rounded-lg border p-3 text-xs font-medium transition-colors"
            >
              <platform.icon className="size-5" />
              {platform.label}
            </a>
          ))}
        </div>

        <div className="border-border bg-muted/40 flex min-w-0 items-center gap-2 rounded-lg border p-1.5">
          <span className="text-muted-foreground min-w-0 flex-1 truncate px-2 text-sm">
            {shareUrl}
          </span>
          <Button
            size="sm"
            variant={copied ? "secondary" : "default"}
            onClick={copyLink}
            className="shrink-0"
          >
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
