
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ImagePlus, Upload, X } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const API_URL = "http://localhost:5000";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
};

function MenuUpload() {
    const { user, role, loading: authLoading } = useAuth();

    const [restaurants, setRestaurants] = useState([]);
    const [restaurantsLoading, setRestaurantsLoading] = useState(true);
    const [restaurantError, setRestaurantError] = useState("");

    const [restaurantId, setRestaurantId] = useState("");
    const [caption, setCaption] = useState("");
    const [image, setImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [uploading, setUploading] = useState(false);

    // Load approved restaurants for the dropdown.
    useEffect(() => {
        const controller = new AbortController();

        async function fetchRestaurants() {
            try {
                setRestaurantsLoading(true);
                setRestaurantError("");

                const response = await fetch(
                    `${API_URL}/api/restaurants`,
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    throw new Error("Could not load restaurants.");
                }

                const result = await response.json();
                setRestaurants(result.data ?? []);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setRestaurantError(err.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setRestaurantsLoading(false);
                }
            }
        }

        fetchRestaurants();

        return () => controller.abort();
    }, []);

    // Create and clean up the local image preview URL.
    useEffect(() => {
        if (!image) {
            setPreviewUrl("");
            return;
        }

        const objectUrl = URL.createObjectURL(image);
        setPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [image]);

    function handleImageChange(event) {
        const selectedFile = event.target.files?.[0];

        setError("");
        setSuccess("");
        setImage(null);

        if (!selectedFile) return;

        if (!Object.hasOwn(ALLOWED_TYPES, selectedFile.type)) {
            setError("Choose a JPG, PNG, or WebP image.");
            event.target.value = "";
            return;
        }

        if (selectedFile.size > MAX_FILE_SIZE) {
            setError("The image must be 5 MB or smaller.");
            event.target.value = "";
            return;
        }

        setImage(selectedFile);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (uploading) return;

        if (!user || role !== "contributor") {
            setError("Sign in with a contributor account to upload menu photos.");
            return;
        }

        if (restaurantsLoading || restaurantError) {
            setError("Wait until the restaurant list has loaded successfully.");
            return;
        }

        // Confirm the restaurant exists in the approved list loaded by the API.
        const selectedRestaurant = restaurants.find(
            (restaurant) => restaurant.id === restaurantId
        );

        if (!selectedRestaurant) {
            setError("Select a valid approved restaurant.");
            return;
        }

        if (!image) {
            setError("Choose a menu photo before submitting.");
            return;
        }

        const extension = ALLOWED_TYPES[image.type];

        if (!extension) {
            setError("Choose a JPG, PNG, or WebP image.");
            return;
        }

        if (image.size > MAX_FILE_SIZE) {
            setError("The image must be 5 MB or smaller.");
            return;
        }

        setUploading(true);

        // Each upload gets a unique path inside the contributor's folder.
        const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

        let storageUploadSucceeded = false;

        try {
            // 1. Upload the image file.
            const { error: storageError } = await supabase.storage
                .from("menu-images")
                .upload(filePath, image, {
                    contentType: image.type,
                    cacheControl: "3600",
                    upsert: false,
                });

            if (storageError) {
                throw new Error(
                    `Image upload failed: ${storageError.message}`
                );
            }

            storageUploadSucceeded = true;

            // 2. Get its URL. The public bucket allows direct image viewing.
            const { data: publicUrlData } = supabase.storage
                .from("menu-images")
                .getPublicUrl(filePath);

            const imageUrl = publicUrlData?.publicUrl;

            if (!imageUrl) {
                throw new Error("Could not generate the image URL.");
            }

            // 3. Create a pending submission in PostgreSQL.
            const { error: databaseError } = await supabase
                .from("menu_images")
                .insert({
                    restaurant_id: restaurantId,
                    uploaded_by: user.id,
                    image_url: imageUrl,
                    caption: caption.trim() || null,
                    status: "approved",
                });

            if (databaseError) {
                throw new Error(
                    `Could not save the submission: ${databaseError.message}`
                );
            }

            // 4. Clear the form only after the database insert succeeds.
            setSuccess(
                "Menu photo submitted successfully! It is awaiting moderator review."
            );

            setRestaurantId("");
            setCaption("");
            setImage(null);

            const fileInput = document.getElementById("menu-image");

            if (fileInput) {
                fileInput.value = "";
            }
        } catch (err) {
            console.error("Menu image submission failed:", err);

            if (storageUploadSucceeded) {
                // The database insert may have failed after the file upload.
                // Attempt cleanup, but don't grant broad delete permissions
                // just to make this operation work.
                const { error: cleanupError } = await supabase.storage
                    .from("menu-images")
                    .remove([filePath]);

                if (cleanupError) {
                    console.error(
                        "Could not remove the uploaded file:",
                        cleanupError.message
                    );
                }
            }

            setError(
                err.message ||
                    "Something went wrong while submitting the menu photo."
            );
        } finally {
            setUploading(false);
        }
    }

    if (authLoading) {
        return <p className="p-6 text-ink">Checking authentication...</p>;
    }

    if (!user || role !== "contributor") {
        return (
            <div className="min-h-screen bg-paper text-ink">
                <Navbar />

                <main className="mx-auto max-w-3xl px-5 py-16">
                    <h1 className="text-2xl font-bold">
                        Contributor access required
                    </h1>

                    <p className="mt-3 text-muted">
                        Sign in with a contributor account to upload menu photos.
                    </p>

                    <Link
                        to="/"
                        className="mt-6 inline-flex items-center gap-2 underline"
                    >
                        <ArrowLeft size={18} />
                        Back to home
                    </Link>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-paper text-ink">
            <Navbar />

            <main className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
                >
                    <ArrowLeft size={17} />
                    Back to restaurants
                </Link>

                <header className="mt-8 border-b border-line pb-6">
                    <p className="text-sm font-semibold uppercase tracking-wider text-muted">
                        Community contribution
                    </p>

                    <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                        Upload a menu
                    </h1>

                    <p className="mt-3 max-w-xl leading-7 text-muted">
                        Help people discover what restaurants serve. Your photo
                        will be reviewed before it appears publicly.
                    </p>
                </header>

                <form
                    className="mt-8 space-y-7"
                    onSubmit={handleSubmit}
                >
                    <div>
                        <label
                            htmlFor="restaurant"
                            className="mb-2 block text-sm font-semibold"
                        >
                            Restaurant
                        </label>

                        <select
                            id="restaurant"
                            value={restaurantId}
                            onChange={(event) => {
                                setRestaurantId(event.target.value);
                                setError("");
                                setSuccess("");
                            }}
                            required
                            disabled={restaurantsLoading || uploading}
                            className="w-full border border-line bg-white px-4 py-3 outline-none focus:border-ink"
                        >
                            <option value="">
                                {restaurantsLoading
                                    ? "Loading restaurants..."
                                    : "Select a restaurant"}
                            </option>

                            {restaurants.map((restaurant) => (
                                <option
                                    key={restaurant.id}
                                    value={restaurant.id}
                                >
                                    {restaurant.name}
                                    {restaurant.area
                                        ? ` — ${restaurant.area}`
                                        : ""}
                                </option>
                            ))}
                        </select>

                        {restaurantError && (
                            <p className="mt-2 text-sm text-red-700">
                                {restaurantError}
                            </p>
                        )}

                        {!restaurantsLoading &&
                            !restaurantError &&
                            restaurants.length === 0 && (
                                <p className="mt-2 text-sm text-muted">
                                    No approved restaurants are available yet.
                                </p>
                            )}
                    </div>

                    <div>
                        <label
                            htmlFor="menu-image"
                            className="mb-2 block text-sm font-semibold"
                        >
                            Menu photo
                        </label>

                        <input
                            id="menu-image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageChange}
                            required
                            disabled={uploading}
                            className="sr-only"
                        />

                        {previewUrl ? (
                            <div className="border border-line p-3">
                                <div className="flex items-center justify-between gap-3 pb-3">
                                    <span className="flex items-center gap-2 text-sm">
                                        <ImagePlus size={18} />
                                        <span className="break-all">
                                            {image.name}
                                        </span>
                                    </span>

                                    <button
                                        type="button"
                                        disabled={uploading}
                                        onClick={() => {
                                            setImage(null);
                                            setError("");

                                            const input =
                                                document.getElementById(
                                                    "menu-image"
                                                );

                                            if (input) input.value = "";
                                        }}
                                        className="p-2 hover:bg-pink disabled:opacity-50"
                                        aria-label="Remove selected image"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <img
                                    src={previewUrl}
                                    alt="Selected menu preview"
                                    className="max-h-96 w-full object-contain"
                                />
                            </div>
                        ) : (
                            <label
                                htmlFor="menu-image"
                                className={`flex flex-col items-center justify-center border border-dashed border-line bg-white px-5 py-12 text-center hover:bg-mint/20 ${
                                    uploading
                                        ? "cursor-not-allowed opacity-50"
                                        : "cursor-pointer"
                                }`}
                            >
                                <ImagePlus size={32} />

                                <span className="mt-3 font-semibold">
                                    Choose a menu photo
                                </span>

                                <span className="mt-1 text-sm text-muted">
                                    JPG, PNG, or WebP · Maximum 5 MB
                                </span>
                            </label>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="caption"
                            className="mb-2 block text-sm font-semibold"
                        >
                            Caption
                            <span className="ml-2 font-normal text-muted">
                                (optional)
                            </span>
                        </label>

                        <textarea
                            id="caption"
                            value={caption}
                            onChange={(event) => {
                                setCaption(event.target.value);
                                setError("");
                                setSuccess("");
                            }}
                            maxLength={200}
                            rows={3}
                            disabled={uploading}
                            placeholder="e.g. Lunch menu, October 2026"
                            className="w-full resize-y border border-line bg-white px-4 py-3 outline-none focus:border-ink"
                        />

                        <p className="mt-1 text-right text-xs text-muted">
                            {caption.length}/200
                        </p>
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="border border-pink bg-pink/30 p-3 text-sm"
                        >
                            {error}
                        </p>
                    )}

                    {success && (
                        <p
                            role="status"
                            className="border border-line bg-mint/20 p-3 text-sm"
                        >
                            {success}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={
                            uploading ||
                            !restaurantId ||
                            !image ||
                            restaurantsLoading ||
                            Boolean(restaurantError) ||
                            restaurants.length === 0
                        }
                        className="inline-flex items-center justify-center gap-2 bg-ink px-6 py-3 font-semibold text-white hover:bg-ink/80 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Upload size={18} />
                        {uploading ? "Uploading..." : "Submit menu photo"}
                    </button>
                </form>
            </main>
        </div>
    );
}

export default MenuUpload;