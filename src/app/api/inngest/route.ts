import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { demoGenerate } from "@/inngest/functions";

// Create an API that serves the background job functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    demoGenerate,
  ],
});
