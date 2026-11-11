/**
 * The one place the app talks to Claude. Only used by server routes,
 * so the API key never reaches the browser.
 *
 * Every answer is checked against a Zod schema. If the answer is malformed
 * we try once more, then give up with a friendly message.
 */
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod/v4";

export class FriendlyError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message);
  }
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new FriendlyError(
      "Loophole Court isn't connected to its AI yet (missing API key). If you run this app, add ANTHROPIC_API_KEY to .env.local.",
      503,
    );
  }
  client ??= new Anthropic({ maxRetries: 1, timeout: 60_000 });
  return client;
}

type Content = Anthropic.Beta.BetaContentBlockParam[];

export async function askClaude<T extends z.ZodType>(opts: {
  schema: T;
  system: string;
  content: Content;
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
}): Promise<z.infer<T>> {
  const anthropic = getClient();
  let lastProblem = "";

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await anthropic.beta.messages.parse({
        model: MODEL,
        max_tokens: opts.maxTokens ?? 16000,
        system: opts.system,
        messages: [{ role: "user", content: opts.content }],
        output_config: {
          format: betaZodOutputFormat(opts.schema),
          effort: opts.effort ?? "medium",
        },
        // If a safety check declines on this model, the API retries on a fallback model.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });

      if (response.stop_reason === "refusal") {
        throw new FriendlyError(
          "The court couldn't hear this case. Please check it's an assignment brief and try again.",
          422,
        );
      }
      if (response.parsed_output != null) return response.parsed_output as z.infer<T>;
      lastProblem = `no parsed output (stop_reason=${response.stop_reason})`;
    } catch (err) {
      if (err instanceof FriendlyError) throw err;
      if (err instanceof Anthropic.AuthenticationError) {
        throw new FriendlyError("The AI key isn't valid. If you run this app, check ANTHROPIC_API_KEY.", 503);
      }
      if (err instanceof Anthropic.RateLimitError) {
        throw new FriendlyError("The AI is very busy right now. Wait a minute and try again.", 429);
      }
      if (err instanceof Anthropic.BadRequestError) {
        console.error("[ai] bad request:", err.message);
        throw new FriendlyError(
          "The court couldn't read that. If it's a photo, try a clearer or smaller one, or paste the text.",
          400,
        );
      }
      if (err instanceof Anthropic.APIError) {
        lastProblem = `API ${err.status}: ${err.message}`;
      } else {
        // Usually the answer didn't match our schema (Zod error) — worth one retry.
        lastProblem = err instanceof Error ? err.message : String(err);
      }
    }
    console.warn(`[ai] attempt ${attempt} failed: ${lastProblem}`);
  }

  throw new FriendlyError(
    "The court hit a problem. Please try again in a moment.",
    502,
  );
}
