
import { useState } from "react";
import { MapPin, Star, Utensils, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

function RestaurantCard({ restaurant, onDeleted }) {
    const { user, profile } = useAuth();

    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const canDelete =
        user && ["moderator", "admin"].includes(profile?.role);

    const location = [
        restaurant.area,
        restaurant.city,
    ]
        .filter(Boolean)
        .join(", ");

    const displayLocation =
        location || restaurant.address || "Location not provided";

    const handleDelete = async () => {
        const confirmed = window.confirm(
            `Permanently delete "${restaurant.name}"?\n\n` +
            "This will also delete its menu photos and associated records. " +
            "This action cannot be undone."
        );

        if (!confirmed) return;

        setIsDeleting(true);
        setDeleteError("");

        try {
            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError) {
                throw sessionError;
            }

            const token = session?.access_token;

            if (!token) {
                throw new Error("Your session has expired. Please log in again.");
            }

            const response = await fetch(
                `${API_URL}/api/restaurants/${restaurant.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    result.error || "Failed to delete the restaurant."
                );
            }

            onDeleted?.(restaurant.id);
        } catch (error) {
            setDeleteError(
                error.message || "Something went wrong while deleting."
            );
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <article className="min-w-0 border border-ink bg-paper">
            <Link
                to={`/restaurants/${restaurant.id}`}
                className="block min-w-0 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
                {restaurant.cover_image_url ? (
                    <img
                        src={restaurant.cover_image_url}
                        alt={`${restaurant.name} venue`}
                        loading="lazy"
                        className="h-48 w-full border-b border-ink object-cover"
                    />
                ) : (
                    <div
                        className="flex h-48 items-center justify-center border-b border-ink bg-mint"
                        aria-label="No restaurant image available"
                    >
                        <Utensils size={40} strokeWidth={1.5} />
                    </div>
                )}

                <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-bold leading-snug">
                            {restaurant.name}
                        </h3>

                        {typeof restaurant.rating === "number" && (
                            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
                                <Star size={15} />
                                {restaurant.rating.toFixed(1)}
                            </span>
                        )}
                    </div>

                    <p className="mt-2 flex items-start gap-2 text-sm text-muted">
                        <MapPin size={16} className="mt-0.5 shrink-0" />
                        <span>{displayLocation}</span>
                    </p>

                    {restaurant.description && (
                        <p className="mt-3 text-sm leading-6 text-muted">
                            {restaurant.description}
                        </p>
                    )}

                    {Array.isArray(restaurant.foodTypes) &&
                        restaurant.foodTypes.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {restaurant.foodTypes.map((type) => (
                                    <span
                                        key={type}
                                        className="border border-line px-2 py-1 text-xs font-medium"
                                    >
                                        {type}
                                    </span>
                                ))}
                            </div>
                        )}
                </div>
            </Link>

            {canDelete && (
                <div className="border-t border-ink p-3">
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex w-full items-center justify-center gap-2 border border-ink px-3 py-2 text-sm font-semibold transition-colors hover:bg-rose disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Trash2 size={16} />
                        {isDeleting
                            ? "Deleting..."
                            : "Delete this restaurant"}
                    </button>

                    {deleteError && (
                        <p
                            role="alert"
                            className="mt-2 text-sm text-red-700"
                        >
                            {deleteError}
                        </p>
                    )}
                </div>
            )}
        </article>
    );
}

export default RestaurantCard;
