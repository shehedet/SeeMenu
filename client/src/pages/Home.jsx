import { useEffect, useMemo, useState } from "react";
import { ArrowDown, Search, Utensils } from "lucide-react";

import Navbar from "../components/Navbar";
import RestaurantCard from "../components/RestaurantCard";


function Home() {

    const [searchQuery, setSearchQuery] = useState("");
    const [restaurants, setRestaurants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function fetchRestaurants() {
            try {
                setIsLoading(true);
                setError("");

                const response = await fetch(
                    "http://localhost:5000/api/restaurants",
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    throw new Error("Unable to load restaurants.");
                }

                const result = await response.json();
                setRestaurants(result.data);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message || "Something went wrong.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }

        fetchRestaurants();

        return () => controller.abort();
    }, []);

    const filteredRestaurants = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) {
            return restaurants;
        }

        return restaurants.filter((restaurant) => {
            const searchableText = [
                restaurant.name,
                restaurant.description,
                restaurant.address,
                restaurant.area,
                restaurant.city,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(query);
        });
    }, [searchQuery, restaurants]);


    return (
        <div className="min-h-screen bg-paper text-ink">
            <Navbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

            <main>
                <section className="border-b border-line">
                    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
                        <p className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest">
                            <Utensils size={17} />
                            Your community food directory
                        </p>

                        <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                            Find the menu.
                            <br />
                            <span className="font-normal">
                                Know before you go.
                            </span>
                        </h1>

                        <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                            Explore food places across Bangladesh and discover
                            menus shared by the people who visit them.
                        </p>

                        <form
                            role="search"
                            className="mt-8 flex max-w-2xl items-center border-2 border-ink bg-white p-1"
                            onSubmit={(event) => event.preventDefault()}
                        >
                            <Search
                                size={20}
                                className="ml-3 shrink-0"
                            />

                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(event) =>
                                    setSearchQuery(event.target.value)
                                }
                                placeholder="Try biryani, Dhanmondi, or a restaurant..."
                                aria-label="Search food places"
                                className="min-w-0 flex-1 bg-transparent px-3 py-3 outline-none placeholder:text-muted"
                            />

                            <button
                                type="submit"
                                className="border-l-2 border-ink bg-mint px-4 py-3 text-sm font-bold hover:bg-teal sm:px-6"
                            >
                                Search
                            </button>
                        </form>

                        <p className="mt-3 text-sm text-muted">
                            Search by restaurant, food type, or area.
                        </p>
                    </div>
                </section>

                <section
                    id="restaurants"
                    className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
                >
                    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-5">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-widest">
                                Explore
                            </p>

                            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                                Food places
                            </h2>

                            <p className="mt-2 text-sm text-muted">
                                {isLoading
                                    ? "Loading places..."
                                    : error
                                        ? "Places unavailable"
                                        : searchQuery.trim()
                                            ? `${filteredRestaurants.length} matching places`
                                            : `${restaurants.length} places listed`}
                            </p>
                        </div>

                        <a
                            href="#restaurants"
                            className="flex items-center gap-2 border-b border-ink pb-1 text-sm font-semibold hover:border-teal"
                        >
                            Browse listings
                            <ArrowDown size={16} />
                        </a>
                    </div>

                    {isLoading ? (
                        <div className="border-y border-line py-12" role="status">
                            <p className="text-lg font-semibold">Loading food places...</p>
                            <p className="mt-2 text-sm text-muted">
                                Fetching the latest approved restaurant listings.
                            </p>
                        </div>
                    ) : error ? (
                        <div className="border-y border-line py-12" role="alert">
                            <h3 className="text-xl font-bold">
                                Couldn't load food places
                            </h3>
                            <p className="mt-2 text-muted">{error}</p>
                            <p className="mt-2 text-sm text-muted">
                                Check that your Express server is running on port 5000,
                                then reload the page.
                            </p>
                        </div>
                    ) : filteredRestaurants.length > 0 ? (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredRestaurants.map((restaurant) => (
                                <RestaurantCard
                                    key={restaurant.id}
                                    restaurant={restaurant}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="border-y border-line py-12">
                            <h3 className="text-xl font-bold">
                                {restaurants.length === 0
                                    ? "No food places yet"
                                    : "No matching places"}
                            </h3>

                            <p className="mt-2 text-muted">
                                {restaurants.length === 0
                                    ? "Approved restaurant listings will appear here."
                                    : "Try another restaurant name or area."}
                            </p>

                            {searchQuery.trim() && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="mt-5 border-2 border-ink bg-mint px-4 py-2 font-semibold hover:bg-teal"
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    )}
                </section>
            </main>

            <footer className="border-t-2 border-ink">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <p>
                        <span className="font-bold text-ink">SeeMenu</span>
                        {" "}— Menus made easier to find.
                    </p>
                    <p>Community-powered food discovery.</p>
                </div>
            </footer>
        </div>
    );
}

export default Home;