// =============== SUPABASE DATABASE MODULE ===============

const SUPABASE_URL = "https://hfdhqvesvxbrzgpgzawa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmZGhxdmVzdnhicnpncGd6YXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDE4MzQsImV4cCI6MjA4MDc3NzgzNH0.K7Dt7gQbXO8zvA60HVlDHV4nNRF3Q6jKfJsqjzuW3uE";

export const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function loadPlayerByName(name) {
  try {
    const { data, error } = await supabaseClient
      .from("players")
      .select("*")
      .eq("name", name)
      .maybeSingle();

    if (error) {
      console.error("Błąd SELECT players:", error);
      return null;
    }

    return data;
  } catch (e) {
    console.error("Wyjątek przy loadPlayerByName:", e);
    return null;
  }
}

export async function updatePlayerAfterSolve(playerRow, playerName, gameDay, finalSolution, rewardIndex) {
  if (!playerRow) {
    const insertData = {
      name: playerName,
      letter_indexes: rewardIndex !== null ? [rewardIndex] : [],
      solved_days: [gameDay],
    };

    const { data, error } = await supabaseClient
      .from("players")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error("Błąd INSERT players:", error);
      return { playerRow: null, rewardIndex: null };
    }

    return { playerRow: data, rewardIndex };
  }

  const currentIndexes = Array.isArray(playerRow.letter_indexes)
    ? playerRow.letter_indexes
    : [];

  let newIndexes = currentIndexes;
  
  if (rewardIndex !== null && !currentIndexes.includes(rewardIndex)) {
    newIndexes = [...currentIndexes, rewardIndex];
  }

  const newSolved = [...(playerRow.solved_days || []), gameDay];

  const { data, error } = await supabaseClient
    .from("players")
    .update({
      letter_indexes: newIndexes,
      solved_days: newSolved,
    })
    .eq("id", playerRow.id)
    .select()
    .single();

  if (error) {
    console.error("Błąd UPDATE players:", error);
    return { playerRow: null, rewardIndex: null };
  }

  return { playerRow: data, rewardIndex };
}