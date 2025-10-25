import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Bạn là "InsureChat VN" - trợ lý AI chuyên phân tích bảo hiểm tại Việt Nam.

BẠN PHẢI:
1. Chỉ sử dụng dữ liệu từ tài liệu người dùng cung cấp
2. Trả lời bằng tiếng Việt, số tiền tính bằng VND
3. Đưa ra lý do và trích dẫn cho mọi khuyến nghị
4. Trả về JSON với cấu trúc sau:
{
  "summary": "Tóm tắt ngắn gọn",
  "comparison_table": [
    {
      "plan_name": "Tên gói",
      "premium": "Phí bảo hiểm (VND/năm)",
      "coverage": "Quyền lợi bảo hiểm",
      "exclusions": "Điều khoản loại trừ",
      "deductible": "Mức khấu trừ"
    }
  ],
  "recommendations": [
    {
      "plan_name": "Tên gói",
      "score": 85,
      "reason": "Lý do khuyến nghị",
      "best_for": "Phù hợp cho ai"
    }
  ],
  "citations": [
    {
      "text": "Trích dẫn từ tài liệu",
      "source": "Tên tài liệu",
      "page": "Trang số"
    }
  ],
  "disclaimer": "Đây chỉ là thông tin tham khảo. Vui lòng đọc kỹ điều khoản bảo hiểm trước khi quyết định."
}

KHÔNG BAO GIỜ tự bịa dữ liệu hoặc đoán thiếu thông tin.`;

serve(async (req) => {
  console.log("Chat function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const { message, conversationId, sourceIds } = await req.json();
    console.log("Request:", { message, conversationId, sourceIds });

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User authenticated:", user.id);

    // Build documents context
    let documentsContext = "";
    if (sourceIds && sourceIds.length > 0) {
      const { data: sources } = await supabase
        .from("sources")
        .select("name, extracted_text, metadata")
        .in("id", sourceIds)
        .eq("user_id", user.id);

      if (sources && sources.length > 0) {
        documentsContext = "\n\nTÀI LIỆU THAM KHẢO:\n" +
          sources.map((s, i) =>
            `[${i + 1}] ${s.name}:\n${s.extracted_text || "Chưa trích xuất văn bản"}\n`
          ).join("\n");
      }
    }

    // Conversation history
    let conversationHistory: any[] = [];
    if (conversationId) {
      const { data: messages } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(10);

      if (messages) conversationHistory = messages;
    }

    // Build OpenAI messages
    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT + documentsContext },
      ...conversationHistory,
      { role: "user", content: message },
    ];

    console.log("Calling OpenAI...");
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // You can change this to gpt-4o or gpt-3.5-turbo
        messages: aiMessages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("OpenAI API error:", aiResponse.status, errorText);
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0].message.content;
    console.log("AI response received");

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(assistantMessage);
    } catch {
      parsedResponse = {
        summary: assistantMessage,
        comparison_table: [],
        recommendations: [],
        citations: [],
        disclaimer: "Đây chỉ là thông tin tham khảo. Vui lòng đọc kỹ điều khoản bảo hiểm trước khi quyết định."
      };
    }

    // Save conversation and messages
    let finalConversationId = conversationId;
    if (!conversationId) {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: message.substring(0, 50) + (message.length > 50 ? "..." : "")
        })
        .select()
        .single();
      if (newConv) finalConversationId = newConv.id;
    }

    if (finalConversationId) {
      await supabase.from("messages").insert([
        { conversation_id: finalConversationId, role: "user", content: message },
        { conversation_id: finalConversationId, role: "assistant", content: assistantMessage }
      ]);

      if (parsedResponse.recommendations && parsedResponse.recommendations.length > 0) {
        await supabase.from("recommendations").insert({
          conversation_id: finalConversationId,
          data: parsedResponse
        });
      }
    }

    return new Response(
      JSON.stringify({ conversationId: finalConversationId, response: parsedResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in chat function:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
