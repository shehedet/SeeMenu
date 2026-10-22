
import "dotenv/config";
import express from "express";
import cors from "cors";
import { supabase } from "./lib/supabase.js";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";


const app = express();
const PORT = process.env.PORT || 5000;



const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
].filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error("Origin not allowed by CORS"));
        },
    })
);



app.use(express.json());


async function authorizeModeratorOrAdmin(req, res) {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
        res.status(401).json({
            error: "Authentication is required.",
        });
        return null;
    }

    const accessToken = authorization.slice("Bearer ".length);

    const { data: authData, error: authError } =
        await supabase.auth.getUser(accessToken);

    if (authError || !authData.user) {
        res.status(401).json({
            error: "Your session is invalid or expired.",
        });
        return null;
    }

    const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("id", authData.user.id)
        .maybeSingle();

    if (profileError) {
        console.error("Role verification failed:", profileError.message);

        res.status(500).json({
            error: "Unable to verify permissions.",
        });
        return null;
    }

    if (!profile || !["moderator", "admin"].includes(profile.role)) {
        res.status(403).json({
            error: "Only moderators and admins can perform this action.",
        });
        return null;
    }

    return {
        user: authData.user,
        profile,
    };
}

function getPublicStoragePath(imageUrl, bucket) {
    if (!imageUrl) return null;

    try {
        const url = new URL(imageUrl);
        const marker = `/storage/v1/object/public/${bucket}/`;
        const index = url.pathname.indexOf(marker);

        if (index === -1) return null;

        return url.pathname
            .slice(index + marker.length)
            .split("/")
            .map((part) => decodeURIComponent(part))
            .join("/");
    } catch {
        return null;
    }
}

async function removeStorageFiles(bucket, paths) {
    const uniquePaths = [...new Set(paths.filter(Boolean))];

    if (uniquePaths.length === 0) {
        return null;
    }

    const { error } = await supabaseAdmin.storage
        .from(bucket)
        .remove(uniquePaths);

    if (error) {
        console.error(
            `Failed to remove files from ${bucket}:`,
            error.message
        );

        return error;
    }

    return null;
}



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



app.delete("/api/menu-images/:id", async (req, res) => {
    try {
        const authorized = await authorizeModeratorOrAdmin(req, res);
        if (!authorized) return;

        const { id } = req.params;

        const { data: menu, error: fetchError } = await supabaseAdmin
            .from("menu_images")
            .select("id, image_url")
            .eq("id", id)
            .maybeSingle();

        if (fetchError) {
            console.error("Failed to fetch menu image:", fetchError.message);
            return res.status(500).json({
                error: "Unable to find the menu image.",
            });
        }

        if (!menu) {
            return res.status(404).json({
                error: "Menu image not found.",
            });
        }

        const storagePath = getPublicStoragePath(
            menu.image_url,
            "menu-images"
        );

        if (
            menu.image_url &&
            menu.image_url.includes("/storage/v1/object/public/menu-images/") &&
            !storagePath
        ) {
            return res.status(500).json({
                error: "Could not identify the stored image file.",
            });
        }

        const storageError = await removeStorageFiles(
            "menu-images",
            [storagePath]
        );

        if (storageError) {
            return res.status(500).json({
                error: "Could not remove the image file. No database records were deleted.",
            });
        }

        const { error: deleteError } = await supabaseAdmin
            .from("menu_images")
            .delete()
            .eq("id", id);

        if (deleteError) {
            console.error("Failed to delete menu record:", deleteError.message);
            return res.status(500).json({
                error: "The image file was removed, but the database record could not be deleted. Please retry.",
            });
        }

        return res.json({
            success: true,
            message: "Menu image deleted.",
        });
    } catch (error) {
        console.error("Unexpected menu-image deletion error:", error);
        return res.status(500).json({
            error: "An unexpected error occurred.",
        });
    }
});



app.delete("/api/restaurants/:id", async (req, res) => {
    try {
        const authorized = await authorizeModeratorOrAdmin(req, res);
        if (!authorized) return;

        const { id } = req.params;

        const { data: restaurant, error: restaurantError } =
            await supabaseAdmin
                .from("restaurants")
                .select("id, name, cover_image_url")
                .eq("id", id)
                .maybeSingle();

        if (restaurantError) {
            console.error("Failed to fetch restaurant:", restaurantError.message);
            return res.status(500).json({
                error: "Unable to find the restaurant.",
            });
        }

        if (!restaurant) {
            return res.status(404).json({
                error: "Restaurant not found.",
            });
        }

        const { data: menus, error: menusError } = await supabaseAdmin
            .from("menu_images")
            .select("id, image_url")
            .eq("restaurant_id", id);

        if (menusError) {
            console.error("Failed to fetch menu images:", menusError.message);
            return res.status(500).json({
                error: "Unable to prepare the restaurant for deletion.",
            });
        }

        const menuPaths = (menus || []).map((menu) => {
            const path = getPublicStoragePath(
                menu.image_url,
                "menu-images"
            );

            if (
                menu.image_url &&
                menu.image_url.includes(
                    "/storage/v1/object/public/menu-images/"
                ) &&
                !path
            ) {
                throw new Error(
                    `Could not identify the storage path for menu image ${menu.id}.`
                );
            }

            return path;
        });

        const coverPath = getPublicStoragePath(
            restaurant.cover_image_url,
            "restaurant-covers"
        );

        if (
            restaurant.cover_image_url &&
            restaurant.cover_image_url.includes(
                "/storage/v1/object/public/restaurant-covers/"
            ) &&
            !coverPath
        ) {
            return res.status(500).json({
                error: "Could not identify the restaurant cover file.",
            });
        }

        const menuStorageError = await removeStorageFiles(
            "menu-images",
            menuPaths
        );

        if (menuStorageError) {
            return res.status(500).json({
                error: "Could not remove menu files. The restaurant was not deleted.",
            });
        }

        const coverStorageError = await removeStorageFiles(
            "restaurant-covers",
            [coverPath]
        );

        if (coverStorageError) {
            return res.status(500).json({
                error: "Could not remove the cover file. The restaurant was not deleted.",
            });
        }

        // Remove dependent menu-image rows first because their FK uses NO ACTION.
        const { error: deleteMenusError } = await supabaseAdmin
            .from("menu_images")
            .delete()
            .eq("restaurant_id", id);

        if (deleteMenusError) {
            console.error(
                "Failed to delete menu records:",
                deleteMenusError.message
            );

            return res.status(500).json({
                error: "Files were removed, but menu records could not be deleted. Please retry.",
            });
        }

        // Other dependent rows with ON DELETE CASCADE are handled by PostgreSQL.
        const { error: deleteRestaurantError } = await supabaseAdmin
            .from("restaurants")
            .delete()
            .eq("id", id);

        if (deleteRestaurantError) {
            console.error(
                "Failed to delete restaurant:",
                deleteRestaurantError.message
            );

            return res.status(500).json({
                error: "Menu records were removed, but the restaurant could not be deleted. Please retry.",
            });
        }

        return res.json({
            success: true,
            message: "Restaurant and associated content deleted.",
        });
    } catch (error) {
        console.error("Unexpected restaurant deletion error:", error);

        return res.status(500).json({
            error: error.message ||
                "An unexpected error occurred while deleting the restaurant.",
        });
    }
});



app.delete("/api/account", async (req, res) => {
    try {
        const authorization = req.headers.authorization;

        if (!authorization?.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "Authentication is required.",
            });
        }

        const accessToken = authorization.slice("Bearer ".length);

        // Verify the access token with Supabase Auth.
        const { data: authData, error: authError } =
            await supabase.auth.getUser(accessToken);

        if (authError || !authData.user) {
            return res.status(401).json({
                error: "Your session is invalid or expired. Please sign in again.",
            });
        }

        const userId = authData.user.id;

        // Only contributors and moderators may use this feature.
        // The role is read from the database, never from the request body.
        const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("id, role")
            .eq("id", userId)
            .maybeSingle();

        if (profileError) {
            console.error("Failed to check deletion eligibility:", profileError.message);

            return res.status(500).json({
                error: "Unable to verify account permissions.",
            });
        }

        if (profile && !["contributor", "moderator"].includes(profile.role)) {
            return res.status(403).json({
                error: "Account deletion is unavailable for this role.",
            });
        }

        // Remove the profile and anonymize linked content through FK rules.
        // This is safe to retry if the profile has already been removed.
        const { error: cleanupError } = await supabaseAdmin.rpc(
            "delete_own_profile_data",
            { p_user_id: userId }
        );

        if (cleanupError) {
            console.error("Failed to clean up profile:", cleanupError.message);

            return res.status(500).json({
                error: "Unable to prepare the account for deletion. Please try again.",
            });
        }

        // Delete the authenticated account using the trusted Admin API.
        const { error: deleteError } =
            await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
            console.error("Failed to delete Auth user:", deleteError.message);

            return res.status(500).json({
                error:
                    "Profile data was removed, but account deletion did not finish. Please retry or contact support.",
            });
        }

        return res.json({
            success: true,
            message: "Your account has been deleted.",
        });
    } catch (error) {
        console.error("Unexpected account deletion error:", error);

        return res.status(500).json({
            error: "An unexpected error occurred while deleting your account.",
        });
    }
});


app.listen(PORT, () => {
    console.log(`SeeMenu server running on http://localhost:${PORT}`);
});