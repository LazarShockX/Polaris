import { inngest } from "./client";

import { generateText } from "ai";
import { openai } from '@ai-sdk/openai';

export const demoGenerate = inngest.createFunction(
  { id: "demo-generate" },
  { event: "demo/generate" },
  async ({ step }) => {
    await step.run("generate-text", async () => {
        return await generateText({
            model: openai("gpt-4o"),
            prompt: "Write a vegetarian lasagna recipe for 4 people.",
        })
    })
  },
);
