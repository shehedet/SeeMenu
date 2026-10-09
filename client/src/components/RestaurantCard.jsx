
import { MapPin, Star } from "lucide-react";

function RestaurantCard({ restaurant }) {
    return (
        <article className="min-w-0 border border-ink bg-paper">
            <img
                src={restaurant.image}
                alt={`${restaurant.name} venue`}
                loading="lazy"
                className="h-48 w-full border-b border-ink object-cover"
            />

            <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold leading-snug">
                        {restaurant.name}
                    </h3>

                    <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
                        <Star size={15} />
                        {restaurant.rating.toFixed(1)}
                    </span>
                </div>

                <p className="mt-2 flex items-start gap-2 text-sm text-muted">
                    <MapPin size={16} className="mt-0.5 shrink-0" />
                    <span>
                        {restaurant.area}, {restaurant.city}
                    </span>
                </p>

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

                <p className="mt-4 border-t border-line pt-3 text-sm text-muted">
                    Menu browsing will be available here.
                </p>
            </div>
        </article>
    );
}

export default RestaurantCard;