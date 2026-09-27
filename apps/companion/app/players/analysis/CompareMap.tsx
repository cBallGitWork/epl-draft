import type { Club, Shot } from "@epl/core";
import { clubColoursOf, plateOn } from "@epl/core";
import { PITCH_BOX } from "../../components/football/pitchBox";
import Marks, { MarksKey } from "../../components/football/ShotMarks";
import { KeyPass, KeyPassKey, Pitch } from "../../components/football/ShotPitch";
import { SMALL_CAPS } from "@/app/desk";

// Both men on one pitch, each at his own end as the bar reads them: the left man is turned round, as the match
// map turns the home side. Shots are his own; key passes are his teammates' shots, drawn from where his pass began.

/** One man as the map needs him. */
interface MapMan {
  name: string;
  club: Club | undefined;
  /** His shots, or the shots he set up. */
  shots: readonly Shot[];
}

export default function CompareMap({
  men,
  passes,
  window,
  className = "",
}: {
  men: readonly MapMan[];
  /** Key passes: a dashed line from each pass to the shot it made. */
  passes: boolean;
  /** What the marks cover, for the label a screen reader gets. */
  window: string;
  className?: string;
}) {
  const sides = men.map((man, index) => {
    const plate = plateOn(clubColoursOf(man.club));
    const turned = men.length === 2 && index === 0;
    return { ...man, colour: plate.background, ink: plate.ink, shots: turned ? man.shots.map(turn) : man.shots };
  });
  const noun = passes ? "key passes" : "shots";

  return (
    <figure className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <div className={`grid ${SMALL_CAPS} ${sides.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
        {sides.map((side, index) => (
          <span
            key={side.name}
            className={`flex justify-between gap-2 px-2 py-1 ${index === 1 ? "flex-row-reverse" : ""}`}
            style={{ background: side.colour, color: side.ink }}
          >
            <span className="min-w-0 truncate">{side.name}</span>
            <span className="numeric">{side.shots.length}</span>
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${PITCH_BOX.width} ${PITCH_BOX.height}`}
        className="w-full"
        role="img"
        aria-label={sides.map((side, index) => `${side.name}: ${side.shots.length} ${noun}, attacking ${sides.length === 2 && index === 0 ? "left" : "right"}`).join("; ") + `, ${window}.`}
      >
        <Pitch />
        {/* Passes first, so each shot's mark sits on the end of its line. */}
        {passes
          ? sides.flatMap((side) =>
              side.shots.map((shot, at) =>
                shot.pass === null ? null : (
                  <KeyPass key={`${side.name}-${at}`} shot={shot} from={shot.pass} colour={side.colour} />
                ),
              ),
            )
          : null}
        {sides.map((side) => (
          <Marks key={side.name} shots={side.shots} ink={side.colour} />
        ))}
      </svg>
      <MarksKey>{passes ? <KeyPassKey /> : null}</MarksKey>
    </figure>
  );
}

/** A shot seen from the other end: the pitch turned half round, so the left man attacks the left goal. */
function turn(shot: Shot): Shot {
  return {
    ...shot,
    x: 100 - shot.x,
    y: 100 - shot.y,
    pass: shot.pass === null ? null : { x: 100 - shot.pass.x, y: 100 - shot.pass.y },
  };
}
