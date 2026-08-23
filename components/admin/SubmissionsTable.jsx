"use client";

import { useMemo, useState } from "react";

import { VERIFICATION_TYPE_META } from "@/lib/constants";
import { formatDateTime } from "@/lib/formatters";

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
import { ProofViewer } from "@/components/admin/ProofViewer";
import { ReviewActions } from "@/components/admin/ReviewActions";
import { SearchInput } from "@/components/admin/SearchInput";
import { UserPopover } from "@/components/admin/UserPopover";

function includes(text, query) {
  return String(text ?? "")
    .toLowerCase()
    .includes(query);
}

export function SubmissionsTable({ submissions }) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();

  const rows = useMemo(() => {
    if (!query) return submissions;
    return submissions.filter(
      (item) =>
        includes(item.challenge.title, query) ||
        includes(item.challenge.uuid, query) ||
        includes(item.user.name, query) ||
        includes(item.user.email, query) ||
        includes(item.user.id, query) ||
        includes(item.type, query)
    );
  }, [submissions, query]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search title, user, email, type…"
          className="w-full sm:max-w-xs"
        />
      </div>
      <div className="ring-foreground/10 overflow-x-auto rounded-xl ring-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Challenge</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Flag</TableHead>
              <TableHead>Proof</TableHead>
              <TableHead className="text-right">Action</TableHead>
              <TableHead className="text-right">Outcome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <ChallengePopover challenge={item.challenge} />
                </TableCell>
                <TableCell>
                  <UserPopover user={item.user} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {VERIFICATION_TYPE_META[item.verificationType]?.label}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.type}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(item.submittedAt)}
                </TableCell>
                <TableCell>
                  {item.flagged ? (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                      Flagged
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <ProofViewer submission={item} />
                </TableCell>
                <TableCell className="text-right">
                  <ReviewActions
                    submissionId={item.id}
                    label={item.challenge.title}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <OutcomeActions
                    challengeId={item.challenge.id}
                    status={item.challenge.status}
                    label={item.challenge.title}
                  />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-muted-foreground py-8 text-center text-sm"
                >
                  No submissions match your search.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
