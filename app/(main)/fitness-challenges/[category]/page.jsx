import Link from "next/link";
import { notFound } from "next/navigation";
import { ROUTES } from "@/config/site";
import { CHALLENGE_CATEGORIES, getCategory } from "@/data/challenge-categories";
import { getTemplatesForCategory } from "@/data/challenge-templates";
import { ArrowRight, CalendarDays, Wallet } from "lucide-react";

import { CURRENCY, VERIFICATION_TYPE_META } from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";
import { getActiveChallengesByCategory } from "@/lib/queries/challenges";

import { Button } from "@/components/ui/button";
import { ChallengeCard } from "@/components/challenge/ChallengeCard";
import { Container } from "@/components/common/Container";
import { Icon } from "@/components/common/Icon";
import { SectionHeading } from "@/components/common/SectionHeading";

export function generateStaticParams() {
  return CHALLENGE_CATEGORIES.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) return { title: "Fitness Challenges" };
  const title = `${category.label} Challenges`;
  const description = `${category.description} Put real money behind your ${category.label.toLowerCase()} goal.`;
  const url = `/fitness-challenges/${slug}`;
  const images = category.ogImage
    ? [{ url: category.ogImage, alt: title }]
    : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", title, description, url, images },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: category.ogImage ? [category.ogImage] : undefined,
    },
  };
}

export default async function Page({ params }) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const templates = getTemplatesForCategory(slug);
  const related = await getActiveChallengesByCategory(slug, { limit: 6 });

  return (
    <Container className="py-12 sm:py-16">
      <div
        className="ring-foreground/10 relative overflow-hidden rounded-2xl bg-cover bg-center bg-no-repeat p-8 ring-1 sm:p-12"
        style={{ backgroundImage: `url(${category.coverImage})` }}
      >
        <div className="bg-background/40 text-foreground grid size-12 place-items-center rounded-xl backdrop-blur">
          <Icon name={category.icon} className="size-6" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-balance text-shadow-lg sm:text-4xl">
          {category.label} challenges
        </h1>
        <p className="text-foreground mt-3 max-w-xl text-pretty text-shadow-md">
          {category.description}
        </p>
        <div className="mt-6">
          <Button asChild className="h-11 px-6 text-base">
            <Link href={ROUTES.create}>
              {category.ctaLabel}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>

      {templates.length > 0 ? (
        <section className="mt-14">
          <SectionHeading
            eyebrow="Templates"
            title="Start from a proven goal"
            description="Pick a template and make it yours — adjust the target, amount and duration."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-card ring-foreground/10 flex flex-col rounded-xl p-5 ring-1"
              >
                <h3 className="font-medium">{template.title}</h3>
                <p className="text-muted-foreground mt-1 flex-1 text-sm">
                  {template.description}
                </p>
                <div className="text-muted-foreground mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    {template.suggestedDays} days
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Wallet className="size-3.5" />
                    {formatCurrency(template.suggestedAmountInr, CURRENCY.INR)}
                  </span>
                  <span>
                    {VERIFICATION_TYPE_META[template.verification].label}
                  </span>
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="mt-4 w-fit"
                >
                  <Link
                    href={`${ROUTES.create}?category=${template.categorySlug}&title=${encodeURIComponent(template.title)}&amount=${template.suggestedAmountInr}&days=${template.suggestedDays}&verification=${template.verification}&description=${encodeURIComponent(template.description)}`}
                  >
                    Use template
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="mt-14">
          <SectionHeading
            eyebrow="Live now"
            title={`Active ${category.label.toLowerCase()} challenges`}
            description="Real members with real money on the line right now."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </section>
      ) : null}
    </Container>
  );
}
