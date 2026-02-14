
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        const { messages, userContext } = await req.json();
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

        // Construct a rich system prompt with user context
        const systemPrompt = `You are "Momentum AI", a personal productivity assistant and coach for the user "${userContext.name || 'Friend'}". 
    
    Your Goal: Be a supportive, knowledgeable, and proactive guide to help the user achieve their goals. You have access to their current app data.

    User Context:
    - Name: ${userContext.name}
    - Current Level: ${userContext.level}
    - Streak: ${userContext.streak} days
    - Total Focus Hours: ${userContext.totalHours}
    - Recent Tasks: ${JSON.stringify(userContext.recentTasks || [])}
    - Recent Activity: ${JSON.stringify(userContext.recentActivity || [])}

    Capabilities:
    1. **Task Management**: Suggest specific tasks based on their goals (e.g., if they mention "learning marketing", suggest "Watch 30min marketing video").
    2. **Wellness Checks**: If they seem stressed or have been working long hours (check focus hours), suggest a break or breathing exercise.
    3. **Motivation**: Celebrate their streaks and level-ups.
    4. **General Chat**: You can chat about anything, but always try to gently steer back to productivity, wellness, or their goals.

    Tone: Friendly, encouraging, concise, and professional but approachable. Use emojis occasionally.
    
    IMPORTANT: You are integrated into the "Momentum Circle" app. You can refer to "Circles" (communities), "Leaderboard", "Focus Timer", and "Wellness" features.
    `;

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "google/gemini-1.5-pro-latest", // Creating a more capable chat experience
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages // Pass full conversation history
                ],
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("AI Error:", text);
            throw new Error(`AI API Error: ${response.status}`);
        }

        const data = await response.json();
        const reply = data.choices[0].message.content;

        return new Response(JSON.stringify({ reply }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error in ai-chat function:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
