
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
    ArrowLeft,
    MapPin,
    Utensils,
    ExternalLink,
    X,
    Flag,
    ThumbsUp,
    ThumbsDown,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

function RestaurantDetails() {
    const { id } = useParams();

    const [restaurant, setRestaurant] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [menuImages, setMenuImages] = useState([]);
    const [isMenusLoading, setIsMenusLoading] = useState(true);
    const [menusError, setMenusError] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);

    const { user, profile, loading: authLoading } = useAuth();
    const [reportingImage, setReportingImage] = useState(null);
    const [reportReason, setReportReason] = useState("");
    const [reportDetails, setReportDetails] = useState("");
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [reportError, setReportError] = useState("");
    const [reportSuccess, setReportSuccess] = useState("");
   
    const [likeCount, setLikeCount] = useState(0);
    const [dislikeCount, setDislikeCount] = useState(0);
    const [userVote, setUserVote] = useState(null);
    const [votesLoading, setVotesLoading] = useState(true);
    const [voteSubmitting, setVoteSubmitting] = useState(false);
    const [votesError, setVotesError] = useState("");

    const [menuVotes, setMenuVotes] = useState({});
    const [menuVotesLoading, setMenuVotesLoading] = useState(true);
    const [submittingMenuVoteId, setSubmittingMenuVoteId] = useState(null);
    const [menuVotesError, setMenuVotesError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function fetchRestaurant() {
            try {
                setIsLoading(true);
                setError("");
                setRestaurant(null);

                
                const API_URL =
                    import.meta.env.VITE_API_URL || "http://localhost:5000";

                const response = await fetch(
                    `${API_URL}/api/restaurants/${id}`,
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

                const API_URL =
                    import.meta.env.VITE_API_URL || "http://localhost:5000";

                const response = await fetch(
                    `${API_URL}/api/restaurants/${id}/menus`,
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


    


    const openReportForm = (menu) => {
        setReportingImage(menu);
        setReportReason("");
        setReportDetails("");
        setReportError("");
        setReportSuccess("");
    };

    const closeReportForm = () => {
        setReportingImage(null);
        setReportReason("");
        setReportDetails("");
        setReportError("");
        setReportSuccess("");
    };

    const handleReportSubmit = async (event) => {
        event.preventDefault();

        if (!user) {
            setReportError("Please log in before submitting a report.");
            return;
        }

        if (!reportingImage?.id) {
            setReportError("Unable to identify the menu photo.");
            return;
        }

        if (!reportReason) {
            setReportError("Please select a reason for reporting this photo.");
            return;
        }

        if (reportSubmitting) return;

        setReportSubmitting(true);
        setReportError("");
        setReportSuccess("");

        try {
            const { error: submitError } = await supabase
                .from("reports")
                .insert({
                    reported_by: user.id,
                    menu_image_id: reportingImage.id,
                    reason: reportReason,
                    details: reportDetails.trim() || null,
                    status: "pending",
                });

            if (submitError) {
                if (submitError.code === "23505") {
                    throw new Error(
                        "You have already reported this menu photo."
                    );
                }

                if (submitError.code === "42501") {
                    throw new Error(
                        "You do not have permission to submit this report."
                    );
                }

                if (submitError.code === "23503") {
                    throw new Error(
                        "This menu photo no longer exists or is unavailable."
                    );
                }

                throw new Error(
                    submitError.message || "Unable to submit your report."
                );
            }

            setReportSuccess(
                "Report submitted. A moderator will review this photo."
            );
            setReportReason("");
            setReportDetails("");
        } catch (err) {
            setReportError(err.message || "Something went wrong.");
        } finally {
            setReportSubmitting(false);
        }
    };




    const refreshMenuImageVotes = useCallback(async () => {
        setMenuVotesLoading(true);
        setMenuVotesError("");

        try {
            if (menuImages.length === 0) {
            setMenuVotes({});
            return;
            }

            const menuImageIds = menuImages.map((menu) => menu.id);

            const { data, error } = await supabase
            .from("menu_image_votes")
            .select("menu_image_id, user_id, vote")
            .in("menu_image_id", menuImageIds);

            if (error) throw error;

            const nextVotes = {};

            for (const menu of menuImages) {
            nextVotes[menu.id] = {
                upvoteCount: 0,
                downvoteCount: 0,
                userVote: null,
            };
            }

            for (const vote of data ?? []) {
            const photoVote = nextVotes[vote.menu_image_id];

            if (!photoVote) continue;

            if (vote.vote === "upvote") {
                photoVote.upvoteCount += 1;
            } else if (vote.vote === "downvote") {
                photoVote.downvoteCount += 1;
            }

            if (user && vote.user_id === user.id) {
                photoVote.userVote = vote.vote;
            }
            }

            setMenuVotes(nextVotes);
        } catch (error) {
            console.error("Error fetching menu photo votes:", error);
            setMenuVotesError("Could not load menu photo votes.");
        } finally {
            setMenuVotesLoading(false);
        }
    }, [menuImages, user]);





    const refreshRestaurantVotes = useCallback(async () => {
        setVotesLoading(true);
        setVotesError("");

        try {
            const { data, error: fetchError } = await supabase
                .from("restaurant_votes")
                .select("user_id, vote")
                .eq("restaurant_id", id);

            if (fetchError) throw fetchError;

            const votes = data ?? [];

            setLikeCount(
                votes.filter((item) => item.vote === "like").length
            );

            setDislikeCount(
                votes.filter((item) => item.vote === "dislike").length
            );

            setUserVote(
                user
                    ? votes.find((item) => item.user_id === user.id)?.vote ?? null
                    : null
            );
        } catch (err) {
            setVotesError(
                err.message || "Unable to load restaurant votes."
            );
        } finally {
            setVotesLoading(false);
        }
    }, [id, user]);

    useEffect(() => {
        refreshRestaurantVotes();
    }, [refreshRestaurantVotes]);

    const handleRestaurantVote = async (vote) => {
        if (!user) {
            setVotesError("Please log in to vote on this restaurant.");
            return;
        }

        if (voteSubmitting) return;

        setVoteSubmitting(true);
        setVotesError("");

        try {
            let result;

            if (userVote === vote) {
                // Clicking the selected vote removes it.
                result = await supabase
                    .from("restaurant_votes")
                    .delete()
                    .eq("restaurant_id", id)
                    .eq("user_id", user.id);
            } else if (userVote) {
                // Change the existing vote.
                result = await supabase
                    .from("restaurant_votes")
                    .update({
                        vote,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("restaurant_id", id)
                    .eq("user_id", user.id);
            } else {
                // Create a new vote.
                result = await supabase
                    .from("restaurant_votes")
                    .insert({
                        restaurant_id: id,
                        user_id: user.id,
                        vote,
                    });
            }

            if (result.error) throw result.error;

            await refreshRestaurantVotes();
        } catch (err) {
            setVotesError(
                err.code === "23505"
                    ? "You have already voted. Refresh and try again."
                    : err.message || "Unable to submit your vote."
            );
        } finally {
            setVoteSubmitting(false);
        }
    };



    const handleMenuImageVote = async (menuImageId, vote) => {
        if (!user) {
            setMenuVotesError("Please log in to vote on menu photos.");
            return;
        }

        if (submittingMenuVoteId) return;

        const currentVote = menuVotes[menuImageId]?.userVote ?? null;

        setSubmittingMenuVoteId(menuImageId);
        setMenuVotesError("");

        try {
            if (currentVote === vote) {
            // Clicking the same vote removes it.
            const { error } = await supabase
                .from("menu_image_votes")
                .delete()
                .eq("menu_image_id", menuImageId)
                .eq("user_id", user.id);

            if (error) throw error;
            } else if (currentVote) {
            // Switch the existing vote.
            const { error } = await supabase
                .from("menu_image_votes")
                .update({
                vote,
                updated_at: new Date().toISOString(),
                })
                .eq("menu_image_id", menuImageId)
                .eq("user_id", user.id);

            if (error) throw error;
            } else {
            // Create a new vote.
            const { error } = await supabase
                .from("menu_image_votes")
                .insert({
                menu_image_id: menuImageId,
                user_id: user.id,
                vote,
                });

            if (error) throw error;
            }

            await refreshMenuImageVotes();
        } catch (error) {
            console.error("Error voting on menu photo:", error);
            setMenuVotesError("Your vote could not be saved. Please try again.");
        } finally {
            setSubmittingMenuVoteId(null);
        }
    };




    useEffect(() => {
        refreshMenuImageVotes();
    }, [refreshMenuImageVotes]);




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
                            
                            {user && profile?.role === "contributor" && (
                                <div className="mt-6">
                                    <Link
                                        to={`/upload-menu?restaurantId=${encodeURIComponent(id)}`}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 border-2 border-ink bg-mint px-5 py-3 text-sm font-bold hover:bg-teal"
                                    >
                                        <Utensils size={18} />
                                        Upload Menu
                                    </Link>
                                </div>
                            )}
                        </section>




                        <div className="mt-8 border-t border-line pt-5">
                            <h2 className="text-lg font-bold">
                                Community votes
                            </h2>

                            <p className="mt-1 text-sm text-muted">
                                Help others decide whether this restaurant is worth visiting.
                            </p>

                            {votesLoading ? (
                                <p className="mt-4 text-sm text-muted" role="status">
                                    Loading votes...
                                </p>
                            ) : (
                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleRestaurantVote("like")}
                                        disabled={voteSubmitting || authLoading}
                                        aria-pressed={userVote === "like"}
                                        className={`inline-flex min-h-11 items-center gap-2 border-2 border-ink px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                                            userVote === "like"
                                                ? "bg-mint"
                                                : "bg-paper hover:bg-mint"
                                        }`}
                                    >
                                        <ThumbsUp size={17} />
                                        Like ({likeCount})
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleRestaurantVote("dislike")}
                                        disabled={voteSubmitting || authLoading}
                                        aria-pressed={userVote === "dislike"}
                                        className={`inline-flex min-h-11 items-center gap-2 border-2 border-ink px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                                            userVote === "dislike"
                                                ? "bg-pink"
                                                : "bg-paper hover:bg-pink"
                                        }`}
                                    >
                                        <ThumbsDown size={17} />
                                        Dislike ({dislikeCount})
                                    </button>

                                    {voteSubmitting && (
                                        <span className="text-sm text-muted" role="status">
                                            Saving vote...
                                        </span>
                                    )}
                                </div>
                            )}

                            {votesError && (
                                <p className="mt-3 text-sm text-red-700" role="alert">
                                    {votesError}
                                    {!user && (
                                        <>
                                            {" "}
                                            <Link
                                                to="/login"
                                                className="font-semibold underline underline-offset-4"
                                            >
                                                Log in
                                            </Link>
                                        </>
                                    )}
                                </p>
                            )}

                            {userVote && (
                                <p className="mt-2 text-sm text-muted">
                                    You voted {userVote === "like" ? "like" : "dislike"}.
                                    Click your selected option again to remove your vote.
                                </p>
                            )}
                        </div>



                        
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
                                            <div
                                                key={menu.id}
                                                className="min-w-0 border border-ink"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedImage(menu)}
                                                    className="group block w-full min-w-0 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
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



                                                <div className="flex items-center gap-4 border-t border-line p-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMenuImageVote(menu.id, "upvote")}
                                                        disabled={
                                                        authLoading ||
                                                        menuVotesLoading ||
                                                        submittingMenuVoteId !== null
                                                        }
                                                        aria-pressed={menuVotes[menu.id]?.userVote === "upvote"}
                                                        aria-label={`Upvote menu photo. ${
                                                        menuVotes[menu.id]?.upvoteCount ?? 0
                                                        } upvotes`}
                                                        className={`inline-flex items-center gap-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                                        menuVotes[menu.id]?.userVote === "upvote"
                                                            ? "text-teal-700"
                                                            : "text-ink hover:text-teal-700"
                                                        }`}
                                                    >
                                                        <ThumbsUp size={16} />
                                                        <span>{menuVotes[menu.id]?.upvoteCount ?? 0}</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleMenuImageVote(menu.id, "downvote")}
                                                        disabled={
                                                        authLoading ||
                                                        menuVotesLoading ||
                                                        submittingMenuVoteId !== null
                                                        }
                                                        aria-pressed={menuVotes[menu.id]?.userVote === "downvote"}
                                                        aria-label={`Downvote menu photo. ${
                                                        menuVotes[menu.id]?.downvoteCount ?? 0
                                                        } downvotes`}
                                                        className={`inline-flex items-center gap-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                                        menuVotes[menu.id]?.userVote === "downvote"
                                                            ? "text-pink-600"
                                                            : "text-ink hover:text-pink-600"
                                                        }`}
                                                    >
                                                        <ThumbsDown size={16} />
                                                        <span>{menuVotes[menu.id]?.downvoteCount ?? 0}</span>
                                                    </button>

                                                    {/* Keep your existing Report photo button and report form here. */}
                                                </div>





                                                <div className="border-t border-line p-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openReportForm(menu)}
                                                        className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold underline underline-offset-4 hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                                                        aria-label="Report this menu photo"
                                                    >
                                                        <Flag size={15} />
                                                        Report photo
                                                    </button>

                                                    {reportingImage?.id === menu.id && (
                                                        <div className="mt-3 border-t border-line pt-3">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <h3 className="font-bold">
                                                                    Report this photo
                                                                </h3>

                                                                <button
                                                                    type="button"
                                                                    onClick={closeReportForm}
                                                                    className="shrink-0 underline underline-offset-4"
                                                                    aria-label="Close report form"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>

                                                            {authLoading ? (
                                                                <p className="mt-3 text-sm text-muted" role="status">
                                                                    Checking your sign-in status...
                                                                </p>
                                                            ) : !user ? (
                                                                <p className="mt-3 text-sm leading-6 text-muted">
                                                                    You need to{" "}
                                                                    <Link
                                                                        to="/login"
                                                                        className="font-semibold text-ink underline underline-offset-4"
                                                                    >
                                                                        log in
                                                                    </Link>{" "}
                                                                    before reporting a photo.
                                                                </p>
                                                            ) : reportSuccess ? (
                                                                <div className="mt-3" role="status">
                                                                    <p className="text-sm leading-6">
                                                                        {reportSuccess}
                                                                    </p>
                                                                    <button
                                                                        type="button"
                                                                        onClick={closeReportForm}
                                                                        className="mt-3 border border-ink bg-mint px-3 py-2 text-sm font-semibold hover:bg-teal"
                                                                    >
                                                                        Done
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <form
                                                                    onSubmit={handleReportSubmit}
                                                                    className="mt-3 space-y-3"
                                                                >
                                                                    <div>
                                                                        <label
                                                                            htmlFor={`report-reason-${menu.id}`}
                                                                            className="mb-1 block text-sm font-semibold"
                                                                        >
                                                                            Reason
                                                                        </label>

                                                                        <select
                                                                            id={`report-reason-${menu.id}`}
                                                                            value={reportReason}
                                                                            onChange={(event) =>
                                                                                setReportReason(event.target.value)
                                                                            }
                                                                            required
                                                                            disabled={reportSubmitting}
                                                                            className="min-h-11 w-full min-w-0 border border-ink bg-paper px-3 py-2 text-sm"
                                                                        >
                                                                            <option value="">
                                                                                Select a reason
                                                                            </option>
                                                                            <option value="Incorrect or outdated menu">
                                                                                Incorrect or outdated menu
                                                                            </option>
                                                                            <option value="Misleading or edited photo">
                                                                                Misleading or edited photo
                                                                            </option>
                                                                            <option value="Inappropriate content">
                                                                                Inappropriate content
                                                                            </option>
                                                                            <option value="Spam or duplicate photo">
                                                                                Spam or duplicate photo
                                                                            </option>
                                                                            <option value="Other">
                                                                                Other
                                                                            </option>
                                                                        </select>
                                                                    </div>

                                                                    <div>
                                                                        <label
                                                                            htmlFor={`report-details-${menu.id}`}
                                                                            className="mb-1 block text-sm font-semibold"
                                                                        >
                                                                            Additional details (optional)
                                                                        </label>

                                                                        <textarea
                                                                            id={`report-details-${menu.id}`}
                                                                            value={reportDetails}
                                                                            onChange={(event) =>
                                                                                setReportDetails(event.target.value)
                                                                            }
                                                                            maxLength={1000}
                                                                            rows={3}
                                                                            disabled={reportSubmitting}
                                                                            placeholder="Explain the issue..."
                                                                            className="w-full min-w-0 resize-y border border-ink bg-paper px-3 py-2 text-sm"
                                                                        />
                                                                    </div>

                                                                    {reportError && (
                                                                        <p
                                                                            className="text-sm text-red-700"
                                                                            role="alert"
                                                                        >
                                                                            {reportError}
                                                                        </p>
                                                                    )}

                                                                    <button
                                                                        type="submit"
                                                                        disabled={reportSubmitting || !reportReason}
                                                                        className="min-h-11 w-full border-2 border-ink bg-pink px-3 py-2 text-sm font-semibold hover:bg-mint disabled:cursor-not-allowed disabled:opacity-60"
                                                                    >
                                                                        {reportSubmitting
                                                                            ? "Submitting..."
                                                                            : "Submit report"}
                                                                    </button>

                                                                    <p className="text-xs leading-5 text-muted">
                                                                        Reports are reviewed by moderators.
                                                                        Reporting a photo does not automatically
                                                                        remove it.
                                                                    </p>
                                                                </form>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
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