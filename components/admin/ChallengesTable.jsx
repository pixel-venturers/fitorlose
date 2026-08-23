"use client";

import { useMemo, useState } from "react";
import { getCategory } from "@/data/challenge-categories";

import { getStatusMeta, VERIFICATION_TYPE_META } from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChallengePopover } from "@/components/admin/ChallengePopover";
import { OutcomeActions } from "@/components/admin/OutcomeActions";
import { SearchInput } from "@/components/admin/SearchInput";
import { UserPopover } from "@/components/admin/UserPopover";
import { ChallengeStatusBadge } from "@/components/challenge/ChallengeStatusBadge";

function includes(text, query) {
  return String(text ?? "")
    .toLowerCase()
    .includes(query);
}

export function ChallengesTable({ challenges }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [verification, setVerification] = useState("all");
  const [category, setCategory] = useState("all");

  const statuses = useMemo(
    () => [...new Set(challenges.map((item) => item.status))],
    [challenges]
  );
  const verifications = useMemo(
    () => [...new Set(challenges.map((item) => item.verificationType))],
    [challenges]
  );
  const categories = useMemo(
    () => [...new Set(challenges.map((item) => item.categorySlug))],
    [challenges]
  );

  const query = search.trim().toLowerCase();
  const rows = useMemo(
    () =>
      challenges.filter((item) => {
        if (status !== "all" && item.status !== status) return false;
        if (verification !== "all" && item.verificationType !== verification)
          return false;
        if (category !== "all" && item.categorySlug !== category) return false;
        if (!query) return true;
        return (
          includes(item.userName, query) ||
          includes(item.userEmail, query) ||
          includes(item.userId, query) ||
          includes(item.title, query) ||
          includes(item.uuid, query) ||
          includes(item.categoryLabel, query)
        );
      }),
    [challenges, status, verification, category, query]
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search title, uuid, user, email…"
          className="w-full sm:max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((value) => (
              <SelectItem key={value} value={value}>
                {getStatusMeta(value).label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={verification} onValueChange={setVerification}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All verification</SelectItem>
            {verifications.map((value) => (
              <SelectItem key={value} value={value}>
                {VERIFICATION_TYPE_META[value]?.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((slug) => (
              <SelectItem key={slug} value={slug}>
                {getCategory(slug)?.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="ring-foreground/10 overflow-x-auto rounded-xl ring-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Outcome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <ChallengePopover challenge={item} />
                </TableCell>
                <TableCell>
                  <UserPopover
                    user={{
                      id: item.userId,
                      name: item.userName,
                      email: item.userEmail,
                    }}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.categoryLabel}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(item.amount, item.currency)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {VERIFICATION_TYPE_META[item.verificationType]?.label}
                </TableCell>
                <TableCell>
                  <ChallengeStatusBadge status={item.status} />
                </TableCell>
                <TableCell className="text-right">
                  <OutcomeActions
                    challengeId={item.id}
                    status={item.status}
                    label={item.title}
                  />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground py-8 text-center text-sm"
                >
                  No challenges match your filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
