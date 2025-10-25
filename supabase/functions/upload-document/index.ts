import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Upload document function called");
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Get auth token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    
    // Verify user
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

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("File received:", file.name, file.type, file.size);

    // Validate file type
    const allowedTypes = ["application/pdf", "text/csv", "application/vnd.ms-excel"];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      return new Response(
        JSON.stringify({ error: "Chỉ chấp nhận file PDF và CSV" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "File không được vượt quá 10MB" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate file path
    const timestamp = Date.now();
    const filePath = `${user.id}/${timestamp}-${file.name}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    console.log("File uploaded successfully:", filePath);

    // Extract text content (basic implementation)
    let extractedText = "";
    if (file.type === "text/csv" || file.name.endsWith('.csv')) {
      const text = await file.text();
      extractedText = text.substring(0, 50000); // Limit to 50K chars
    } else {
      // For PDFs, we'll store a note that text extraction is pending
      extractedText = "Text extraction for PDF will be available in future updates.";
    }

    // Save metadata to database
    const { data: source, error: dbError } = await supabase
      .from("sources")
      .insert({
        user_id: user.id,
        name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        extracted_text: extractedText,
        metadata: {
          original_name: file.name,
          upload_timestamp: timestamp
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Try to clean up uploaded file
      await supabase.storage.from("documents").remove([filePath]);
      throw dbError;
    }

    console.log("Source saved to database:", source.id);

    return new Response(
      JSON.stringify({
        success: true,
        source: {
          id: source.id,
          name: source.name,
          file_type: source.file_type,
          file_size: source.file_size,
          created_at: source.created_at
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in upload function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});