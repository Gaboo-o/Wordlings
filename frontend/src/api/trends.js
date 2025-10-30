// backend/routes/trends.js
/*import express from "express";
import googleTrends from "google-trends-api";


const router = express.Router();

// GET /api/trends/:word
router.get("/:word", async (req, res) => {
  try {
    const { word } = req.params;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 5); // last 5 years

    // Fetch trends over time
    const trendData = await googleTrends.interestOverTime({
      keyword: word,
      startTime: startDate,
      endTime: endDate,
      geo: "", // worldwide; set to "US" or another code if you want
    });

    const parsedTrend = JSON.parse(trendData).default.timelineData.map((item) => ({
      date: item.formattedTime,
      value: item.value[0],
    }));

    // Fetch region popularity
    const regionData = await googleTrends.interestByRegion({
      keyword: word,
      startTime: startDate,
      endTime: endDate,
    });

    const parsedRegions = JSON.parse(regionData).default.geoMapData;
    const topRegion = parsedRegions[0]?.geoName || "Unknown";

    res.json({ trend: parsedTrend, topRegion });
  } catch (err) {
    console.error("Google Trends error:", err);
    res.status(500).json({ error: "Failed to fetch Google Trends data" });
  }
});

export default router;
*/