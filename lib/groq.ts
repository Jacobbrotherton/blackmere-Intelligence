import Groq from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function groqChat(
  systemPrompt: string,
  userPrompt: string,
  model = "llama-3.3-70b-versatile"
) {
  const completion = await groq.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2048,
  });
  return completion.choices[0]?.message?.content ?? "";
}
