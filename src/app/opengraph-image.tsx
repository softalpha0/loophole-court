import { ImageResponse } from "next/og";

export const alt = "Loophole Court — two AIs argue over your assignment until it's airtight";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The preview card shown when the link is shared (Devpost, WhatsApp, X…). */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#faf7f0",
          color: "#231b12",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 48 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 22,
              background: "#7c4f17",
              color: "white",
              fontSize: 60,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ⚖
          </div>
          <div style={{ fontSize: 44, fontWeight: 700 }}>Loophole Court</div>
        </div>
        <div style={{ fontSize: 70, fontWeight: 700, lineHeight: 1.1 }}>Two AIs argue over your assignment</div>
        <div style={{ fontSize: 70, fontWeight: 700, lineHeight: 1.1, color: "#7c4f17" }}>until it&apos;s airtight.</div>
        <div style={{ fontSize: 34, color: "#5f5547", marginTop: 36, maxWidth: 980 }}>
          “Write about a famous person.” → “My cat. Very famous on our street.”
        </div>
      </div>
    ),
    size,
  );
}
