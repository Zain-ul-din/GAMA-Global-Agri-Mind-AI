import { defineTool } from "eve/tools";
import { encode } from "@toon-format/toon";
import { z } from "zod";

export default defineTool({
  description:
    "Get weather data for a specific location. Use the optional boolean parameters to fetch only the level of detail requested by the user.",
  inputSchema: z.object({
    lat: z
      .number()
      .min(-90)
      .max(90)
      .describe("The latitude coordinate of the location."),
    lng: z
      .number()
      .min(-180)
      .max(180)
      .describe("The longitude coordinate of the location."),
    includeCurr: z
      .boolean()
      .default(true)
      .describe(
        "Set to true if the user wants the instantaneous current weather conditions.",
      ),
    includeHourly: z
      .boolean()
      .default(false)
      .describe(
        "Set to true only if the user explicitly asks for hourly breakdowns, charts, or a timeline of the day.",
      ),
    includeDaily: z
      .boolean()
      .default(false)
      .describe(
        "Set to true if the user asks for a multi-day forecast, highs and lows, or upcoming week predictions.",
      ),
  }),
  execute: async ({ lat, lng, includeCurr, includeHourly, includeDaily }) => {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", lat.toString());
    url.searchParams.set("longitude", lng.toString());
    url.searchParams.set("timezone", "auto");

    // Let the AI context determine what parameters get appended to the request
    if (includeCurr) {
      url.searchParams.set(
        "current",
        "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
      );
    }

    if (includeHourly) {
      url.searchParams.set(
        "hourly",
        "temperature_2m,precipitation_probability,weather_code",
      );
    }

    if (includeDaily) {
      url.searchParams.set(
        "daily",
        "weather_code,temperature_2m_max,temperature_2m_min,uv_index_max",
      );
    }

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url.toString(), {
        signal: controller.signal,
      });
      clearTimeout(id);

      if (!response.ok) {
        return `API Error: Received status code ${response.status}`;
      }

      const json = await response.json();
      return encode(json);
    } catch (error) {
      return `Failed to fetch weather data: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});
