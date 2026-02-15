import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { demoError, demoGenerate } from "@/inngest/functions";
import { processMessage } from "@/features/conversations/inngest/process-message";

// Create an API that serves the background job functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    demoError,
    demoGenerate,
    processMessage,
  ],
});
