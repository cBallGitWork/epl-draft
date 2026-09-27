import { HEAD_PLATE, ROW_NAME } from "@/app/desk";

/** Each group's draw slots, side by side; the teams go in them at the draw. */
export default function Groups({ groups }: { groups: readonly string[][] }) {
  if (groups.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      {groups.map((slots, at) => (
        <section key={slots[0] ?? at} className="flex flex-col gap-1">
          <h3 className={`${HEAD_PLATE} text-3xs font-bold uppercase`}>Group {slots[0]?.charAt(0)}</h3>
          <ul className="cm-rows flex flex-col">
            {slots.map((slot) => (
              <li key={slot} className={`${ROW_NAME} cm-panel px-2 py-1`}>
                {slot}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
