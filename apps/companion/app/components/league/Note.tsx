// A short note in the caution ink, saying why something on screen is missing or degraded.

export default function Note({ children }: { children: React.ReactNode }) {
  return <p className="cm-panel px-3 py-2 text-2xs text-mid">{children}</p>;
}
