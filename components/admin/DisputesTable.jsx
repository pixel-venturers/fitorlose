"use client";

import { useMemo, useState } from "react";

import { formatDate } from "@/lib/formatters";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChallengePopover } from "@/components/admin/ChallengePopover";
import { DisputeActions } from "@/components/admin/DisputeActions";
import { SearchInput } from "@/components/admin/SearchInput";
import { UserPopover } from "@/components/admin/UserPopover";
import { ChallengeStatusBadge } from "@/components/challenge/ChallengeStatusBadge";

function includes(text, query) {
  return String(text ?? "")
    .toLowerCase()
    .includes(query);
}

export function DisputesTable({ disputes }) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();

  const rows = useMemo(
    () =>
      disputes.filter(
        (item) =>
          !query ||
          includes(item.user.name, query) ||
          includes(item.user.email, query) ||
          includes(item.user.id, query) ||
          includes(item.challenge.title, query) ||
          includes(item.challenge.uuid, query)
      ),
    [disputes, query]
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search user, email, challenge…"
          className="w-full sm:max-w-sm"
        />
      </div>
      <div className="ring-foreground/10 overflow-x-auto rounded-xl ring-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Challenge</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Opened</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
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
                <TableCell className="text-muted-foreground max-w-xs">
                  {item.reason}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(item.openedAt)}
                </TableCell>
                <TableCell>
                  <ChallengeStatusBadge status={item.status} />
                </TableCell>
                <TableCell className="text-right">
                  {item.status === "OPEN" ? (
                    <DisputeActions
                      disputeId={item.id}
                      label={`dispute on ${item.challenge.title}`}
                    />
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center text-sm"
                >
                  No disputes match your search.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
