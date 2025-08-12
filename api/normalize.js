import { DateTime } from "luxon";

export default function handler(req, res) {
  const { input } = req.query;
  let now = DateTime.local();

  // If input is provided and includes "tomorrow"
  if (input && input.toLowerCase().includes("tomorrow")) {
    now = now.plus({ days: 1 }).startOf("day").set({ hour: 9, minute: 0 });
  }

  // Convert to UTC ISO string
  const utcTime = now.setZone("UTC").toISO();

  res.status(200).json({ utcTime });
}
