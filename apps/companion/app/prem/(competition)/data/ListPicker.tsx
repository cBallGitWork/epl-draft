"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { SELECT } from "../../../components/shell/ButtonLink";
import { SUBMIT } from "@/app/desk";
import { DATA } from "../../PremNav";
import { LISTS } from "./leaders";

// Which list a phone shows: a GET form that works without the script, `onChange` the convenience (team-stats' Filters).

export default function ListPicker({ list }: { list: string }) {
  const router = useRouter();

  function pick(event: FormEvent<HTMLSelectElement>) {
    router.push(`${DATA}?list=${event.currentTarget.value}`);
  }

  return (
    <form method="get" action={DATA} className="flex items-center gap-2">
      <select name="list" aria-label="List" value={list} onChange={pick} className={SELECT}>
        {LISTS.map((entry) => (
          <option key={entry.key} value={entry.key}>
            {entry.title}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className={SUBMIT}>
          Show
        </button>
      </noscript>
    </form>
  );
}
