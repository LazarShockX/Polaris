import ky from "ky";
import { z } from "zod";
import { toast } from "sonner";

const suggestionRequestSchema = z.object({
    code: z.string(),
    currentLine: z.string(),
    fileName: z.string(),
    lineNumber: z.number(),
    nextLines: z.string(),
    previousLines: z.string(),
    textAfterCursor: z.string(),
    textBeforeCursor: z.string(),
});

const suggestionResponseSchema = z.object({
    suggestion: z.string(),
});

type SuggestionRequest = z.infer<typeof suggestionRequestSchema>;
type SuggestionResponse = z.infer<typeof suggestionResponseSchema>;

export const fetcher = async (payload: SuggestionRequest, signal: AbortSignal): Promise<string | null> => {
    try {
        const validatedPayload = suggestionRequestSchema.parse(payload);  // Validate the payload against our schema

        const response = await ky.post("/api/suggestion", {
            json: validatedPayload,
            signal,
            timeout: 10_000,
            retry: 0,
        })
        .json<SuggestionResponse>();

        const validatedResponse = suggestionResponseSchema.parse(response);

        return validatedResponse.suggestion || null;
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            return null;
        }
        toast.error("Failed to fetch AI completion");
        return null;
    }
}
