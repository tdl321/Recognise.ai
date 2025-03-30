const { createClient } = require("@supabase/supabase-js");
const supabase = createClient("https://alqzarczinymnwxrtrlo.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscXphcmN6aW55bW53eHJ0cmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMTIxMDksImV4cCI6MjA1ODg4ODEwOX0.1ZOiJZGSNlGea2lXRAulLxA9bSVRkma4XD-q9WOH5JM");
console.log("Setting up subscription...");
const channel = supabase.channel("detections_channel");
channel.on("postgres_changes", { event: "INSERT", schema: "public", table: "detections" }, (payload) => {
  console.log("Change received!", payload);
}).subscribe((status) => {
  console.log("Subscription status:", status);
});
console.log("Waiting for changes... (press Ctrl+C to stop)");
