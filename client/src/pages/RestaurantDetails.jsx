
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Utensils, ExternalLink, X } from "lucide-react";

import Navbar from "../components/Navbar";

function RestaurantDetails() {
    const { id } = useParams();

    const [restaurant, setRestaurant] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [menuImages, setMenuImages] = useState([]);
    const [isMenusLoading, setIsMenusLoading] = useState(true);
    const [menusError, setMenusError] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchRestaurant() {
            try {
                setIsLoading(true);
                setError("");
                setRestaurant(null);

                const response = await fetch(
                    `http://localhost:5000/api/restaurants/${id}`,
                    { signal: controller.signal }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.error || "Unable to load this restaurant."
                    );
                }

                setRestaurant(result.data);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(
                        err.message || "Something went wrong."
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }

        fetchRestaurant();

        return () => controller.abort();
    }, [id]);


    useEffect(() => {
        const controller = new AbortController();

        async function fetchMenuImages() {
            try {
                setIsMenusLoading(true);
                setMenusError("");

                const response = await fetch(
                    `http://localhost:5000/api/restaurants/${id}/menus`,
                    { signal: controller.signal }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.error || "Unable to load menu photos."
                    );
                }

                setMenuImages(result.data);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setMenusError(
                        err.message || "Something went wrong."
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsMenusLoading(false);
                }
            }
        }

        fetchMenuImages();

        return () => controller.abort();
    }, [id]);


    const location = restaurant
        ? [
              restaurant.address,
              restaurant.area,
              restaurant.city,
          ]
              .filter(Boolean)
              .filter((value, index, array) =>
                  array.indexOf(value) === index
              )
              .join(", ")
        : "";

    return (
        <div className="min-h-screen bg-paper text-ink">
            <Navbar />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 border-b border-ink pb-1 text-sm font-semibold hover:border-teal"
                >
                    <ArrowLeft size={16} />
                    Back to listings
                </Link>

                {isLoading ? (
                    <section
                        className="border-y border-line py-16"
                        role="status"
                    >
                        <h1 className="text-2xl font-bold">
                            Loading restaurant...
                        </h1>
                        <p className="mt-2 text-muted">
                            Fetching restaurant details.
                        </p>
                    </section>
                ) : error ? (
                    <section
                        className="border-y border-line py-16"
                        role="alert"
                    >
                        <h1 className="text-2xl font-bold">
                            Couldn't load restaurant
                        </h1>
                        <p className="mt-3 text-muted">{error}</p>

                        <Link
                            to="/"
                            className="mt-5 inline-block border-2 border-ink bg-mint px-4 py-2 font-semibold hover:bg-teal"
                        >
                            Return home
                        </Link>
                    </section>
                ) : restaurant ? (
                    <>
                        <section className="mt-8 border-b-2 border-ink pb-8 sm:mt-12 sm:pb-10">
                            {restaurant.cover_image_url ? (
                                <img
                                    src={restaurant.cover_image_url}
                                    alt={`${restaurant.name} venue`}
                                    className="mb-8 h-56 w-full border border-ink object-cover sm:h-80 lg:h-96"
                                />
                            ) : (
                                <div className="mb-8 flex h-56 items-center justify-center border border-ink bg-mint sm:h-80 lg:h-96">
                                    <Utensils
                                        size={56}
                                        strokeWidth={1.3}
                                    />
                                </div>
                            )}

                            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest">
                                <Utensils size={16} />
                                Restaurant details
                            </p>

                            <h1 className="mt-4 max-w-4xl break-words text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
                                {restaurant.name}
                            </h1>

                            {restaurant.description && (
                                <p className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg">
                                    {restaurant.description}
                                </p>
                            )}

                            <div className="mt-6 flex flex-wrap items-start gap-x-6 gap-y-4">
                                {location && (
                                    <p className="flex items-start gap-2 text-sm sm:text-base">
                                        <MapPin
                                            size={19}
                                            className="mt-0.5 shrink-0"
                                        />
                                        <span>{location}</span>
                                    </p>
                                )}

                                {restaurant.google_maps_url && (
                                    <a
                                        href={restaurant.google_maps_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 border-b border-ink pb-1 text-sm font-semibold hover:border-teal"
                                    >
                                        View on Google Maps
                                        <ExternalLink size={15} />
                                    </a>
                                )}
                            </div>
                        </section>

                        
                        <section className="py-10 sm:py-12">
                            <p className="text-sm font-semibold uppercase tracking-widest">
                                Menu
                            </p>

                            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                                Explore the menu
                            </h2>

                            {isMenusLoading ? (
                                <div className="mt-6 border-y border-line py-10" role="status">
                                    <p className="font-semibold">Loading menu photos...</p>
                                </div>
                            ) : menusError ? (
                                <div className="mt-6 border-y border-line py-10" role="alert">
                                    <h3 className="font-bold">Couldn't load menu photos</h3>
                                    <p className="mt-2 text-sm text-muted">{menusError}</p>
                                </div>
                            ) : menuImages.length > 0 ? (
                                <>
                                    <p className="mt-3 text-sm text-muted">
                                        {menuImages.length} approved{" "}
                                        {menuImages.length === 1 ? "photo" : "photos"}
                                    </p>

                                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                        {menuImages.map((menu) => (
                                            <button
                                                key={menu.id}
                                                type="button"
                                                onClick={() => setSelectedImage(menu)}
                                                className="group min-w-0 border border-ink text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                                                aria-label={`View menu photo${menu.caption ? `: ${menu.caption}` : ""}`}
                                            >
                                                <img
                                                    src={menu.image_url}
                                                    alt={menu.caption || "Restaurant menu"}
                                                    loading="lazy"
                                                    className="h-48 w-full object-cover transition-opacity group-hover:opacity-80 sm:h-60"
                                                />

                                                {menu.caption && (
                                                    <span className="block border-t border-line p-2 text-sm">
                                                        {menu.caption}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="mt-6 border-y border-line py-10">
                                    <Utensils size={32} strokeWidth={1.4} />

                                    <h3 className="mt-4 text-lg font-bold">
                                        No menu photos yet
                                    </h3>

                                    <p className="mt-2 max-w-xl leading-6 text-muted">
                                        Menu photos shared by the community will appear here
                                        once they have been approved.
                                    </p>
                                </div>
                            )}
                        </section>
                    </>
                ) : null}

                
                {selectedImage && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4"
                        onClick={() => setSelectedImage(null)}
                        onKeyDown={(event) => {
                            if (event.key === "Escape") {
                                setSelectedImage(null);
                            }
                        }}
                        role="presentation"
                    >
                        <div
                            className="relative max-h-full w-full max-w-4xl"
                            onClick={(event) => event.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Enlarged menu photo"
                        >
                            <button
                                type="button"
                                onClick={() => setSelectedImage(null)}
                                className="mb-3 ml-auto flex items-center gap-2 border border-paper bg-paper px-3 py-2 text-sm font-semibold text-ink"
                            >
                                Close <X size={18} />
                            </button>

                            <img
                                src={selectedImage.image_url}
                                alt={selectedImage.caption || "Restaurant menu"}
                                className="mx-auto max-h-[75vh] w-auto max-w-full object-contain"
                            />

                            {selectedImage.caption && (
                                <p className="mt-3 text-center text-sm text-paper">
                                    {selectedImage.caption}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <footer className="border-t-2 border-ink">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <p>
                        <span className="font-bold text-ink">
                            SeeMenu
                        </span>{" "}
                        — Menus made easier to find.
                    </p>
                    <p>Community-powered food discovery.</p>
                </div>
            </footer>
        </div>
    );
}

export default RestaurantDetails;