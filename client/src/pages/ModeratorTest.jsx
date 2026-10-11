import { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";

function formatDate(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? "Date unavailable"
        : date.toLocaleString();
}

function ModeratorTest() {
    const [photos, setPhotos] = useState([]);
    const [requests, setRequests] = useState([]);
    const [profileReports, setProfileReports] = useState([]);
    const [restrictedContributors, setRestrictedContributors] = useState([]);

    const [photosLoading, setPhotosLoading] = useState(true);
    const [requestsLoading, setRequestsLoading] = useState(true);
    const [profileReportsLoading, setProfileReportsLoading] = useState(true);
    const [restrictedLoading, setRestrictedLoading] = useState(true);

    const [photoError, setPhotoError] = useState("");
    const [requestError, setRequestError] = useState("");
    const [profileReportError, setProfileReportError] = useState("");
    const [restrictedError, setRestrictedError] = useState("");
    const [message, setMessage] = useState("");
    const [processingId, setProcessingId] = useState(null);

    // Load reported menu photos.
    const loadPhotoQueue = useCallback(async () => {
        setPhotosLoading(true);
        setPhotoError("");

        try {
            const { data, error } = await supabase.rpc(
                "get_reported_menu_images"
            );

            if (error) throw error;

            setPhotos(data ?? []);
        } catch (error) {
            console.error("Failed to load reported photos:", error);
            setPhotoError(
                "Unable to load reported photos. Please refresh the queue."
            );
        } finally {
            setPhotosLoading(false);
        }
    }, []);

    // Load pending restaurant requests.
    const loadRequestQueue = useCallback(async () => {
        setRequestsLoading(true);
        setRequestError("");

        try {
            const { data, error } = await supabase.rpc(
                "get_pending_restaurant_requests"
            );

            if (error) throw error;

            setRequests(data ?? []);
        } catch (error) {
            console.error("Failed to load restaurant requests:", error);
            setRequestError(
                "Unable to load restaurant requests. Please refresh the queue."
            );
        } finally {
            setRequestsLoading(false);
        }
    }, []);

    // Load reports against contributor profiles.
    const loadProfileReportQueue = useCallback(async () => {
        setProfileReportsLoading(true);
        setProfileReportError("");

        try {
            const { data, error } = await supabase.rpc(
                "get_pending_profile_reports"
            );

            if (error) throw error;

            setProfileReports(data ?? []);
        } catch (error) {
            console.error("Failed to load profile reports:", error);
            setProfileReportError(
                "Unable to load contributor reports. Please refresh the queue."
            );
        } finally {
            setProfileReportsLoading(false);
        }
    }, []);

    // Load contributors whose contribution privileges are restricted.
    const loadRestrictedContributors = useCallback(async () => {
        setRestrictedLoading(true);
        setRestrictedError("");

        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, username, contribution_status, updated_at")
                .eq("role", "contributor")
                .eq("contribution_status", "restricted")
                .order("username", { ascending: true });

            if (error) throw error;

            setRestrictedContributors(data ?? []);
        } catch (error) {
            console.error("Failed to load restricted contributors:", error);
            setRestrictedError(
                "Unable to load restricted contributors. Please refresh the list."
            );
        } finally {
            setRestrictedLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPhotoQueue();
        loadRequestQueue();
        loadProfileReportQueue();
        loadRestrictedContributors();
    }, [
        loadPhotoQueue,
        loadRequestQueue,
        loadProfileReportQueue,
        loadRestrictedContributors,
    ]);

    // Keep or remove a reported menu photo.
    async function handleReviewPhoto(photo, action) {
        if (action === "remove") {
            const confirmed = window.confirm(
                "Remove this menu photo from public view? The stored image file will not be deleted."
            );

            if (!confirmed) return;
        }

        setProcessingId(photo.menu_image_id);
        setPhotoError("");
        setMessage("");

        try {
            const { error } = await supabase.rpc("review_menu_image", {
                p_menu_image_id: photo.menu_image_id,
                p_action: action,
            });

            if (error) throw error;

            setMessage(
                action === "remove"
                    ? "Menu photo removed from public view."
                    : "Menu photo kept. Its pending reports have been reviewed."
            );

            await loadPhotoQueue();
        } catch (error) {
            console.error("Failed to review menu photo:", error);
            setPhotoError(
                error.message ||
                    "Could not review this photo. Please try again."
            );
        } finally {
            setProcessingId(null);
        }
    }

    // Approve or reject a restaurant request.
    async function handleReviewRequest(request, action) {
        const actionLabel = action === "approve" ? "approve" : "reject";

        const confirmed = window.confirm(
            action === "approve"
                ? `Approve "${request.restaurant_name}" and create its restaurant listing?`
                : `Reject the restaurant suggestion "${request.restaurant_name}"?`
        );

        if (!confirmed) return;

        const operationId = `request:${request.request_id}`;

        setProcessingId(operationId);
        setRequestError("");
        setMessage("");

        try {
            if (action === "approve") {
                const { data: restaurantId, error } = await supabase.rpc(
                    "approve_restaurant_request",
                    {
                        p_request_id: request.request_id,
                    }
                );

                if (error) throw error;

                setMessage(
                    `Restaurant approved and created successfully. Restaurant ID: ${restaurantId}`
                );
            } else {
                const { error } = await supabase.rpc(
                    "reject_restaurant_request",
                    {
                        p_request_id: request.request_id,
                    }
                );

                if (error) throw error;

                setMessage(
                    `Restaurant request "${request.restaurant_name}" was rejected.`
                );
            }

            await loadRequestQueue();
        } catch (error) {
            console.error(`Failed to ${actionLabel} request:`, error);
            setRequestError(
                error.message ||
                    `Could not ${actionLabel} this request. Please try again.`
            );
        } finally {
            setProcessingId(null);
        }
    }

    // Dismiss a report or restrict the reported contributor.
    async function handleReviewProfileReport(report, action) {
        const isRestrict = action === "restrict";

        const confirmed = window.confirm(
            isRestrict
                ? `Restrict contributions for "${report.reported_username}"? They will no longer be able to upload menu photos or submit restaurant requests.`
                : `Dismiss the report against "${report.reported_username}" without changing their contribution status?`
        );

        if (!confirmed) return;

        setProcessingId(`profile-report:${report.report_id}`);
        setProfileReportError("");
        setMessage("");

        try {
            const { error } = await supabase.rpc("review_profile_report", {
                p_report_id: report.report_id,
                p_action: action,
            });

            if (error) throw error;

            setMessage(
                isRestrict
                    ? `Report reviewed. Contributions have been restricted for ${report.reported_username}.`
                    : `Report against ${report.reported_username} dismissed. Their contribution status was not changed.`
            );

            await Promise.all([
                loadProfileReportQueue(),
                loadRestrictedContributors(),
            ]);
        } catch (error) {
            console.error("Failed to review contributor report:", error);
            setProfileReportError(
                error.message ||
                    "Could not review this report. Please try again."
            );
        } finally {
            setProcessingId(null);
        }
    }

    // Restore contribution privileges.
    async function handleRestoreContributor(contributor) {
        const confirmed = window.confirm(
            `Restore contribution privileges for "${contributor.username}"?`
        );

        if (!confirmed) return;

        setProcessingId(`restore:${contributor.id}`);
        setRestrictedError("");
        setMessage("");

        try {
            const { error } = await supabase.rpc("set_contributor_status", {
                p_profile_id: contributor.id,
                p_status: "active",
            });

            if (error) throw error;

            setMessage(
                `Contribution privileges restored for ${contributor.username}.`
            );

            await loadRestrictedContributors();
        } catch (error) {
            console.error("Failed to restore contributor:", error);
            setRestrictedError(
                error.message ||
                    "Could not restore this contributor. Please try again."
            );
        } finally {
            setProcessingId(null);
        }
    }

    return (
        <div className="min-h-screen bg-paper text-ink">
            <Navbar />

            <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <header className="mb-10 border-b-2 border-ink pb-6">
                    <p className="mb-2 text-sm uppercase tracking-widest text-muted">
                        SeeMenu / Moderation
                    </p>

                    <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                        Moderation dashboard
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                        Review community reports and restaurant suggestions.
                        Base each decision on the submitted information and
                        the existing listings.
                    </p>
                </header>

                {message && (
                    <div
                        role="status"
                        className="mb-6 border-2 border-ink bg-mint p-4 text-sm"
                    >
                        {message}
                    </div>
                )}

                {/* QUEUE 01: RESTAURANT REQUESTS */}
                <section className="mb-16">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
                                Queue 01
                            </p>
                            <h2 className="text-2xl font-extrabold">
                                Pending restaurant requests
                            </h2>
                            <p className="mt-2 text-sm text-muted">
                                Verify restaurant details and check for
                                duplicates before approving.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={loadRequestQueue}
                            disabled={requestsLoading}
                            className="border-2 border-ink px-4 py-2 text-sm font-semibold hover:bg-mint disabled:opacity-50"
                        >
                            {requestsLoading ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>

                    {requestError && (
                        <div
                            role="alert"
                            className="mb-5 border-2 border-ink bg-pink p-4 text-sm"
                        >
                            {requestError}
                        </div>
                    )}

                    {requestsLoading ? (
                        <p role="status" className="py-6 text-sm">
                            Loading restaurant requests...
                        </p>
                    ) : requests.length === 0 ? (
                        <div className="border-y border-line py-8">
                            <h3 className="font-bold">
                                No pending restaurant requests
                            </h3>
                            <p className="mt-2 text-sm text-muted">
                                New suggestions from contributors will appear
                                here.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-line border-y border-line">
                            {requests.map((request) => {
                                const operationId = `request:${request.request_id}`;
                                const processing = processingId === operationId;

                                return (
                                    <article
                                        key={request.request_id}
                                        className="py-7"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-xl font-bold">
                                                    {request.restaurant_name}
                                                </h3>
                                                <p className="mt-1 text-sm text-muted">
                                                    {[
                                                        request.request_area,
                                                        request.request_city,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(", ")}
                                                </p>
                                            </div>
                                            <span className="border border-ink px-3 py-1 text-xs font-bold uppercase">
                                                Pending
                                            </span>
                                        </div>

                                        <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                                            <div>
                                                <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                                                    Address
                                                </dt>
                                                <dd className="mt-1 text-sm leading-6">
                                                    {request.request_address ||
                                                        "Not provided"}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                                                    Submitted by
                                                </dt>
                                                <dd className="mt-1 text-sm">
                                                    {request.requester_username ||
                                                        "Unknown contributor"}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                                                    Submitted
                                                </dt>
                                                <dd className="mt-1 text-sm">
                                                    {formatDate(
                                                        request.submitted_at
                                                    )}
                                                </dd>
                                            </div>

                                            {request.request_google_maps_url && (
                                                <div>
                                                    <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                                                        Location
                                                    </dt>
                                                    <dd className="mt-1">
                                                        <a
                                                            href={
                                                                request.request_google_maps_url
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm font-semibold underline underline-offset-4"
                                                        >
                                                            Open Google Maps
                                                        </a>
                                                    </dd>
                                                </div>
                                            )}
                                        </dl>

                                        {request.request_description && (
                                            <div className="mt-5">
                                                <h4 className="text-xs font-bold uppercase tracking-wide text-muted">
                                                    Description
                                                </h4>
                                                <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                                                    {request.request_description}
                                                </p>
                                            </div>
                                        )}

                                        {request.request_reason && (
                                            <div className="mt-4 border-l-2 border-teal pl-4">
                                                <h4 className="text-xs font-bold uppercase tracking-wide text-muted">
                                                    Contributor's reason
                                                </h4>
                                                <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                                                    {request.request_reason}
                                                </p>
                                            </div>
                                        )}

                                        <div className="mt-6 flex flex-wrap gap-3">
                                            <button
                                                type="button"
                                                disabled={processingId !== null}
                                                onClick={() =>
                                                    handleReviewRequest(
                                                        request,
                                                        "approve"
                                                    )
                                                }
                                                className="border-2 border-ink bg-mint px-4 py-3 text-sm font-bold hover:bg-teal disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {processing
                                                    ? "Processing..."
                                                    : "Approve restaurant"}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={processingId !== null}
                                                onClick={() =>
                                                    handleReviewRequest(
                                                        request,
                                                        "reject"
                                                    )
                                                }
                                                className="border-2 border-ink px-4 py-3 text-sm font-bold hover:bg-pink disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Reject request
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* QUEUE 02: REPORTED MENU PHOTOS */}
                <section className="mb-16">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
                                Queue 02
                            </p>
                            <h2 className="text-2xl font-extrabold">
                                Reported menu photos
                            </h2>
                            <p className="mt-2 text-sm text-muted">
                                Review reports and decide whether a photo
                                should remain publicly visible.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={loadPhotoQueue}
                            disabled={photosLoading}
                            className="border-2 border-ink px-4 py-2 text-sm font-semibold hover:bg-mint disabled:opacity-50"
                        >
                            {photosLoading ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>

                    {photoError && (
                        <div
                            role="alert"
                            className="mb-5 border-2 border-ink bg-pink p-4 text-sm"
                        >
                            {photoError}
                        </div>
                    )}

                    {photosLoading ? (
                        <p role="status" className="py-6 text-sm">
                            Loading reported photos...
                        </p>
                    ) : photos.length === 0 ? (
                        <div className="border-y border-line py-8">
                            <h3 className="font-bold">
                                No photos need review
                            </h3>
                            <p className="mt-2 text-sm text-muted">
                                Menu photos with pending reports will appear
                                here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {photos.map((photo) => {
                                const processing =
                                    processingId === photo.menu_image_id;

                                return (
                                    <article
                                        key={photo.menu_image_id}
                                        className="border-b border-line pb-10"
                                    >
                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div>
                                                {photo.image_url ? (
                                                    <a
                                                        href={photo.image_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
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
                                                    <p className="text-sm text-muted">
                                                        Image URL is unavailable.
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <h3 className="text-xl font-bold">
                                                    {photo.restaurant_name}
                                                </h3>
                                                <p className="mt-1 text-sm text-muted">
                                                    {[
                                                        photo.area,
                                                        photo.city,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(", ")}
                                                </p>

                                                {photo.caption && (
                                                    <p className="mt-3 text-sm">
                                                        {photo.caption}
                                                    </p>
                                                )}

                                                <p className="mt-3 text-sm">
                                                    Contributor:{" "}
                                                    {photo.contributor_username ||
                                                        "Unknown"}
                                                </p>
                                                <p className="mt-1 text-sm">
                                                    Uploaded:{" "}
                                                    {formatDate(
                                                        photo.image_created_at
                                                    )}
                                                </p>

                                                <p className="mt-4 font-bold">
                                                    {photo.report_count} pending{" "}
                                                    {photo.report_count === 1
                                                        ? "report"
                                                        : "reports"}
                                                </p>

                                                <div className="mt-4 space-y-4">
                                                    {photo.reports?.map(
                                                        (report) => (
                                                            <div
                                                                key={report.id}
                                                                className="border-l-2 border-line pl-3"
                                                            >
                                                                <p className="text-sm font-semibold">
                                                                    {report.reason}
                                                                </p>
                                                                {report.details && (
                                                                    <p className="mt-1 text-sm text-muted">
                                                                        {report.details}
                                                                    </p>
                                                                )}
                                                                <p className="mt-1 text-xs text-muted">
                                                                    {formatDate(
                                                                        report.created_at
                                                                    )}
                                                                </p>
                                                            </div>
                                                        )
                                                    )}
                                                </div>

                                                <div className="mt-6 flex flex-wrap gap-3">
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            processingId !== null
                                                        }
                                                        onClick={() =>
                                                            handleReviewPhoto(
                                                                photo,
                                                                "keep"
                                                            )
                                                        }
                                                        className="border-2 border-ink px-4 py-3 text-sm font-bold hover:bg-mint disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {processing
                                                            ? "Processing..."
                                                            : "Keep photo"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            processingId !== null
                                                        }
                                                        onClick={() =>
                                                            handleReviewPhoto(
                                                                photo,
                                                                "remove"
                                                            )
                                                        }
                                                        className="border-2 border-ink px-4 py-3 text-sm font-bold hover:bg-pink disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Remove photo
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* QUEUE 03: CONTRIBUTOR PROFILE REPORTS */}
                <section className="mb-16">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
                                Queue 03
                            </p>
                            <h2 className="text-2xl font-extrabold">
                                Contributor profile reports
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                                Review reports against contributors. Dismissing
                                a report leaves the account unchanged;
                                restricting a contributor blocks contribution
                                actions without disabling browsing or login.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={loadProfileReportQueue}
                            disabled={profileReportsLoading}
                            className="border-2 border-ink px-4 py-2 text-sm font-semibold hover:bg-mint disabled:opacity-50"
                        >
                            {profileReportsLoading
                                ? "Refreshing..."
                                : "Refresh"}
                        </button>
                    </div>

                    {profileReportError && (
                        <div
                            role="alert"
                            className="mb-5 border-2 border-ink bg-pink p-4 text-sm"
                        >
                            {profileReportError}
                        </div>
                    )}

                    {profileReportsLoading ? (
                        <p role="status" className="py-6 text-sm">
                            Loading contributor reports...
                        </p>
                    ) : profileReports.length === 0 ? (
                        <div className="border-y border-line py-8">
                            <h3 className="font-bold">
                                No pending contributor reports
                            </h3>
                            <p className="mt-2 text-sm text-muted">
                                Reports submitted against contributor profiles
                                will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-line border-y border-line">
                            {profileReports.map((report) => {
                                const operationId =
                                    `profile-report:${report.report_id}`;
                                const processing =
                                    processingId === operationId;

                                return (
                                    <article
                                        key={report.report_id}
                                        className="py-7"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                                                    Reported contributor
                                                </p>
                                                <h3 className="mt-1 text-xl font-bold">
                                                    {report.reported_username}
                                                </h3>
                                                <p className="mt-1 text-sm text-muted">
                                                    Current contribution status:{" "}
                                                    {report.reported_contribution_status ||
                                                        "Unknown"}
                                                </p>
                                            </div>

                                            <span className="border border-ink px-3 py-1 text-xs font-bold uppercase">
                                                Pending
                                            </span>
                                        </div>

                                        <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                                            <div>
                                                <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                                                    Report reason
                                                </dt>
                                                <dd className="mt-1 text-sm leading-6">
                                                    {report.reason}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                                                    Reported by
                                                </dt>
                                                <dd className="mt-1 text-sm">
                                                    {report.reporter_username ||
                                                        "Unknown user"}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                                                    Submitted
                                                </dt>
                                                <dd className="mt-1 text-sm">
                                                    {formatDate(
                                                        report.submitted_at
                                                    )}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                                                    Report ID
                                                </dt>
                                                <dd className="mt-1 break-all text-xs">
                                                    {report.report_id}
                                                </dd>
                                            </div>
                                        </dl>

                                        {report.details && (
                                            <div className="mt-5 border-l-2 border-teal pl-4">
                                                <h4 className="text-xs font-bold uppercase tracking-wide text-muted">
                                                    Additional details
                                                </h4>
                                                <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                                                    {report.details}
                                                </p>
                                            </div>
                                        )}

                                        <div className="mt-6 flex flex-wrap gap-3">
                                            <button
                                                type="button"
                                                disabled={processingId !== null}
                                                onClick={() =>
                                                    handleReviewProfileReport(
                                                        report,
                                                        "dismiss"
                                                    )
                                                }
                                                className="border-2 border-ink px-4 py-3 text-sm font-bold hover:bg-mint disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {processing
                                                    ? "Processing..."
                                                    : "Dismiss report"}
                                            </button>

                                            <button
                                                type="button"
                                                disabled={processingId !== null}
                                                onClick={() =>
                                                    handleReviewProfileReport(
                                                        report,
                                                        "restrict"
                                                    )
                                                }
                                                className="border-2 border-ink bg-pink px-4 py-3 text-sm font-bold hover:bg-mint disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Restrict contributions
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* RESTRICTED CONTRIBUTORS */}
                <section>
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
                                Account management
                            </p>
                            <h2 className="text-2xl font-extrabold">
                                Restricted contributors
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                                Restore contribution privileges when appropriate.
                                Restoring an account does not change previously
                                reviewed reports.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={loadRestrictedContributors}
                            disabled={restrictedLoading}
                            className="border-2 border-ink px-4 py-2 text-sm font-semibold hover:bg-mint disabled:opacity-50"
                        >
                            {restrictedLoading ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>

                    {restrictedError && (
                        <div
                            role="alert"
                            className="mb-5 border-2 border-ink bg-pink p-4 text-sm"
                        >
                            {restrictedError}
                        </div>
                    )}

                    {restrictedLoading ? (
                        <p role="status" className="py-6 text-sm">
                            Loading restricted contributors...
                        </p>
                    ) : restrictedContributors.length === 0 ? (
                        <div className="border-y border-line py-8">
                            <h3 className="font-bold">
                                No restricted contributors
                            </h3>
                            <p className="mt-2 text-sm text-muted">
                                Contributors with restricted contribution
                                privileges will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-line border-y border-line">
                            {restrictedContributors.map((contributor) => (
                                <article
                                    key={contributor.id}
                                    className="flex flex-wrap items-center justify-between gap-4 py-5"
                                >
                                    <div className="min-w-0">
                                        <h3 className="break-words font-bold">
                                            {contributor.username ||
                                                "Unnamed contributor"}
                                        </h3>
                                        <p className="mt-1 text-sm text-muted">
                                            Restricted since last profile update:{" "}
                                            {formatDate(contributor.updated_at)}
                                        </p>
                                        <p className="mt-1 break-all text-xs text-muted">
                                            Profile ID: {contributor.id}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={processingId !== null}
                                        onClick={() =>
                                            handleRestoreContributor(contributor)
                                        }
                                        className="border-2 border-ink bg-mint px-4 py-3 text-sm font-bold hover:bg-teal disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {processingId ===
                                        `restore:${contributor.id}`
                                            ? "Restoring..."
                                            : "Restore contributions"}
                                    </button>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default ModeratorTest;