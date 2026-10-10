
import { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";

function formatDate(value) {
    if (!value) return "Date unavailable";

    return new Date(value).toLocaleString();
}

function ModeratorTest() {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [processingId, setProcessingId] = useState(null);

    const loadQueue = useCallback(async () => {
        setLoading(true);
        setError("");

        const { data, error: fetchError } = await supabase.rpc(
            "get_reported_menu_images"
        );

        if (fetchError) {
            console.error("Failed to load moderation queue:", fetchError);
            setError(
                "Unable to load reported photos. Please refresh and try again."
            );
            setPhotos([]);
        } else {
            setPhotos(data ?? []);
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        loadQueue();
    }, [loadQueue]);

    async function handleReview(photo, action) {
        const actionLabel = action === "remove" ? "remove" : "keep";

        if (
            action === "remove" &&
            !window.confirm(
                "Remove this menu photo from public view? This will not delete the stored image file."
            )
        ) {
            return;
        }

        setProcessingId(photo.menu_image_id);
        setError("");
        setMessage("");

        const { error: reviewError } = await supabase.rpc(
            "review_menu_image",
            {
                p_menu_image_id: photo.menu_image_id,
                p_action: action,
            }
        );

        if (reviewError) {
            console.error("Failed to review menu photo:", reviewError);
            setError(
                `Could not ${actionLabel} this photo. Please try again.`
            );
        } else {
            setMessage(
                action === "remove"
                    ? "Photo removed from public view."
                    : "Photo kept. Its pending reports have been reviewed."
            );

            await loadQueue();
        }

        setProcessingId(null);
    }

    return (
        <>
            <Navbar />

            <main className="mx-auto w-full max-w-5xl px-4 py-8">
                <header className="mb-8">
                    <p className="mb-2 text-sm uppercase tracking-widest">
                        SeeMenu / Moderation
                    </p>

                    <h1 className="text-3xl font-bold">
                        Reported menu photos
                    </h1>

                    <p className="mt-2 text-sm">
                        Review reports and decide whether a photo should
                        remain publicly visible.
                    </p>
                </header>

                {error && (
                    <div
                        role="alert"
                        className="mb-4 border border-red-400 p-3"
                    >
                        {error}
                    </div>
                )}

                {message && (
                    <div
                        role="status"
                        className="mb-4 border border-green-600 p-3"
                    >
                        {message}
                    </div>
                )}

                {loading ? (
                    <p role="status">Loading reported photos...</p>
                ) : photos.length === 0 ? (
                    <section className="border p-6">
                        <h2 className="text-lg font-semibold">
                            No photos need review
                        </h2>
                        <p className="mt-2 text-sm">
                            Reported menu photos will appear here when they
                            have pending reports.
                        </p>
                        <button
                            type="button"
                            onClick={loadQueue}
                            className="mt-4 border px-4 py-2"
                        >
                            Refresh queue
                        </button>
                    </section>
                ) : (
                    <div className="space-y-8">
                        {photos.map((photo) => (
                            <article
                                key={photo.menu_image_id}
                                className="border-b pb-8"
                            >
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div>
                                        {photo.image_url ? (
                                            <a
                                                href={photo.image_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                aria-label="Open full menu photo in a new tab"
                                            >
                                                <img
                                                    src={photo.image_url}
                                                    alt={
                                                        photo.caption ||
                                                        `Menu at ${photo.restaurant_name}`
                                                    }
                                                    className="max-h-96 w-full object-contain object-left"
                                                />
                                            </a>
                                        ) : (
                                            <p>
                                                Image URL is unavailable.
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-semibold">
                                            {photo.restaurant_name}
                                        </h2>

                                        <p className="mt-1 text-sm">
                                            {[photo.area, photo.city]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </p>

                                        {photo.caption && (
                                            <p className="mt-3">
                                                {photo.caption}
                                            </p>
                                        )}

                                        <p className="mt-3 text-sm">
                                            Contributor:{" "}
                                            {photo.contributor_username}
                                        </p>

                                        <p className="mt-1 text-sm">
                                            Uploaded:{" "}
                                            {formatDate(photo.image_created_at)}
                                        </p>

                                        <p className="mt-4 font-semibold">
                                            {photo.report_count} pending{" "}
                                            {photo.report_count === 1
                                                ? "report"
                                                : "reports"}
                                        </p>

                                        <div className="mt-3 space-y-3">
                                            {photo.reports?.map((report) => (
                                                <div
                                                    key={report.id}
                                                    className="border-l-2 pl-3"
                                                >
                                                    <p className="font-medium">
                                                        {report.reason}
                                                    </p>

                                                    {report.details && (
                                                        <p className="mt-1 text-sm">
                                                            {report.details}
                                                        </p>
                                                    )}

                                                    <p className="mt-1 text-xs">
                                                        {formatDate(
                                                            report.created_at
                                                        )}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-6 flex flex-wrap gap-3">
                                            <button
                                                type="button"
                                                disabled={
                                                    processingId !== null
                                                }
                                                onClick={() =>
                                                    handleReview(photo, "keep")
                                                }
                                                className="border px-4 py-2 disabled:opacity-50"
                                            >
                                                {processingId ===
                                                photo.menu_image_id
                                                    ? "Processing..."
                                                    : "Keep photo"}
                                            </button>

                                            <button
                                                type="button"
                                                disabled={
                                                    processingId !== null
                                                }
                                                onClick={() =>
                                                    handleReview(
                                                        photo,
                                                        "remove"
                                                    )
                                                }
                                                className="border border-red-500 px-4 py-2 disabled:opacity-50"
                                            >
                                                Remove photo
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>
        </>
    );
}

export default ModeratorTest;