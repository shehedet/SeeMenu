
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

const initialForm = {
    name: "",
    description: "",
    address: "",
    area: "",
    city: "",
    google_maps_url: "",
    // cover_image_url: "",
};

function CreateRestaurant() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState(initialForm);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [coverFile, setCoverFile] = useState(null);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!user || !["moderator", "admin"].includes(profile?.role)) {
            setError("You are not authorized to create restaurants.");
            return;
        }

        if (!form.name.trim()) {
            setError("Restaurant name is required.");
            return;
        }

        const allowedTypes = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
        };

        if (coverFile && !allowedTypes[coverFile.type]) {
            setError("Please select a JPEG, PNG, or WebP image.");
            return;
        }

        if (coverFile && coverFile.size > 5 * 1024 * 1024) {
            setError("The cover photo must be 5 MB or smaller.");
            return;
        }

        setIsSubmitting(true);

        let uploadedPath = null;

        try {
            const restaurantId = crypto.randomUUID();
            let coverUrl = null;

            if (coverFile) {
                const extension = allowedTypes[coverFile.type];

                uploadedPath =
                    `${restaurantId}/${crypto.randomUUID()}.${extension}`;

                const { error: uploadError } = await supabase.storage
                    .from("restaurant-covers")
                    .upload(uploadedPath, coverFile, {
                        contentType: coverFile.type,
                        upsert: false,
                    });

                if (uploadError) {
                    throw uploadError;
                }

                const { data: publicUrlData } = supabase.storage
                    .from("restaurant-covers")
                    .getPublicUrl(uploadedPath);

                coverUrl = publicUrlData.publicUrl;
            }

            const now = new Date().toISOString();

            const { data, error: insertError } = await supabase
                .from("restaurants")
                .insert({
                    id: restaurantId,
                    name: form.name.trim(),
                    description: form.description.trim() || null,
                    address: form.address.trim() || null,
                    area: form.area.trim() || null,
                    city: form.city.trim() || null,
                    google_maps_url: form.google_maps_url.trim() || null,
                    cover_image_url: coverUrl,
                    status: "approved",
                    created_by: user.id,
                    created_at: now,
                    updated_at: now,
                })
                .select("id")
                .single();

            if (insertError) {
                throw insertError;
            }

            navigate(`/restaurants/${data.id}`);
        } catch (err) {
            if (uploadedPath) {
                const { error: cleanupError } = await supabase.storage
                    .from("restaurant-covers")
                    .remove([uploadedPath]);

                if (cleanupError) {
                    console.error(
                        "Could not remove the uploaded cover photo:",
                        cleanupError
                    );
                }
            }

            setError(
                err.message ||
                    "Unable to create the restaurant. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="min-h-screen bg-paper text-ink">
            <Navbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

            <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
                <Link
                    to="/"
                    className="text-sm font-semibold underline underline-offset-4 hover:text-teal"
                >
                    ← Back to food places
                </Link>

                <header className="mt-8 border-b-2 border-ink pb-5">
                    <p className="text-sm font-semibold uppercase tracking-widest">
                        Moderator / Admin
                    </p>
                    <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                        Create a restaurant
                    </h1>
                    <p className="mt-3 text-muted">
                        Add a new food place directly to SeeMenu. It will be
                        published without going through the suggestion queue.
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div>
                        <label
                            htmlFor="name"
                            className="mb-2 block text-sm font-bold"
                        >
                            Restaurant name *
                        </label>
                        <input
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            maxLength={150}
                            placeholder="e.g. Star Kabab"
                            className="w-full border-2 border-ink bg-white px-4 py-3 outline-none focus:border-teal"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="description"
                            className="mb-2 block text-sm font-bold"
                        >
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Tell visitors about this food place..."
                            className="w-full border-2 border-ink bg-white px-4 py-3 outline-none focus:border-teal"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="address"
                            className="mb-2 block text-sm font-bold"
                        >
                            Street address
                        </label>
                        <input
                            id="address"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            placeholder="House, road, or street address"
                            className="w-full border-2 border-ink bg-white px-4 py-3 outline-none focus:border-teal"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="area"
                                className="mb-2 block text-sm font-bold"
                            >
                                Area / neighbourhood
                            </label>
                            <input
                                id="area"
                                name="area"
                                value={form.area}
                                onChange={handleChange}
                                placeholder="e.g. Dhanmondi"
                                className="w-full border-2 border-ink bg-white px-4 py-3 outline-none focus:border-teal"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="city"
                                className="mb-2 block text-sm font-bold"
                            >
                                City
                            </label>
                            <input
                                id="city"
                                name="city"
                                value={form.city}
                                onChange={handleChange}
                                placeholder="e.g. Dhaka"
                                className="w-full border-2 border-ink bg-white px-4 py-3 outline-none focus:border-teal"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="google_maps_url"
                            className="mb-2 block text-sm font-bold"
                        >
                            Google Maps URL
                        </label>
                        <input
                            id="google_maps_url"
                            name="google_maps_url"
                            type="url"
                            value={form.google_maps_url}
                            onChange={handleChange}
                            placeholder="https://maps.google.com/..."
                            className="w-full border-2 border-ink bg-white px-4 py-3 outline-none focus:border-teal"
                        />
                    </div>

                    {/* <div>
                        <label
                            htmlFor="cover_image_url"
                            className="mb-2 block text-sm font-bold"
                        >
                            Cover image URL
                        </label>
                        <input
                            id="cover_image_url"
                            name="cover_image_url"
                            type="url"
                            value={form.cover_image_url}
                            onChange={handleChange}
                            placeholder="https://..."
                            className="w-full border-2 border-ink bg-white px-4 py-3 outline-none focus:border-teal"
                        />
                    </div> */}

                    
                    <div>
                        <label
                            htmlFor="cover_image"
                            className="mb-2 block text-sm font-bold"
                        >
                            Cover photo
                        </label>

                        <input
                            id="cover_image"
                            name="cover_image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) => {
                                setCoverFile(event.target.files?.[0] || null);
                            }}
                            className="w-full border-2 border-ink bg-white px-4 py-3 file:mr-4 file:border-0 file:bg-mint file:px-3 file:py-2 file:font-bold"
                        />

                        <p className="mt-2 text-sm text-muted">
                            Optional. JPEG, PNG, or WebP. Maximum size: 5 MB.
                        </p>

                        {coverFile && (
                            <p className="mt-2 text-sm">
                                Selected: {coverFile.name}
                            </p>
                        )}
                    </div>



                    {error && (
                        <p
                            role="alert"
                            className="border-l-4 border-red-600 bg-pink px-4 py-3 text-sm"
                        >
                            {error}
                        </p>
                    )}

                    <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="border-2 border-ink bg-mint px-6 py-3 font-bold hover:bg-teal disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting
                                ? "Creating restaurant..."
                                : "Create restaurant"}
                        </button>

                        <Link
                            to="/"
                            className="border-2 border-ink px-6 py-3 text-center font-bold hover:bg-pink"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default CreateRestaurant;
