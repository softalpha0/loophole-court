/** Calls one of our API routes and turns any failure into a friendly message. */
export async function postJson<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("You seem to be offline. Check your connection and try again.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (data && typeof data.error === "string" && data.error) ||
        (res.status === 413 ? "That file is too big. Try a smaller photo." : "Something went wrong. Please try again."),
    );
  }
  return data as T;
}
