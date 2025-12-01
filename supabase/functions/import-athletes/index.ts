import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const athleteRowSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email format").max(255, "Email too long"),
  sport: z.string().trim().min(1, "Sport is required").max(50, "Sport name too long"),
  graduation_year: z.string().regex(/^\d{4}$/, "Invalid graduation year"),
  position: z.string().optional(),
  high_school: z.string().max(200, "School name too long").optional(),
  gpa: z.string().optional(),
  height_in: z.string().optional(),
  weight_lb: z.string().optional(),
});

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  alumni: number;
  emailsSent: number;
  errors: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin access
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    
    if (!userData.user) {
      throw new Error("Unauthorized");
    }

    const { data: isAdmin } = await supabaseClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin"
    });

    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    const { csvData } = await req.json();
    
    const lines = csvData.split("\n").filter((line: string) => line.trim());
    const headers = lines[0].split(",").map((h: string) => h.trim());
    
    const result: ImportResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      alumni: 0,
      emailsSent: 0,
      errors: []
    };

    const currentYear = new Date().getFullYear();
    const batchId = crypto.randomUUID();

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(",").map((v: string) => v.trim());
        const row: any = {};
        headers.forEach((header: string, index: number) => {
          row[header] = values[index];
        });

        // Validate row data
        const validationResult = athleteRowSchema.safeParse(row);
        if (!validationResult.success) {
          const errors = validationResult.error.errors.map(e => `${e.path}: ${e.message}`).join(", ");
          result.errors.push(`Row ${i + 1}: ${errors}`);
          continue;
        }

        const validatedRow = validationResult.data;
        const gradYear = parseInt(validatedRow.graduation_year);
        const isAlumni = gradYear < currentYear;

        // Check for duplicates
        const { data: duplicateId } = await supabaseClient.rpc("check_duplicate_athlete", {
          p_full_name: validatedRow.full_name,
          p_graduation_year: gradYear,
          p_sport: validatedRow.sport,
          p_high_school: validatedRow.high_school || null
        });

        if (duplicateId) {
          result.updated++;
          result.skipped++;
          continue;
        }

        // More efficient user lookup: try to create, handle duplicate gracefully
        let userId: string | undefined;
        const tempPassword = crypto.randomUUID();
        
        const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
          email: validatedRow.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: validatedRow.full_name,
          }
        });

        if (authError) {
          // If user already exists, try to find them
          if (authError.message.includes("already registered") || authError.message.includes("duplicate")) {
            const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
            const existingUser = existingUsers?.users?.find(u => u.email === validatedRow.email);
            
            if (existingUser) {
              userId = existingUser.id;
              console.log(`User ${validatedRow.email} already exists, reusing existing account`);
            } else {
              result.errors.push(`Row ${i + 1}: User lookup failed - ${authError.message}`);
              continue;
            }
          } else {
            result.errors.push(`Row ${i + 1}: Failed to create user - ${authError.message}`);
            continue;
          }
        } else {
          userId = authData.user.id;
        }

        // Generate claim token
        const claimToken = crypto.randomUUID().replace(/-/g, '');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days to claim

        if (isAlumni) {
          // Create alumni profile with claim token
          console.log(`Creating alumni profile for ${validatedRow.full_name}, grad year: ${gradYear}`);
          const alumniData = {
            user_id: userId,
            school_id: null,
            sport: validatedRow.sport,
            position: validatedRow.position || null,
            graduation_year: gradYear,
            bio: `Imported profile for ${validatedRow.full_name}`,
            profile_claimed: false,
            claim_token: claimToken,
            claim_token_expires_at: expiresAt.toISOString(),
          };
          console.log('Alumni data:', JSON.stringify(alumniData));
          
          const { error: alumniError } = await supabaseClient
            .from("alumni")
            .insert(alumniData);

          if (alumniError) {
            console.error('Alumni insert error:', alumniError);
            result.errors.push(`Row ${i + 1}: Failed to create alumni - ${alumniError.message}`);
            continue;
          }

          console.log(`Successfully created alumni profile for ${validatedRow.full_name}`);
          result.alumni++;
        } else {
          // Create athlete profile
          const { error: athleteError } = await supabaseClient
            .from("athletes")
            .insert({
              user_id: userId,
              sport: validatedRow.sport,
              position: validatedRow.position || null,
              high_school: validatedRow.high_school || null,
              graduation_year: gradYear,
              gpa: validatedRow.gpa ? parseFloat(validatedRow.gpa) : null,
              height_in: validatedRow.height_in ? parseInt(validatedRow.height_in) : null,
              weight_lb: validatedRow.weight_lb ? parseInt(validatedRow.weight_lb) : null,
              visibility: "private",
              profile_claimed: false,
              claim_token: claimToken,
              claim_token_expires_at: expiresAt.toISOString(),
              is_imported: true,
              imported_at: new Date().toISOString(),
              import_batch_id: batchId,
            });

          if (athleteError) {
            result.errors.push(`Row ${i + 1}: Failed to create athlete - ${athleteError.message}`);
            continue;
          }
        }

        // Send claim email
        const { error: emailError } = await supabaseClient.functions.invoke(
          "send-notification-email",
          {
            body: {
              to: validatedRow.email,
              template: isAlumni ? "alumni_claim_profile" : "athlete_claim_profile",
              variables: {
                full_name: validatedRow.full_name,
                claim_url: `${req.headers.get("origin")}/claim/${claimToken}`,
                sport: validatedRow.sport,
                graduation_year: validatedRow.graduation_year,
              },
            },
          }
        );

        if (!emailError) {
          result.emailsSent++;
        }

        result.created++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`Row ${i + 1}: ${errorMessage}`);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Import error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});