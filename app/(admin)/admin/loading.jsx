import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-2 h-4 w-64 max-w-full" />
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-8 h-64 w-full rounded-xl" />
    </div>
  );
}
