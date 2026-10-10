
import { MapPin, Star, Utensils } from "lucide-react";
import { Link } from "react-router-dom";

function RestaurantCard({ restaurant }) {
    const location = [
        restaurant.area,
        restaurant.city,
    ]
        .filter(Boolean)
        .join(", ");

    const displayLocation =
        location || restaurant.address || "Location not provided";

    return (
        <Link to={`/restaurants/${restaurant.id}`} className="block min-w-0 border border-ink bg-paper transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
            <article>
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

                    <p className="mt-4 border-t border-line pt-3 text-sm text-muted">
                        Menu browsing will be available here.
                    </p>
                </div>
            </article>
        </Link>
    );
}

export default RestaurantCard;