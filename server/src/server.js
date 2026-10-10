
import "dotenv/config";
import express from "express";
import cors from "cors";
import { supabase } from "./lib/supabase.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Check whether the API is running.
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "SeeMenu API is running",
    });
});

// Return publicly approved restaurants.
app.get("/api/restaurants", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("restaurants")
            .select(
                "id, name, description, address, area, city, cover_image_url, created_at"
            )
            .eq("status", "approved")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Failed to fetch restaurants:", error.message);

            return res.status(500).json({
                error: "Unable to fetch restaurants.",
            });
        }

        return res.json({ data });
    } catch (error) {
        console.error("Unexpected restaurant API error:", error);

        return res.status(500).json({
            error: "An unexpected error occurred.",
        });
    }
});


app.get("/api/restaurants/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("restaurants")
            .select(
                "id, name, description, address, area, city, google_maps_url, cover_image_url, created_at"
            )
            .eq("id", id)
            .eq("status", "approved")
            .maybeSingle();

        if (error) {
            console.error("Failed to fetch restaurant:", error.message);

            return res.status(500).json({
                error: "Unable to fetch restaurant.",
            });
        }

        if (!data) {
            return res.status(404).json({
                error: "Restaurant not found.",
            });
        }

        return res.json({ data });
    } catch (error) {
        console.error("Unexpected restaurant API error:", error);

        return res.status(500).json({
            error: "An unexpected error occurred.",
        });
    }
});


app.get("/api/restaurants/:id/menus", async (req, res) => {
    try {
        const { id } = req.params;

        // First, verify that the restaurant is approved.
        const { data: restaurant, error: restaurantError } =
            await supabase
                .from("restaurants")
                .select("id")
                .eq("id", id)
                .eq("status", "approved")
                .maybeSingle();

        if (restaurantError) {
            console.error(
                "Failed to verify restaurant:",
                restaurantError.message
            );

            return res.status(500).json({
                error: "Unable to fetch menu photos.",
            });
        }

        if (!restaurant) {
            return res.status(404).json({
                error: "Restaurant not found.",
            });
        }

        // Fetch only approved menu photos for this restaurant.
        const { data, error } = await supabase
            .from("menu_images")
            .select("id, restaurant_id, image_url, caption, created_at")
            .eq("restaurant_id", id)
            .eq("status", "approved")
            .order("created_at", { ascending: false });

        if (error) {
            console.error(
                "Failed to fetch menu photos:",
                error.message
            );

            return res.status(500).json({
                error: "Unable to fetch menu photos.",
            });
        }

        return res.json({ data });
    } catch (error) {
        console.error("Unexpected menu API error:", error);

        return res.status(500).json({
            error: "An unexpected error occurred.",
        });
    }
});

app.listen(PORT, () => {
    console.log(`SeeMenu server running on http://localhost:${PORT}`);
});