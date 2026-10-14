import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, Upload, X } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const API_URL = "http://localhost:5000";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 10;
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

    const [searchParams] = useSearchParams();

    const [restaurantId, setRestaurantId] = useState(
        searchParams.get("restaurantId") || ""
    );
    const [caption, setCaption] = useState("");
    const [images, setImages] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);

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
    // useEffect(() => {
    //     if (!image) {
    //         setPreviewUrl("");
    //         return;
    //     }

    //     const objectUrl = URL.createObjectURL(image);
    //     setPreviewUrl(objectUrl);

    //     return () => URL.revokeObjectURL(objectUrl);
    // }, [image]);

    useEffect(() => {
        const urls = images.map((image) => URL.createObjectURL(image));

        setPreviewUrls(urls);

        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [images]);

    function handleImageChange(event) {
        const selectedFiles = Array.from(event.target.files || []);

        setError("");
        setSuccess("");

        if (selectedFiles.length === 0) return;

        if (selectedFiles.length > MAX_FILES) {
            setError(`Choose no more than ${MAX_FILES} images per batch.`);
            event.target.value = "";
            return;
        }

        const invalidType = selectedFiles.find(
            (file) => !Object.hasOwn(ALLOWED_TYPES, file.type)
        );

        if (invalidType) {
            setError("Every file must be a JPG, PNG, or WebP image.");
            event.target.value = "";
            return;
        }

        const oversizedFile = selectedFiles.find(
            (file) => file.size > MAX_FILE_SIZE
        );

        if (oversizedFile) {
            setError("Each image must be 5 MB or smaller.");
            event.target.value = "";
            return;
        }

        setImages((currentImages) => {
            const combined = [...currentImages, ...selectedFiles];
            const unique = combined.filter(
                (file, index, array) =>
                    array.findIndex(
                        (candidate) =>
                            candidate.name === file.name &&
                            candidate.size === file.size &&
                            candidate.lastModified === file.lastModified
                    ) === index
            );

            if (unique.length > MAX_FILES) {
                setError(`You can select up to ${MAX_FILES} images in total.`);
                return currentImages;
            }

            return unique;
        });

        event.target.value = "";
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (uploading) return;

        const allowedRoles = ["contributor", "moderator", "admin"];

        if (!user || !allowedRoles.includes(role)) {
            setError("You do not have permission to upload menu photos.");
            return;
        }

        if (restaurantsLoading || restaurantError) {
            setError("Wait until the restaurant list has loaded successfully.");
            return;
        }

        const selectedRestaurant = restaurants.find(
            (restaurant) => restaurant.id === restaurantId
        );

        if (!selectedRestaurant) {
            setError("Select a valid approved restaurant.");
            return;
        }

        if (images.length === 0) {
            setError("Choose at least one menu photo.");
            return;
        }

        if (images.length > MAX_FILES) {
            setError(`You can upload up to ${MAX_FILES} images per batch.`);
            return;
        }

        for (const image of images) {
            if (!Object.hasOwn(ALLOWED_TYPES, image.type)) {
                setError("Every file must be a JPG, PNG, or WebP image.");
                return;
            }

            if (image.size > MAX_FILE_SIZE) {
                setError("Each image must be 5 MB or smaller.");
                return;
            }
        }

        setUploading(true);

        // Track every file uploaded so we can clean up if the batch fails.
        const uploadedPaths = [];

        try {
            const menuImageRows = [];

            // 1. Upload each image to Supabase Storage.
            for (const image of images) {
                const extension = ALLOWED_TYPES[image.type];
                const filePath =
                    `${user.id}/${crypto.randomUUID()}.${extension}`;

                const { error: storageError } = await supabase.storage
                    .from("menu-images")
                    .upload(filePath, image, {
                        contentType: image.type,
                        cacheControl: "3600",
                        upsert: false,
                    });

                if (storageError) {
                    throw new Error(
                        `Failed to upload "${image.name}": ${storageError.message}`
                    );
                }

                uploadedPaths.push(filePath);

                // 2. Get the public URL for this image.
                const { data: publicUrlData } = supabase.storage
                    .from("menu-images")
                    .getPublicUrl(filePath);

                const imageUrl = publicUrlData?.publicUrl;

                if (!imageUrl) {
                    throw new Error(
                        `Could not generate a URL for "${image.name}".`
                    );
                }

                // Prepare one database row per image.
                menuImageRows.push({
                    restaurant_id: restaurantId,
                    uploaded_by: user.id,
                    image_url: imageUrl,
                    caption: caption.trim() || null,
                    status: "approved",
                });
            }

            // 3. Insert all image records in one database operation.
            const { error: databaseError } = await supabase
                .from("menu_images")
                .insert(menuImageRows);

            if (databaseError) {
                throw new Error(
                    `Could not save the menu images: ${databaseError.message}`
                );
            }

            // 4. Reset the image selection but keep the restaurant selected.
            setSuccess(
                `Successfully uploaded ${images.length} menu ${
                    images.length === 1 ? "image" : "images"
                }.`
            );

            setImages([]);
            setCaption("");

            const fileInput = document.getElementById("menu-images");

            if (fileInput) {
                fileInput.value = "";
            }
        } catch (err) {
            console.error("Menu image batch submission failed:", err);

            // Remove files uploaded by this batch if something failed.
            if (uploadedPaths.length > 0) {
                const { error: cleanupError } = await supabase.storage
                    .from("menu-images")
                    .remove(uploadedPaths);

                if (cleanupError) {
                    console.error(
                        "Could not clean up uploaded files:",
                        cleanupError.message
                    );
                }
            }

            setError(
                err.message ||
                    "Something went wrong while uploading the menu images."
            );
        } finally {
            setUploading(false);
        }
    }



    if (authLoading) {
        return <p className="p-6 text-ink">Checking authentication...</p>;
    }

    // if (!user || role !== "contributor") {
    if (!user || !["contributor", "moderator", "admin"].includes(role)) {
        return (
            <div className="min-h-screen bg-paper text-ink">
                <Navbar />

                <main className="mx-auto max-w-3xl px-5 py-16">
                    <h1 className="text-2xl font-bold">
                        Contributor access required
                    </h1>

                    <p className="mt-3 text-muted">
                        Sign in to upload menu photos.
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
                            htmlFor="menu-images"
                            className="mb-2 block text-sm font-semibold"
                        >
                            Menu photos
                        </label>

                        <p className="mb-3 text-sm text-muted">
                            Select up to 10 images. JPG, PNG, or WebP (Max 5 MB per image).
                        </p>

                        <input
                            id="menu-images"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={handleImageChange}
                            disabled={uploading || images.length >= MAX_FILES}
                            className="sr-only"
                        />

                        <label
                            htmlFor="menu-images"
                            className={`flex flex-col items-center justify-center border border-dashed border-line bg-white px-5 py-8 text-center hover:bg-mint/20 ${
                                uploading || images.length >= MAX_FILES
                                    ? "cursor-not-allowed opacity-50"
                                    : "cursor-pointer"
                            }`}
                        >
                            <ImagePlus size={32} />

                            <span className="mt-3 font-semibold">
                                Choose menu photos
                            </span>

                            <span className="mt-1 text-sm text-muted">
                                {images.length} of {MAX_FILES} images selected
                            </span>
                        </label>

                        {images.length > 0 && (
                            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {images.map((image, index) => (
                                    <div
                                        key={`${image.name}-${image.size}-${image.lastModified}`}
                                        className="min-w-0 border border-line p-3"
                                    >
                                        <div className="mb-3 flex items-start justify-between gap-2">
                                            <span className="break-all text-sm">
                                                {image.name}
                                            </span>

                                            <button
                                                type="button"
                                                disabled={uploading}
                                                onClick={() => {
                                                    setImages((currentImages) =>
                                                        currentImages.filter(
                                                            (_, imageIndex) =>
                                                                imageIndex !== index
                                                        )
                                                    );
                                                    setError("");
                                                    setSuccess("");
                                                }}
                                                className="shrink-0 p-2 hover:bg-pink disabled:opacity-50"
                                                aria-label={`Remove ${image.name}`}
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>

                                        <img
                                            src={previewUrls[index]}
                                            alt={`Preview of ${image.name}`}
                                            className="h-48 w-full object-contain"
                                        />

                                        <p className="mt-2 text-xs text-muted">
                                            {(image.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                    </div>
                                ))}
                            </div>
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
                            images.length === 0 ||
                            restaurantsLoading ||
                            Boolean(restaurantError) ||
                            restaurants.length === 0
                        }
                        className="inline-flex items-center justify-center gap-2 bg-ink px-6 py-3 font-semibold text-white hover:bg-ink/80 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Upload size={18} />
                        {uploading
                            ? `Uploading ${images.length} ${
                                images.length === 1 ? "image" : "images"
                            }...`
                            : `Upload ${images.length || ""} ${
                                images.length === 1 ? "image" : "images"
                            }`.trim()}
                    </button>



                </form>
            </main>
        </div>
    );
}

export default MenuUpload;