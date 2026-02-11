import { getSupabase } from "./supabase";

export async function createContactSubmission(data: {
  name: string;
  email: string;
  phone: string;
  message: string;
}): Promise<number> {
  const supabase = getSupabase();
  const { data: row } = await supabase
    .from("karbon_contact_submissions")
    .insert(data)
    .select("id")
    .single();
  return row!.id;
}
