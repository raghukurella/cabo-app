import { OpenAI } from "https://esm.sh/openai@4.28.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // 2. Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 3. Parse Input
    const { text, examples } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Initialize OpenAI
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = new OpenAI({ apiKey });

    // 5. Construct Prompt
    const systemPrompt = `You are an expert data extraction assistant for matrimonial biodata. 
Extract the following fields from the text into a flat JSON object:
- name
- dob (Format: YYYY-MM-DD)
- age (Calculate if DOB is present)
- height
- religion
- caste
- subcaste
- mother_tongue
- education
- occupation
- company
- income
- location_city
- location_state
- location_country
- citizenship
- phone
- family_details (Summarize family info)
- bio (The full text or a summary)
- partner_preferences
- looking_for (Value must be "Bride" or "Groom" based on context)

If a field is not found, use an empty string "". Return ONLY valid JSON.`;

    const messages = [{ role: "system", content: systemPrompt }];

    // Add Few-Shot Examples
    if (Array.isArray(examples)) {
      for (const ex of examples) {
        if (ex.raw_text && ex.corrected_json) {
          messages.push({ role: "user", content: ex.raw_text });
          messages.push({ role: "assistant", content: JSON.stringify(ex.corrected_json) });
        }
      }
    }

    messages.push({ role: "user", content: text });

    // 6. Call LLM
    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages as any,
      temperature: 0,
    });

    // 7. Clean & Return Response
    let content = completion.choices[0].message.content || "";
    if (content.includes("```json")) {
      content = content.split("```json")[1].split("```")[0].trim();
    } else if (content.includes("```")) {
      content = content.split("```")[1].split("```")[0].trim();
    }

    const parsedData = JSON.parse(content);

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});