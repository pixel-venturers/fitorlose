"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreateChallenge } from "@/actions/Challenge";
import { UploadFile } from "@/actions/Upload";
import { ROUTES } from "@/config/site";
import { CHALLENGE_CATEGORIES, getCategory } from "@/data/challenge-categories";
import { useClerk, useUser } from "@clerk/nextjs";
import { CheckCircle2, ImagePlus, Info, Plus, X } from "lucide-react";
import { toast } from "sonner";

import {
  CURRENCY,
  CURRENCY_SYMBOL,
  getMinCommitment,
  MAX_CHALLENGE_DAYS,
  MIN_CHALLENGE_DAYS,
  PROVIDER_CONNECT,
  PROVIDER_META,
  VERIFICATION_TYPE,
  VERIFICATION_TYPE_META,
  VISIBILITY,
  VISIBILITY_META,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PaymentButton } from "@/components/challenge/PaymentButton";
import { Icon } from "@/components/common/Icon";

const COVERS = [
  "from-sky-500/40 to-indigo-600/40",
  "from-blue-500/40 to-cyan-600/40",
  "from-indigo-500/40 to-violet-600/40",
  "from-cyan-500/40 to-blue-600/40",
  "from-violet-500/40 to-blue-700/40",
  "from-emerald-500/40 to-teal-600/40",
];

// sessionStorage key: carries a half-filled create across the sign-in modal.
const PENDING_CREATE_KEY = "fol_pending_challenge";

// Local calendar day as YYYY-MM-DD — used as the min selectable start date.
function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-400">{message}</p>;
}

function SelectableCard({
  selected,
  onClick,
  icon,
  title,
  description,
  disabled,
  badge,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "relative flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
        disabled
          ? "border-border bg-card/40 cursor-not-allowed opacity-50"
          : selected
            ? "border-primary bg-primary/10 ring-primary/40 ring-1"
            : "border-border bg-card/40 hover:bg-muted/50"
      )}
    >
      {badge ? (
        <span className="bg-muted text-muted-foreground absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-medium">
          {badge}
        </span>
      ) : null}
      <span className="flex items-center gap-2 text-sm font-medium">
        {icon ? <Icon name={icon} className="size-4" /> : null}
        {title}
      </span>
      <span className="text-muted-foreground text-xs">{description}</span>
    </button>
  );
}

// Only web-connectable providers can back an automatic/hybrid challenge.
const PROVIDER_OPTIONS = Object.values(PROVIDER_META).filter(
  (provider) =>
    provider.enabled && provider.connectVia === PROVIDER_CONNECT.WEB_OAUTH
);

export function ChallengeForm({ initial }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [categorySlug, setCategorySlug] = useState(initial?.categorySlug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [startingValue, setStartingValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [durationDays, setDurationDays] = useState(
    initial?.durationDays || String(MIN_CHALLENGE_DAYS)
  );
  const [startDate, setStartDate] = useState(todayString);
  const [currency, setCurrency] = useState(
    initial?.currency === CURRENCY.USD ? CURRENCY.USD : CURRENCY.INR
  );
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [visibility, setVisibility] = useState(VISIBILITY.PUBLIC);
  const [verification, setVerification] = useState(
    Object.values(VERIFICATION_TYPE).includes(initial?.verification)
      ? initial.verification
      : VERIFICATION_TYPE.MANUAL
  );
  const [provider, setProvider] = useState(PROVIDER_OPTIONS[0]?.slug);
  const [cover, setCover] = useState(0);
  const [coverUrl, setCoverUrl] = useState(initial?.coverImageUrl ?? "");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const { isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();

  // Resume a create started while signed out: the sign-in modal navigates away,
  // so the form + intent are stashed in sessionStorage and replayed on return.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let saved = null;
    try {
      saved = sessionStorage.getItem(PENDING_CREATE_KEY);
    } catch {
      saved = null;
    }
    if (!saved) return;
    try {
      sessionStorage.removeItem(PENDING_CREATE_KEY);
    } catch {
      /* ignore */
    }
    let snap;
    try {
      snap = JSON.parse(saved);
    } catch {
      return;
    }
    restoreSnapshot(snap);
    submitCreate(payloadFrom(snap));
  }, [isLoaded, isSignedIn]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const category = getCategory(categorySlug);
  const unit = category?.unit ?? "";
  const minCommitment = getMinCommitment(currency);
  const usesProvider =
    verification === VERIFICATION_TYPE.AUTOMATIC ||
    verification === VERIFICATION_TYPE.HYBRID;

  let endDateLabel = "—";
  if (startDate && Number(durationDays)) {
    const end = new Date(startDate);
    if (!Number.isNaN(end.getTime())) {
      end.setUTCDate(end.getUTCDate() + Number(durationDays));
      endDateLabel = formatDate(end.toISOString());
    }
  }

  function validate() {
    const next = {};
    if (!title.trim()) next.title = "Give your challenge a title.";
    if (!categorySlug) next.category = "Pick a category.";
    if (!targetValue) next.target = "Set a target value.";
    const amountValue = Number(amount);
    if (!amountValue || amountValue < minCommitment) {
      next.amount = `Minimum commitment is ${formatCurrency(minCommitment, currency)}.`;
    }
    const duration = Number(durationDays);
    if (
      !duration ||
      duration < MIN_CHALLENGE_DAYS ||
      duration > MAX_CHALLENGE_DAYS
    ) {
      next.duration = `Duration must be between ${MIN_CHALLENGE_DAYS} and ${MAX_CHALLENGE_DAYS} days.`;
    }
    if (!startDate) {
      next.startDate = "Choose a start date.";
    } else if (startDate < todayString()) {
      next.startDate = "Start date can't be in the past.";
    }
    return next;
  }

  const SERVER_ERROR_KEYS = {
    categorySlug: "category",
    targetValue: "target",
    durationDays: "duration",
  };

  async function uploadCover(file) {
    if (!file) return;
    setUploadingCover(true);
    const fd = new FormData();
    fd.append("kind", "cover");
    fd.append("file", file);
    const res = await UploadFile(fd);
    setUploadingCover(false);
    if (res.ok) setCoverUrl(res.data.url);
    else toast.error(res.error?.message ?? "Couldn't upload the image.");
  }

  function snapshot() {
    return {
      title,
      categorySlug,
      description,
      startingValue,
      targetValue,
      durationDays,
      startDate,
      currency,
      amount,
      visibility,
      verification,
      provider,
      cover,
      coverUrl,
    };
  }

  function restoreSnapshot(snap) {
    setTitle(snap.title ?? "");
    setCategorySlug(snap.categorySlug ?? "");
    setDescription(snap.description ?? "");
    setStartingValue(snap.startingValue ?? "");
    setTargetValue(snap.targetValue ?? "");
    setDurationDays(snap.durationDays ?? String(MIN_CHALLENGE_DAYS));
    if (snap.startDate) setStartDate(snap.startDate);
    setCurrency(snap.currency ?? CURRENCY.INR);
    setAmount(snap.amount ?? "");
    setVisibility(snap.visibility ?? VISIBILITY.PUBLIC);
    setVerification(snap.verification ?? VERIFICATION_TYPE.MANUAL);
    setProvider(snap.provider ?? PROVIDER_OPTIONS[0]?.slug);
    setCover(snap.cover ?? 0);
    setCoverUrl(snap.coverUrl ?? "");
  }

  function payloadFrom(snap) {
    return {
      title: snap.title,
      categorySlug: snap.categorySlug,
      description: snap.description,
      currency: snap.currency,
      amount: snap.amount,
      durationDays: snap.durationDays,
      startDate: snap.startDate,
      visibility: snap.visibility,
      verificationType: snap.verification,
      verificationProvider:
        snap.verification === VERIFICATION_TYPE.MANUAL ? null : snap.provider,
      targetValue: snap.targetValue,
      startingValue: snap.startingValue,
      unit: getCategory(snap.categorySlug)?.unit ?? "",
      coverImageUrl: snap.coverUrl || null,
    };
  }

  async function submitCreate(values) {
    setSubmitting(true);
    const result = await CreateChallenge(values);
    setSubmitting(false);
    if (result.ok) {
      setCreatedId(result.data?.id ?? null);
      setSubmitted(true);
      toast.success("Challenge created. Payment is next.");
    } else {
      if (result.error?.fieldErrors) {
        const mapped = {};
        for (const [key, value] of Object.entries(result.error.fieldErrors)) {
          mapped[SERVER_ERROR_KEYS[key] ?? key] = value;
        }
        setErrors(mapped);
      }
      toast.error(result.error?.message ?? "Couldn't create the challenge.");
    }
  }

  function doCreate() {
    return submitCreate(payloadFrom(snapshot()));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    // Signed out: stash the form + intent, then return to /create after auth so
    // the challenge is created and the user continues straight to payment.
    if (isLoaded && !isSignedIn) {
      try {
        sessionStorage.setItem(PENDING_CREATE_KEY, JSON.stringify(snapshot()));
      } catch {
        /* ignore */
      }
      clerk.openSignIn({
        forceRedirectUrl: "/create",
        signUpForceRedirectUrl: "/create",
      });
      return;
    }
    doCreate();
  }

  if (submitted) {
    return (
      <div className="bg-card ring-foreground/10 mx-auto max-w-lg rounded-2xl p-8 text-center ring-1">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="size-6" />
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">
          You're all set — payment is next
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          {title || "Your challenge"} ·{" "}
          {formatCurrency(Number(amount) || 0, currency)}. Confirm your
          commitment to activate the challenge.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {createdId ? <PaymentButton challengeId={createdId} /> : null}
          {createdId ? (
            <Button asChild variant="outline">
              <Link href={`/challenges/${createdId}`}>View challenge</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href={ROUTES.dashboard}>Go to dashboard</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>The basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Challenge title</Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Run 45 minutes every day"
                className="mt-1.5"
                aria-invalid={Boolean(errors.title)}
              />
              <FieldError message={errors.title} />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={categorySlug} onValueChange={setCategorySlug}>
                <SelectTrigger
                  id="category"
                  className="mt-1.5 w-full"
                  aria-invalid={Boolean(errors.category)}
                >
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {CHALLENGE_CATEGORIES.map((item) => (
                    <SelectItem key={item.slug} value={item.slug}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {category ? (
                <p className="text-muted-foreground mt-1.5 text-xs">
                  {category.tagline}
                </p>
              ) : null}
              <FieldError message={errors.category} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What exactly are you committing to?"
                className="mt-1.5"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your goal</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="starting">Starting value (optional)</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <Input
                  id="starting"
                  type="number"
                  inputMode="decimal"
                  value={startingValue}
                  onChange={(event) => setStartingValue(event.target.value)}
                  placeholder="e.g. 80"
                />
                {unit ? (
                  <span className="text-muted-foreground text-sm">{unit}</span>
                ) : null}
              </div>
            </div>
            <div>
              <Label htmlFor="target">Target</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <Input
                  id="target"
                  type="number"
                  inputMode="decimal"
                  value={targetValue}
                  onChange={(event) => setTargetValue(event.target.value)}
                  placeholder={unit ? `e.g. 75` : "e.g. 100"}
                  aria-invalid={Boolean(errors.target)}
                />
                {unit ? (
                  <span className="text-muted-foreground text-sm">{unit}</span>
                ) : null}
              </div>
              <FieldError message={errors.target} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Duration</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                inputMode="numeric"
                min={MIN_CHALLENGE_DAYS}
                max={MAX_CHALLENGE_DAYS}
                value={durationDays}
                onChange={(event) => setDurationDays(event.target.value)}
                className="mt-1.5"
                aria-invalid={Boolean(errors.duration)}
              />
              <p className="text-muted-foreground mt-1.5 text-xs">
                {MIN_CHALLENGE_DAYS}–{MAX_CHALLENGE_DAYS} days · ends{" "}
                {endDateLabel}
              </p>
              <FieldError message={errors.duration} />
            </div>
            <div>
              <Label htmlFor="start">Start date</Label>
              <Input
                id="start"
                type="date"
                min={todayString()}
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="mt-1.5"
                aria-invalid={Boolean(errors.startDate)}
                suppressHydrationWarning
              />
              <FieldError message={errors.startDate} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commitment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-border inline-flex rounded-lg border p-0.5">
              {[CURRENCY.INR, CURRENCY.USD].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCurrency(code)}
                  className={cn(
                    "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                    currency === code
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {CURRENCY_SYMBOL[code]} {code}
                </button>
              ))}
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <div className="border-input focus-within:border-ring dark:bg-input/30 mt-1.5 flex items-center gap-2 rounded-lg border bg-transparent px-3 transition-colors">
                <span className="text-muted-foreground text-sm">
                  {CURRENCY_SYMBOL[currency]}
                </span>
                <Input
                  id="amount"
                  type="number"
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder={String(minCommitment)}
                  className="border-0 bg-transparent px-0 focus-visible:ring-0 dark:bg-transparent"
                  aria-invalid={Boolean(errors.amount)}
                />
              </div>
              <p className="text-muted-foreground mt-1.5 text-xs">
                Minimum {formatCurrency(minCommitment, currency)}.
              </p>
              <FieldError message={errors.amount} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visibility</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            {Object.values(VISIBILITY).map((value) => {
              const meta = VISIBILITY_META[value];
              return (
                <SelectableCard
                  key={value}
                  selected={visibility === value}
                  onClick={() => setVisibility(value)}
                  icon={meta.icon}
                  title={meta.label}
                  description={meta.description}
                />
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.values(VERIFICATION_TYPE)
                .filter((value) => value !== VERIFICATION_TYPE.HYBRID)
                .map((value) => {
                  const meta = VERIFICATION_TYPE_META[value];
                  const comingSoon = value === VERIFICATION_TYPE.AUTOMATIC;
                  return (
                    <SelectableCard
                      key={value}
                      selected={verification === value}
                      onClick={() => setVerification(value)}
                      icon={meta.icon}
                      title={meta.label}
                      description={meta.description}
                      disabled={comingSoon}
                      badge={comingSoon ? "Coming soon" : null}
                    />
                  );
                })}
            </div>
            {usesProvider ? (
              <div>
                <p className="text-sm font-medium">Choose a provider</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PROVIDER_OPTIONS.map((item) => (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => setProvider(item.slug)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors",
                        provider === item.slug
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
                  <Info className="size-3.5" />
                  Connect this provider from Settings → Fitness connections
                  before you pay to activate the challenge.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cover image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {COVERS.map((gradient, index) => (
                <button
                  key={gradient}
                  type="button"
                  onClick={() => setCover(index)}
                  aria-label={`Cover ${index + 1}`}
                  aria-pressed={cover === index}
                  className={cn(
                    "aspect-video rounded-lg bg-linear-to-br ring-1 transition",
                    gradient,
                    cover === index
                      ? "ring-primary ring-2"
                      : "ring-foreground/10"
                  )}
                />
              ))}
            </div>
            {coverUrl ? (
              <div className="ring-primary relative overflow-hidden rounded-lg ring-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverUrl}
                  alt="Cover"
                  className="aspect-video w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setCoverUrl("")}
                  aria-label="Remove cover image"
                  className="bg-background/80 text-foreground absolute top-2 right-2 grid size-6 place-items-center rounded-full"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <label className="border-border/70 bg-background/40 hover:border-primary/50 hover:bg-muted/40 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-5 text-center text-sm transition-colors">
                <ImagePlus className="text-muted-foreground size-5" />
                <span className="font-medium">
                  {uploadingCover ? "Uploading\u2026" : "Upload your own cover"}
                </span>
                <span className="text-muted-foreground text-xs">
                  JPG, PNG or WebP · max 5MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingCover}
                  onChange={(event) => uploadCover(event.target.files?.[0])}
                />
              </label>
            )}
          </CardContent>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-20">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div
              className={cn(
                "ring-foreground/10 relative flex aspect-video items-end overflow-hidden rounded-lg bg-linear-to-br p-3 ring-1",
                !coverUrl && COVERS[cover]
              )}
            >
              {coverUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverUrl}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                  />
                  <div className="bg-background/50 absolute inset-0" />
                </>
              ) : null}
              <span className="relative line-clamp-2 font-medium">
                {title || "Your challenge title"}
              </span>
            </div>
            <dl className="space-y-2">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="text-right font-medium">
                  {category?.label ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Target</dt>
                <dd className="text-right font-medium">
                  {targetValue ? `${targetValue} ${unit}` : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="text-right font-medium">
                  {durationDays || "—"} days
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Ends</dt>
                <dd className="text-right font-medium">{endDateLabel}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Visibility</dt>
                <dd className="text-right font-medium">
                  {VISIBILITY_META[visibility].label}
                </dd>
              </div>
              <div className="border-border/60 flex justify-between gap-3 border-t pt-2">
                <dt className="text-muted-foreground">Commitment</dt>
                <dd className="text-right text-base font-bold text-emerald-400">
                  {amount ? formatCurrency(Number(amount), currency) : "—"}
                </dd>
              </div>
            </dl>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                "Creating…"
              ) : (
                <>
                  <Plus />
                  Create challenge
                </>
              )}
            </Button>
            <p className="text-muted-foreground text-center text-xs">
              You'll confirm payment before the challenge goes live.
            </p>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}
