import { cn } from "@/lib/utils";

const SIZES = {
  prose: "max-w-2xl",
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
};

/** Centered width-capped wrapper so pages don't overstretch on 2k/4k screens. */
export function Container({ className, size = "default", children, ...props }) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6", SIZES[size], className)} {...props}>
      {children}
    </div>
  );
}
