"use client";

import { useMemo, useState } from "react";

import { PAYMENT_STATUS_META } from "@/lib/constants";
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
import { SortHeader } from "@/components/admin/SortHeader";
import { TransactionPopover } from "@/components/admin/TransactionPopover";
import { UserPopover } from "@/components/admin/UserPopover";
import { ToneBadge } from "@/components/common/ToneBadge";

function includes(text, query) {
  return String(text ?? "")
    .toLowerCase()
    .includes(query);
}

export function TransactionsTable({ transactions }) {
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState(null);
  const query = search.trim().toLowerCase();

  const rows = useMemo(() => {
    let list = transactions.filter(
      (item) =>
        !query ||
        includes(item.user.name, query) ||
        includes(item.user.email, query) ||
        includes(item.user.id, query) ||
        includes(item.challenge.title, query) ||
        includes(item.challenge.uuid, query) ||
        includes(item.id, query)
    );
    if (sortDir) {
      list = [...list].sort((a, b) =>
        sortDir === "asc" ? a.amount - b.amount : b.amount - a.amount
      );
    }
    return list;
  }, [transactions, query, sortDir]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search user, email, challenge, txn id…"
          className="w-full sm:max-w-sm"
        />
      </div>
      <div className="ring-foreground/10 overflow-x-auto rounded-xl ring-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Challenge</TableHead>
              <TableHead className="text-right">
                <SortHeader
                  label="Amount"
                  active={Boolean(sortDir)}
                  dir={sortDir ?? "desc"}
                  onClick={() =>
                    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => {
              const status = PAYMENT_STATUS_META[item.status] ?? {
                label: item.status,
                tone: "muted",
              };
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <TransactionPopover transaction={item} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.type}
                  </TableCell>
                  <TableCell>
                    <UserPopover user={item.user} />
                  </TableCell>
                  <TableCell>
                    <ChallengePopover
                      challenge={item.challenge}
                      className="text-muted-foreground"
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(item.amount, item.currency)}
                  </TableCell>
                  <TableCell>
                    <ToneBadge label={status.label} tone={status.tone} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground py-8 text-center text-sm"
                >
                  No transactions match your search.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
