"use client";

import { useMemo, useState } from "react";

import { formatCurrency, formatDate } from "@/lib/formatters";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChallengePopover } from "@/components/admin/ChallengePopover";
import { SearchInput } from "@/components/admin/SearchInput";
import { SettlementAction } from "@/components/admin/SettlementAction";
import { UserPopover } from "@/components/admin/UserPopover";
import { ChallengeStatusBadge } from "@/components/challenge/ChallengeStatusBadge";

function includes(text, query) {
  return String(text ?? "")
    .toLowerCase()
    .includes(query);
}

export function SettlementsTable({ settlements }) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();

  const rows = useMemo(
    () =>
      settlements.filter(
        (item) =>
          !query ||
          includes(item.user.name, query) ||
          includes(item.user.email, query) ||
          includes(item.user.id, query) ||
          includes(item.challenge.title, query) ||
          includes(item.challenge.uuid, query)
      ),
    [settlements, query]
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
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Verified</TableHead>
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
                <TableCell className="text-right font-medium text-emerald-400 tabular-nums">
                  {formatCurrency(item.amount, item.currency)}
                </TableCell>
                <TableCell>
                  <ChallengeStatusBadge status={item.result} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(item.verifiedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <SettlementAction
                    settlementId={item.id}
                    amount={item.amount}
                    currency={item.currency}
                    user={item.user.name}
                  />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center text-sm"
                >
                  No settlements match your search.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
