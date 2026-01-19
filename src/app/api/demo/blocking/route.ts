import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST() {
    const response = await generateText({
        model: openai("gpt-4o"),
        prompt: "Write a vegetarian lasagna recipe for 4 people.",
    });

    return Response.json({ response });
}
