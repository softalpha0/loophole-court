/**
 * Runs one real trial and prints every turn.
 * 1) npm run dev      2) in a second terminal: npm run smoke
 * Live site: npm run smoke -- https://your-app.vercel.app
 */
const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const BRIEF = "English – Essay\nWrite about a famous person. Use sources. Due Friday.";
const t0 = Date.now();
const secs = () => ((Date.now() - t0) / 1000).toFixed(1) + "s";

console.log(`Starting a trial at ${BASE} …\n`);
let res;
try {
  res = await fetch(BASE + "/api/trial", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: BRIEF, mode: "teacher" }) });
} catch {
  console.log(`❌ Couldn't reach ${BASE}. Is the app running? Start it with: npm run dev`);
  process.exit(1);
}
if (!res.ok) {
  console.log(`❌ ${res.status}: ${(await res.json().catch(() => ({}))).error}`);
  process.exit(1);
}
let ok = false;
let buf = "";
const decoder = new TextDecoder();
for await (const chunk of res.body) {
  buf += decoder.decode(chunk, { stream: true });
  let nl;
  while ((nl = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    const e = JSON.parse(line);
    if (e.type === "title") console.log(`[${secs()}] Case: ${e.title}`);
    if (e.type === "lawyer") {
      console.log(`\n[${secs()}] 🧑‍⚖️ Round ${e.round}: ${e.loopholes.length} loopholes, score ${e.score}, ${e.dropped} thrown out`);
      e.loopholes.forEach((l) => console.log(`   [${l.severity}] "${l.quote}" → ${l.sillyReading}\n      real question: ${l.realQuestion}`));
    }
    if (e.type === "teacher") {
      console.log(`[${secs()}] 👩‍🏫 ${e.patches.filter((p) => p.applied).length}/${e.patches.length} patches landed, score ${e.score}`);
      e.patches.forEach((p) => console.log(`   ${p.applied ? "✓" : "✗"} ${p.ruling}`));
    }
    if (e.type === "done") {
      ok = true;
      console.log(`\n[${secs()}] ⚖️ Verdict: ${e.result.scoreBefore} → ${e.result.scoreAfter}\n   Patched brief: ${e.result.finalBrief}`);
    }
    if (e.type === "error") console.log(`\n❌ ${e.message}`);
  }
}
console.log(ok ? `\n✅ Trial finished in ${secs()}` : "\n❌ The trial didn't finish. Send everything above to Claude.");
process.exit(ok ? 0 : 1);
