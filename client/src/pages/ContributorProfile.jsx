import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Flag, UserRound } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const REPORT_REASONS = [
    "Spam or misleading activity",
    "Harassment or abusive behavior",
    "Fake or impersonation account",
    "Repeated inappropriate contributions",
    "Other",
];

function ContributorProfile() {
    const { username } = useParams();
    const { user, loading: authLoading } = useAuth();

    const [contributor, setContributor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");

    const [reportOpen, setReportOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [reportError, setReportError] = useState("");
    const [reportSuccess, setReportSuccess] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadContributor() {
            setLoading(true);
            setPageError("");
            setContributor(null);

            try {
                const { data, error } = await supabase.rpc(
                    "get_contributor_profile",
                    {
                        p_username: username,
                    }
                );

                if (cancelled) return;

                if (error) {
                    throw new Error(
                        error.message || "Unable to load this contributor profile."
                    );
                }

                // PostgreSQL functions returning TABLE produce an array.
                const contributorProfile = Array.isArray(data)
                    ? data[0]
                    : null;

                if (!contributorProfile) {
                    setPageError("Contributor profile not found.");
                } else {
                    setContributor(contributorProfile);
                }
            } catch (err) {
                if (!cancelled) {
                    setPageError(
                        err.message || "Unable to load this contributor profile."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        if (username) {
            loadContributor();
        } else {
            setPageError("No contributor username was provided.");
            setLoading(false);
        }

        return () => {
            cancelled = true;
        };
    }, [username]);

    function openReportForm() {
        setReportOpen(true);
        setReason("");
        setDetails("");
        setReportError("");
        setReportSuccess("");
    }

    function closeReportForm() {
        setReportOpen(false);
        setReason("");
        setDetails("");
        setReportError("");
        setReportSuccess("");
    }

    async function handleReportSubmit(event) {
        event.preventDefault();

        if (!user) {
            setReportError("Please log in before submitting a report.");
            return;
        }

        if (!contributor || contributor.id === user.id) {
            setReportError("You cannot report your own profile.");
            return;
        }

        if (!reason) {
            setReportError("Please select a reason.");
            return;
        }

        if (submitting) return;

        setSubmitting(true);
        setReportError("");
        setReportSuccess("");

        try {
            const { error } = await supabase.from("reports").insert({
                reported_by: user.id,
                reported_profile_id: contributor.id,
                reason,
                details: details.trim() || null,
                status: "pending",
            });

            if (error) {
                if (error.code === "23505") {
                    throw new Error(
                        "You have already reported this contributor."
                    );
                }

                if (error.code === "42501") {
                    throw new Error(
                        "You do not have permission to submit this report."
                    );
                }

                if (error.code === "23503") {
                    throw new Error(
                        "This contributor profile is no longer available."
                    );
                }

                throw new Error(
                    error.message || "Unable to submit the report."
                );
            }

            setReportSuccess(
                "Report submitted. A moderator will review it."
            );
            setReason("");
            setDetails("");
        } catch (err) {
            setReportError(err.message || "Something went wrong.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-paper text-ink">
            <Navbar />

            <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 border-b border-ink pb-1 text-sm font-semibold hover:border-teal"
                >
                    <ArrowLeft size={16} />
                    Back to SeeMenu
                </Link>

                {loading || authLoading ? (
                    <section
                        className="border-y border-line py-12"
                        role="status"
                    >
                        <h1 className="text-2xl font-bold">
                            Loading contributor profile...
                        </h1>
                    </section>
                ) : pageError ? (
                    <section
                        className="border-y border-line py-12"
                        role="alert"
                    >   
                        <h1 className="text-2xl font-bold">
                            Unable to open profile. If you are a moderator/admin, you will not see your profile yet.
                        </h1>
                        <p className="mt-3 text-muted">{pageError}</p>
                    </section>
                ) : contributor ? (
                    <section className="mt-8 border-y-2 border-ink py-8 sm:py-10">
                        <div className="flex items-start gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center border-2 border-ink bg-mint">
                                <UserRound size={30} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                                    SeeMenu contributor
                                </p>

                                <h1 className="mt-2 break-words text-3xl font-bold">
                                    {contributor.username}
                                </h1>

                                <p className="mt-2">
                                    <p className="inline-flex border-r mr-3 pr-3 text-sm text-muted">
                                        Member since{" "}
                                        {contributor.created_at
                                            ? new Date(
                                                contributor.created_at
                                            ).toLocaleDateString()
                                            : "Unknown"}
                                    </p>
                                    <p className="inline-flex items-center font-semibold text-sm text-muted hover:text-teal">
                                        <Link
                                            to="/edit-profile"
                                            // onClick={() => setAccountMenuOpen(false)}
                                        >
                                            Edit profile
                                        </Link>
                                    </p>
                                </p>
                            </div>
                        </div>

                        {contributor.id !== user?.id && (
                            <div className="mt-8 border-t border-line pt-5">
                                <button
                                    type="button"
                                    onClick={openReportForm}
                                    className="inline-flex min-h-11 items-center gap-2 border border-ink px-4 py-2 text-sm font-semibold hover:bg-pink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                                >
                                    <Flag size={16} />
                                    Report contributor
                                </button>

                                {reportOpen && (
                                    <div className="mt-5 max-w-xl border-t border-line pt-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <h2 className="text-lg font-bold">
                                                Report {contributor.username}
                                            </h2>

                                            <button
                                                type="button"
                                                onClick={closeReportForm}
                                                className="text-sm underline underline-offset-4"
                                            >
                                                Cancel
                                            </button>
                                        </div>

                                        {!user ? (
                                            <p className="mt-4 text-sm leading-6 text-muted">
                                                Please{" "}
                                                <Link
                                                    to="/login"
                                                    className="font-semibold text-ink underline underline-offset-4"
                                                >
                                                    log in
                                                </Link>{" "}
                                                to report this contributor.
                                            </p>
                                        ) : reportSuccess ? (
                                            <div
                                                className="mt-4"
                                                role="status"
                                            >
                                                <p className="text-sm leading-6">
                                                    {reportSuccess}
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={closeReportForm}
                                                    className="mt-4 min-h-10 border border-ink bg-mint px-4 py-2 text-sm font-semibold hover:bg-teal"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        ) : (
                                            <form
                                                onSubmit={handleReportSubmit}
                                                className="mt-4 space-y-4"
                                            >
                                                <div>
                                                    <label
                                                        htmlFor="profile-report-reason"
                                                        className="mb-1 block text-sm font-semibold"
                                                    >
                                                        Reason
                                                    </label>

                                                    <select
                                                        id="profile-report-reason"
                                                        value={reason}
                                                        onChange={(event) =>
                                                            setReason(
                                                                event.target.value
                                                            )
                                                        }
                                                        required
                                                        disabled={submitting}
                                                        className="min-h-11 w-full border border-ink bg-paper px-3 py-2 text-sm"
                                                    >
                                                        <option value="">
                                                            Select a reason
                                                        </option>

                                                        {REPORT_REASONS.map(
                                                            (item) => (
                                                                <option
                                                                    key={item}
                                                                    value={item}
                                                                >
                                                                    {item}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label
                                                        htmlFor="profile-report-details"
                                                        className="mb-1 block text-sm font-semibold"
                                                    >
                                                        Additional details
                                                        (optional)
                                                    </label>

                                                    <textarea
                                                        id="profile-report-details"
                                                        value={details}
                                                        onChange={(event) =>
                                                            setDetails(
                                                                event.target.value
                                                            )
                                                        }
                                                        maxLength={1000}
                                                        rows={4}
                                                        disabled={submitting}
                                                        placeholder="Describe the issue..."
                                                        className="w-full resize-y border border-ink bg-paper px-3 py-2 text-sm"
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
                                                    disabled={
                                                        submitting || !reason
                                                    }
                                                    className="min-h-11 border-2 border-ink bg-pink px-4 py-2 text-sm font-semibold hover:bg-mint disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {submitting
                                                        ? "Submitting..."
                                                        : "Submit report"}
                                                </button>

                                                <p className="text-xs leading-5 text-muted">
                                                    Reports are reviewed by
                                                    moderators. Reporting a
                                                    contributor does not
                                                    automatically restrict
                                                    their account.
                                                </p>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                ) : null}
            </main>

            <footer className="border-t-2 border-ink">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <p>
                        <span className="font-bold text-ink">SeeMenu</span>{" "}
                        — Menus made easier to find.
                    </p>
                    <p>Community-powered food discovery.</p>
                </div>
            </footer>
        </div>
    );
}

export default ContributorProfile;