import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tasks, dailyStats, steps, profile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a productivity coach AI for the "Momentum Circle" app. Analyze the user's data and provide 3-5 short, actionable productivity suggestions. Be encouraging and specific.

Rules:
- Each suggestion should be 1-2 sentences max
- Reference their actual data (tasks completed, hours focused, streaks, steps)
- Include emoji for each suggestion
- Focus on patterns, improvements, and motivation
- If they have step data, include health/wellness suggestions
- Respond ONLY with a JSON array of objects: [{"emoji": "🎯", "title": "Short title", "description": "1-2 sentence suggestion"}]`;

    const userMessage = `Here's my productivity data:
- Profile: Level ${profile?.level || 1}, ${profile?.streak_days || 0} day streak, ${profile?.total_hours || 0} total hours
- Recent tasks (last 7 days): ${JSON.stringify(tasks?.slice(0, 20) || [])}
- Daily stats (last 7 days): ${JSON.stringify(dailyStats || [])}
- Steps (last 7 days): ${JSON.stringify(steps || [])}

Give me personalized productivity suggestions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Parse the JSON from the response
    let suggestions;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      suggestions = [{ emoji: "💡", title: "Keep going!", description: "You're making progress. Keep building your streak!" }];
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-suggestions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
