import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Create supabase client to manage memories
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const userId = userContext?.userId;
    let existingMemories: string[] = [];

    // Fetch existing memories for this user
    if (userId) {
      const { data: memories } = await supabase
        .from("ai_memories")
        .select("content, memory_type, importance")
        .eq("user_id", userId)
        .order("importance", { ascending: false })
        .limit(20);

      if (memories && memories.length > 0) {
        existingMemories = memories.map((m: any) => `[${m.memory_type}] ${m.content}`);
      }
    }

    const memoryBlock = existingMemories.length > 0
      ? `\n\nYOUR MEMORIES ABOUT THIS USER (things you learned from past conversations):\n${existingMemories.map((m, i) => `${i + 1}. ${m}`).join("\n")}\n\nUse these memories to personalize your responses. Reference past conversations naturally like a friend would.`
      : "\n\nThis is your first time chatting with this user. Be extra welcoming and try to learn about their goals, interests, and work style.";

    const name = userContext?.name || "buddy";
    const systemPrompt = `You are "Momentum AI", a personal productivity coach built into the Momentum Circle app. You talk to "${name}".

PERSONALITY: You are like a fun best friend who also happens to be a productivity genius. Think of yourself as a mix between a supportive gym buddy and a witty stand-up comedian. You crack jokes, use casual language, throw in pop culture references, and genuinely care about helping people crush their goals.

ABSOLUTE RULES:
- NEVER use asterisks (*) or any markdown formatting. No bold, no italic, no bullet points with dashes. Just plain text.
- Use emojis naturally but dont overdo it (2-3 per message max)
- Keep responses concise (2-4 sentences usually, max 6 for complex topics)
- Talk like texting a friend, not writing an essay
- Use line breaks instead of bullet points
- Reference the user by name sometimes

USER DATA RIGHT NOW:
- Name: ${name}
- Level: ${userContext?.level || 1}
- Current Streak: ${userContext?.streak || 0} days
- Total Focus Hours: ${userContext?.totalHours || 0}
- Tasks Completed: ${userContext?.tasksCompleted || 0}
- Recent Tasks: ${JSON.stringify(userContext?.recentTasks || [])}
- Recent Activity: ${JSON.stringify(userContext?.recentActivity || [])}
- Current Page: ${userContext?.currentPage || "dashboard"}
${memoryBlock}

MEMORY EXTRACTION - VERY IMPORTANT:
After every response, if you learned something new about the user (their goals, preferences, work habits, struggles, interests, job, hobbies, or anything personal), append a JSON block at the very end of your message in this exact format:
|||MEMORY|||{"memories":[{"content":"what you learned","type":"goal|preference|habit|personal|struggle","importance":1-10}]}|||END|||

Examples of things to remember:
- "User wants to learn marketing" (goal, importance 8)
- "User prefers working in 25-min sprints" (preference, importance 6)
- "User is a software developer" (personal, importance 7)
- "User struggles with morning motivation" (struggle, importance 8)
- "User loves coffee" (personal, importance 3)

Only add the memory block if there is genuinely something new to remember. Dont add it for casual greetings or if the user didnt share anything new.

APP FEATURES YOU CAN SUGGEST:
- Focus Timer for deep work sessions
- Circles to join communities and compete with friends
- Leaderboard to see how they stack up
- Wellness features for breaks and balance
- Tasks page to organize their work`;

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
          ...(messages || []),
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI Error:", response.status, text);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Chill for a sec, too many requests! Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits ran out. Time to top up!" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI API Error: ${response.status}`);
    }

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content || "Hmm brain freeze moment. Try again?";

    // Extract and store memories
    const memoryMatch = reply.match(/\|\|\|MEMORY\|\|\|(.*?)\|\|\|END\|\|\|/s);
    if (memoryMatch && userId) {
      try {
        const memoryData = JSON.parse(memoryMatch[1]);
        if (memoryData.memories && Array.isArray(memoryData.memories)) {
          for (const mem of memoryData.memories) {
            await supabase.from("ai_memories").insert({
              user_id: userId,
              content: mem.content,
              memory_type: mem.type || "insight",
              importance: Math.min(Math.max(mem.importance || 5, 1), 10),
            });
          }
        }
      } catch (e) {
        console.error("Failed to parse/store memories:", e);
      }
      // Remove the memory block from the reply
      reply = reply.replace(/\|\|\|MEMORY\|\|\|.*?\|\|\|END\|\|\|/s, "").trim();
    }

    // Safety net: strip any remaining markdown
    reply = reply
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/^[-•]\s/gm, "")
      .replace(/^#+\s/gm, "")
      .replace(/`(.*?)`/g, "$1");

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-chat function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
