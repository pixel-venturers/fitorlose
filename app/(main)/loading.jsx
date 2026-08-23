import { Container } from "@/components/common/Container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Container className="py-16">
      <Skeleton className="h-8 w-52" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-10 space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </Container>
  );
}
