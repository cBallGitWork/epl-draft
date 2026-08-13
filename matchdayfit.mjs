const t = await (await fetch(`http://localhost:9261/json`)).json();
const page = t.find((x) => x.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const send = (m, p) => new Promise((res) => {
  const myId = ++id;
  const on = (e) => { const x = JSON.parse(e.data); if (x.id === myId) { ws.removeEventListener("message", on); res(x.result); } };
  ws.addEventListener("message", on); ws.send(JSON.stringify({ id: myId, method: m, params: p }));
});
await new Promise((r) => ws.addEventListener("open", r));
const js = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true })).result.value;
for (const width of [320, 360]) {
  await send("Emulation.setDeviceMetricsOverride", { width, height: 800, deviceScaleFactor: 1, mobile: true });
  await send("Page.navigate", { url: "http://localhost:3000/league" });
  await new Promise((r) => setTimeout(r, 2500));
  // Measure every label including the hidden Matchday one, at the real tab font.
  const out = JSON.parse(await js(`(()=>{
    const a=document.querySelector('nav[aria-label=Sections] a');
    const cs=getComputedStyle(a);
    const measure=(text)=>{const s=document.createElement('span');
      s.style.cssText='position:absolute;visibility:hidden;white-space:nowrap;font:'+cs.font+';letter-spacing:'+cs.letterSpacing+';text-transform:uppercase';
      s.textContent=text;document.body.appendChild(s);const w=s.getBoundingClientRect().width;s.remove();return Math.ceil(w);};
    return JSON.stringify({column: Math.floor(window.innerWidth/6),
      labels:['Gazetta','League','Squads','Matchday','Players','FPL'].map(t=>({t,needs:measure(t)}))});
  })()`));
  console.log(`\n=== ${width}px — a six-tab column is ${out.column}px`);
  console.log(out.labels.map((l) => `${l.t}:${l.needs}${l.needs > out.column ? " CLIPS" : " ok"}`).join("  "));
}
ws.close();
