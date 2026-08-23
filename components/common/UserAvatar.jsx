import { VenetianMask } from "lucide-react";

import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SIZES = {
  sm: "size-8 text-xs",
  default: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-16 text-lg",
};

/** Avatar with an optional profile photo (public users) over a gradient/mask fallback. */
export function UserAvatar({
  src,
  initials,
  gradient,
  anonymous = false,
  size = "default",
  className,
}) {
  return (
    <Avatar className={cn(SIZES[size], className)}>
      {!anonymous && src ? <AvatarImage src={src} alt="" /> : null}
      <AvatarFallback
        className={cn(
          "bg-linear-to-br font-semibold text-white",
          gradient ?? "from-slate-600 to-slate-800"
        )}
      >
        {anonymous ? <VenetianMask className="size-[45%]" /> : initials || "?"}
      </AvatarFallback>
    </Avatar>
  );
}
