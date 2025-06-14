
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    // Strict system prompt to restrict answers to technical topics only
    const geminiMessages = [
      {
        role: "user",
        parts: [
          {
            text:
              `System: You are a helpful assistant ONLY for technical topics related to IT, engineering, software, computers, troubleshooting, devices, audiovisual, and technology at work. DO NOT answer or respond to any non-technical, irrelevant, or personal questions. If the user asks about non-technical topics, politely reply: "I'm here to help with technical topics only."`
          }
        ],
      },
      ...messages.map((msg: any) => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
    ];

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + geminiApiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: geminiMessages,
        }),
      }
    );

    const data = await response.json();

    // Gemini API returns the text here
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I could not provide a response at this time.";

    return new Response(JSON.stringify({ text: aiText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Gemini function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
