import { PANEL_FLUSH } from "@/app/desk";

// An inbox's frame: the list beside the open letter on a desk, above it under a thumb. The list takes the larger
// half and keeps its own scroll, so a reader picks from it without losing his place.

export default function Mailbox({ letter, children }: { letter: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,6fr)] lg:items-start lg:gap-3">
      <ul className={`${PANEL_FLUSH} cm-rows cm-scroll cm-scroll-y max-h-72 overflow-y-auto lg:max-h-[40rem]`}>
        {children}
      </ul>
      {letter}
    </div>
  );
}
