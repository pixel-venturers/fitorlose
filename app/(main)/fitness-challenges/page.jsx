import { CHALLENGE_CATEGORIES } from "@/data/challenge-categories";

import { CategoryTile } from "@/components/challenge/CategoryTile";
import { Container } from "@/components/common/Container";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata = {
  title: "Fitness Challenges",
  description:
    "Browse fitness challenge types — running, cycling, swimming, walking, gym, strength and weight loss. Put money behind your goal.",
  alternates: { canonical: "/fitness-challenges" },
};

export default function Page() {
  return (
    <Container className="py-14 sm:py-20">
      <PageHeader
        eyebrow="Fitness challenges"
        title="Pick your challenge, commit, and go"
        description="Every category can be backed with real money. Choose one and turn your goal into a commitment you'll actually keep."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHALLENGE_CATEGORIES.map((category) => (
          <CategoryTile key={category.slug} category={category} glow={false} />
        ))}
      </div>
    </Container>
  );
}
