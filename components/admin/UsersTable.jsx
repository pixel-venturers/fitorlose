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
import { SearchInput } from "@/components/admin/SearchInput";
import { SortHeader } from "@/components/admin/SortHeader";
import { UserPopover } from "@/components/admin/UserPopover";
import { ToneBadge } from "@/components/common/ToneBadge";

const STATUS_META = {
  active: { label: "Active", tone: "success" },
  flagged: { label: "Flagged", tone: "warning" },
};

function includes(text, query) {
  return String(text ?? "")
    .toLowerCase()
    .includes(query);
}

export function UsersTable({ users }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: null, dir: "desc" });
  const query = search.trim().toLowerCase();

  function toggle(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" }
    );
  }

  const rows = useMemo(() => {
    let list = users.filter(
      (user) =>
        !query ||
        includes(user.name, query) ||
        includes(user.email, query) ||
        includes(user.id, query)
    );
    if (sort.key) {
      list = [...list].sort((a, b) =>
        sort.dir === "asc"
          ? a[sort.key] - b[sort.key]
          : b[sort.key] - a[sort.key]
      );
    }
    return list;
  }, [users, query, sort]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, email, uuid…"
          className="w-full sm:max-w-xs"
        />
      </div>
      <div className="ring-foreground/10 overflow-x-auto rounded-xl ring-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">
                <SortHeader
                  label="Challenges"
                  active={sort.key === "challenges"}
                  dir={sort.dir}
                  onClick={() => toggle("challenges")}
                />
              </TableHead>
              <TableHead className="text-right">
                <SortHeader
                  label="Committed"
                  active={sort.key === "committed"}
                  dir={sort.dir}
                  onClick={() => toggle("committed")}
                />
              </TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((user) => {
              const status = STATUS_META[user.status] ?? STATUS_META.active;
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <UserPopover user={user} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.joinedAt)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {user.challenges}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(user.committed)}
                  </TableCell>
                  <TableCell>
                    <ToneBadge label={status.label} tone={status.tone} />
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center text-sm"
                >
                  No users match your search.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
