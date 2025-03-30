const { createClient } = require("@supabase/supabase-js");
const supabase = createClient("https://alqzarczinymnwxrtrlo.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscXphcmN6aW55bW53eHJ0cmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMTIxMDksImV4cCI6MjA1ODg4ODEwOX0.1ZOiJZGSNlGea2lXRAulLxA9bSVRkma4XD-q9WOH5JM");
async function test() {
  try {
    const { data, error } = await supabase.from("detections").select().limit(1);
    console.log("Error:", error);
    console.log("Data:", data);
  } catch(e) {
    console.error(e);
  }
}
test();
