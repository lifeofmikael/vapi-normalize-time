// index.js
const { DateTime } = require("luxon");

function normalizeTime(input) {
  // Get current date/time in local time zone
  let now = DateTime.local();

  // Handle "tomorrow" case
  if (input.toLowerCase().includes("tomorrow")) {
    now = now.plus({ days: 1 }).startOf("day").set({ hour: 9, minute: 0 }); // default 9 AM
  }

  // Convert to UTC for calendar API
  let utcTime = now.setZone("UTC").toISO();

  return utcTime;
}

// Example:
console.log(normalizeTime("tomorrow"));
