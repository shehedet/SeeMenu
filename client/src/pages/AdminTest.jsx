
import { useCallback, useEffect, useState } from "react";
import ModeratorTest from "./ModeratorTest";
import { supabase } from "../lib/supabase";

function AdminRoleManagement() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");

    const [moderators, setModerators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadModerators = useCallback(async () => {
        setLoading(true);
        setError("");

        const { data, error: fetchError } = await supabase.rpc(
            "admin_list_moderators"
        );

        if (fetchError) {
            setError(fetchError.message);
            setModerators([]);
        } else {
            setModerators(data ?? []);
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        loadModerators();
    }, [loadModerators]);

    async function handlePromote(event) {
        event.preventDefault();

        setMessage("");
        setError("");
        setProcessing(true);

        try {
            const { data, error: promoteError } = await supabase.rpc(
                "admin_promote_contributor",
                {
                    p_username: username.trim(),
                    p_email: email.trim(),
                }
            );

            if (promoteError) {
                throw promoteError;
            }

            setMessage(
                `${data.username} has been promoted to moderator.`
            );

            setUsername("");
            setEmail("");

            await loadModerators();
        } catch (err) {
            setError(err.message || "Unable to promote contributor.");
        } finally {
            setProcessing(false);
        }
    }

    async function handleDemote(moderator) {
        const confirmed = window.confirm(
            `Remove moderator privileges from ${moderator.username} (${moderator.email})?\n\n` +
            "Their role will become Contributor. Their account and existing contributions will remain."
        );

        if (!confirmed) return;

        setMessage("");
        setError("");
        setProcessingId(moderator.id);

        try {
            const { data, error: demoteError } = await supabase.rpc(
                "admin_demote_moderator",
                {
                    p_user_id: moderator.id,
                }
            );

            if (demoteError) {
                throw demoteError;
            }

            setMessage(
                `${data.username} is now a contributor.`
            );

            await loadModerators();
        } catch (err) {
            setError(err.message || "Unable to remove moderator privileges.");
        } finally {
            setProcessingId(null);
        }
    }

    return (
        <section className="mx-auto w-full max-w-6xl px-4 py-8 text-ink sm:px-6">
            <div className="mb-8 border-b border-line pb-4">
                <p className="mb-2 text-sm uppercase tracking-widest text-muted">
                    Administration
                </p>
                <h2 className="text-2xl font-bold">
                    Moderator Management
                </h2>
                <p className="mt-2 text-sm text-muted">
                    Promote eligible contributors and manage moderator access.
                </p>
            </div>

            {message && (
                <p
                    role="status"
                    className="mb-4 border border-teal bg-mint p-3"
                >
                    {message}
                </p>
            )}

            {error && (
                <p
                    role="alert"
                    className="mb-4 border border-pink bg-pink p-3"
                >
                    {error}
                </p>
            )}

            {/* Promote a contributor */}
            <div className="mb-10 border-b border-line pb-8">
                <h3 className="mb-2 text-xl font-semibold">
                    Promote a Contributor
                </h3>

                <p className="mb-5 text-sm text-muted">
                    Enter the username and email belonging to the same active
                    contributor account.
                </p>

                <form
                    onSubmit={handlePromote}
                    className="grid gap-4 sm:grid-cols-2"
                >
                    <div>
                        <label
                            htmlFor="promote-username"
                            className="mb-1 block text-sm font-medium"
                        >
                            Username
                        </label>
                        <input
                            id="promote-username"
                            type="text"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            required
                            autoComplete="off"
                            className="w-full border border-line bg-paper px-3 py-2"
                            placeholder="Enter contributor username"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="promote-email"
                            className="mb-1 block text-sm font-medium"
                        >
                            Email
                        </label>
                        <input
                            id="promote-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            autoComplete="off"
                            className="w-full border border-line bg-paper px-3 py-2"
                            placeholder="contributor@example.com"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="border border-ink bg-mint px-5 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? "Processing..." : "Promote to Moderator"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Current moderators */}
            <div>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-xl font-semibold">
                            Current Moderators
                        </h3>
                        <p className="mt-1 text-sm text-muted">
                            {moderators.length} moderator
                            {moderators.length === 1 ? "" : "s"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={loadModerators}
                        disabled={loading}
                        className="border border-line px-4 py-2 font-medium disabled:opacity-50"
                    >
                        {loading ? "Refreshing..." : "Refresh List"}
                    </button>
                </div>

                {loading ? (
                    <p className="py-4 text-muted">Loading moderators...</p>
                ) : moderators.length === 0 ? (
                    <p className="border border-line p-4 text-muted">
                        No moderators found.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-line">
                                    <th className="px-3 py-3 font-semibold">
                                        Username
                                    </th>
                                    <th className="px-3 py-3 font-semibold">
                                        Email
                                    </th>
                                    <th className="px-3 py-3 font-semibold">
                                        Joined
                                    </th>
                                    <th className="px-3 py-3 font-semibold">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {moderators.map((moderator) => (
                                    <tr
                                        key={moderator.id}
                                        className="border-b border-line"
                                    >
                                        <td className="px-3 py-4">
                                            {moderator.username}
                                        </td>

                                        <td className="px-3 py-4">
                                            {moderator.email}
                                        </td>

                                        <td className="whitespace-nowrap px-3 py-4">
                                            {new Date(
                                                moderator.created_at
                                            ).toLocaleDateString()}
                                        </td>

                                        <td className="px-3 py-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDemote(moderator)
                                                }
                                                disabled={
                                                    processingId !== null ||
                                                    processing
                                                }
                                                className="border border-line px-3 py-2 font-medium hover:bg-pink disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {processingId === moderator.id
                                                    ? "Removing..."
                                                    : "Remove Moderator"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}

function AdminTest() {
    return (
        <>
            <ModeratorTest />
            <AdminRoleManagement />
        </>
    );
}

export default AdminTest;
