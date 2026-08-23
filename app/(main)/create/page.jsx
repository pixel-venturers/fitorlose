import { ChallengeForm } from "@/components/challenge/ChallengeForm";
import { Container } from "@/components/common/Container";

export const metadata = {
  title: "Create a Challenge",
  description:
    "Set a measurable fitness goal, put money behind it, and make it real.",
};

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const initial = {
    title: params?.title ?? "",
    categorySlug: params?.category ?? "",
    description: params?.description ?? "",
    amount: params?.amount ?? "",
    currency: params?.currency ?? "",
    durationDays: params?.days ?? "",
    verification: params?.verification ?? "",
  };

  return (
    <Container className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Create a challenge
        </h1>
        <p className="text-muted-foreground mt-3">
          Set a measurable goal, put money behind it, and make it real. You'll
          confirm payment before it goes live.
        </p>
      </div>
      <div className="mt-10">
        <ChallengeForm initial={initial} />
      </div>
    </Container>
  );
}
