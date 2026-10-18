
// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { ArrowLeft, Save } from "lucide-react";

// import Navbar from "../components/Navbar";
// import { useAuth } from "../context/AuthContext";
// import { supabase } from "../lib/supabase";

// function EditProfile() {
//     const { user, profile, refreshProfile } = useAuth();

//     const [fullName, setFullName] = useState("");
//     const [phone, setPhone] = useState("");
//     const [loading, setLoading] = useState(true);
//     const [saving, setSaving] = useState(false);
//     const [error, setError] = useState("");
//     const [success, setSuccess] = useState("");

//     useEffect(() => {
//         if (!user) {
//             setLoading(false);
//             return;
//         }

//         if (!profile) return;

//         setFullName(profile.full_name || "");
//         setPhone(profile.phone || "");
//         setLoading(false);
//     }, [user, profile]);

//     const handleSubmit = async (event) => {
//         event.preventDefault();

//         setError("");
//         setSuccess("");
//         setSaving(true);

//         const { error: updateError } = await supabase
//             .from("profiles")
//             .update({
//                 full_name: fullName.trim() || null,
//                 phone: phone.trim() || null,
//             })
//             .eq("id", user.id);

//         setSaving(false);

//         if (updateError) {
//             console.error("Profile update error:", updateError);
//             setError("Unable to update your profile. Please try again.");
//             return;
//         }

//         await refreshProfile();
//         setSuccess("Your profile has been updated.");

//         // Refresh the auth context's profile data if it exposes
//         // a refresh function. We will connect this in a later step.
//     };

//     if (!user) {
//         return (
//             <main className="min-h-screen bg-paper text-ink">
//                 <Navbar />
//                 <div className="mx-auto max-w-2xl px-4 py-12">
//                     <p>Please log in to edit your profile.</p>
//                     <Link to="/login" className="mt-4 inline-block underline">
//                         Log in
//                     </Link>
//                 </div>
//             </main>
//         );
//     }

//     return (
//         <main className="min-h-screen bg-paper text-ink">
//             <Navbar />

//             <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
//                 <Link
//                     to={`/contributors/${encodeURIComponent(
//                         profile?.username || ""
//                     )}`}
//                     className="mb-6 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
//                 >
//                     <ArrowLeft size={16} />
//                     Back to profile
//                 </Link>

//                 <div className="border-2 border-ink bg-paper p-5 sm:p-8">
//                     <p className="text-sm font-semibold uppercase tracking-wider text-muted">
//                         Account settings
//                     </p>

//                     <h1 className="mt-2 text-3xl font-extrabold">
//                         Edit profile
//                     </h1>

//                     <p className="mt-2 text-sm text-muted">
//                         Update the information displayed on your SeeMenu profile.
//                     </p>

//                     {loading ? (
//                         <p className="mt-8">Loading your profile...</p>
//                     ) : (
//                         <form onSubmit={handleSubmit} className="mt-8 space-y-6">
//                             <div>
//                                 <label
//                                     htmlFor="fullName"
//                                     className="mb-2 block text-sm font-semibold"
//                                 >
//                                     Full name
//                                 </label>

//                                 <input
//                                     id="fullName"
//                                     type="text"
//                                     value={fullName}
//                                     onChange={(event) =>
//                                         setFullName(event.target.value)
//                                     }
//                                     maxLength={100}
//                                     autoComplete="name"
//                                     placeholder="Your full name"
//                                     className="w-full border-2 border-ink bg-white px-4 py-3 outline-none focus:bg-mint/20"
//                                 />
//                             </div>

//                             <div>
//                                 <label
//                                     htmlFor="phone"
//                                     className="mb-2 block text-sm font-semibold"
//                                 >
//                                     Phone number
//                                 </label>

//                                 <input
//                                     id="phone"
//                                     type="tel"
//                                     value={phone}
//                                     onChange={(event) =>
//                                         setPhone(event.target.value)
//                                     }
//                                     maxLength={30}
//                                     autoComplete="tel"
//                                     placeholder="Your phone number"
//                                     className="w-full border-2 border-ink bg-white px-4 py-3 outline-none focus:bg-mint/20"
//                                 />
//                             </div>

//                             <div>
//                                 <label className="mb-2 block text-sm font-semibold">
//                                     Email address
//                                 </label>
//                                 <p className="break-all border border-line bg-white px-4 py-3 text-sm text-muted">
//                                     {user.email}
//                                 </p>
//                                 <p className="mt-2 text-xs text-muted">
//                                     Email changes will be handled separately
//                                     through email verification.
//                                 </p>
//                             </div>

//                             {error && (
//                                 <p role="alert" className="text-sm font-semibold text-red-700">
//                                     {error}
//                                 </p>
//                             )}

//                             {success && (
//                                 <p role="status" className="text-sm font-semibold">
//                                     {success}
//                                 </p>
//                             )}

//                             <button
//                                 type="submit"
//                                 disabled={saving}
//                                 className="inline-flex items-center gap-2 border-2 border-ink bg-mint px-5 py-3 font-bold hover:bg-teal disabled:cursor-not-allowed disabled:opacity-60"
//                             >
//                                 <Save size={17} />
//                                 {saving ? "Saving..." : "Save changes"}
//                             </button>
//                         </form>
//                     )}
//                 </div>
//             </section>
//         </main>
//     );
// }

// export default EditProfile;



import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Trash2, AlertTriangle } from "lucide-react";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

function EditProfile() {
    const { user, session, profile, refreshProfile, signOut } = useAuth();
    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const canDeleteAccount = ["contributor", "moderator"].includes(
        profile?.role
    );

    const profilePath = profile?.username
        ? `/${profile.role === "moderator" ? "moderators" : profile.role === "admin" ? "admins" : "contributors"}/${encodeURIComponent(profile.username)}`
        : "/";

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        if (!profile) return;

        setFullName(profile.full_name || "");
        setPhone(profile.phone || "");
        setLoading(false);
    }, [user, profile]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");
        setSaving(true);

        try {
            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                    full_name: fullName.trim() || null,
                    phone: phone.trim() || null,
                })
                .eq("id", user.id);

            if (updateError) {
                console.error("Profile update error:", updateError);
                setError("Unable to update your profile. Please try again.");
                return;
            }

            await refreshProfile();
            setSuccess("Your profile has been updated.");
        } catch (err) {
            console.error("Unexpected profile update error:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== "DELETE") return;

        if (!session?.access_token) {
            setDeleteError(
                "Your session is missing or expired. Please log in again."
            );
            return;
        }

        setDeleting(true);
        setDeleteError("");

        try {
            const response = await fetch(`${API_URL}/api/account`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                setDeleteError(
                    result.error || "Unable to delete your account. Please try again."
                );
                return;
            }

            // The server has confirmed that the account was deleted.
            // Clear the local session and return to the public home page.
            await signOut();
            navigate("/", { replace: true });
        } catch (err) {
            console.error("Account deletion request failed:", err);
            setDeleteError(
                "Could not contact the server. Check your connection and try again."
            );
        } finally {
            setDeleting(false);
        }
    };

    if (!user) {
        return (
            <main className="min-h-screen bg-paper text-ink">
                <Navbar />
                <div className="mx-auto max-w-2xl px-4 py-12">
                    <p>Please log in to edit your profile.</p>
                    <Link to="/login" className="mt-4 inline-block underline">
                        Log in
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-paper text-ink">
            <Navbar />

            <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
                <Link
                    to={profilePath}
                    className="mb-6 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
                >
                    <ArrowLeft size={16} />
                    Back to profile
                </Link>

                <div className="border-2 border-ink bg-paper p-5 sm:p-8">
                    <p className="text-sm font-semibold uppercase tracking-wider text-muted">
                        Account settings
                    </p>

                    <h1 className="mt-2 text-3xl font-extrabold">
                        Edit profile
                    </h1>

                    <p className="mt-2 text-sm text-muted">
                        Update the information displayed on your SeeMenu profile.
                    </p>

                    {loading ? (
                        <p className="mt-8">Loading your profile...</p>
                    ) : (
                        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                            <div>
                                <label
                                    htmlFor="fullName"
                                    className="mb-2 block text-sm font-semibold"
                                >
                                    Full name
                                </label>

                                <input
                                    id="fullName"
                                    type="text"
                                    value={fullName}
                                    onChange={(event) =>
                                        setFullName(event.target.value)
                                    }
                                    maxLength={100}
                                    autoComplete="name"
                                    placeholder="Your full name"
                                    className="w-full border-2 border-ink bg-white px-4 py-3 outline-none focus:bg-mint/20"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="phone"
                                    className="mb-2 block text-sm font-semibold"
                                >
                                    Phone number
                                </label>

                                <input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(event) =>
                                        setPhone(event.target.value)
                                    }
                                    maxLength={30}
                                    autoComplete="tel"
                                    placeholder="Your phone number"
                                    className="w-full border-2 border-ink bg-white px-4 py-3 outline-none focus:bg-mint/20"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold">
                                    Email address
                                </label>
                                <p className="break-all border border-line bg-white px-4 py-3 text-sm text-muted">
                                    {user.email}
                                </p>
                                <p className="mt-2 text-xs text-muted">
                                    Email changes will be handled separately
                                    through email verification.
                                </p>
                            </div>

                            {error && (
                                <p
                                    role="alert"
                                    className="text-sm font-semibold text-red-700"
                                >
                                    {error}
                                </p>
                            )}

                            {success && (
                                <p role="status" className="text-sm font-semibold">
                                    {success}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={saving || deleting}
                                className="inline-flex items-center gap-2 border-2 border-ink bg-mint px-5 py-3 font-bold hover:bg-teal disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Save size={17} />
                                {saving ? "Saving..." : "Save changes"}
                            </button>
                        </form>
                    )}
                </div>

                {canDeleteAccount && !loading && (
                    <section className="mt-8 border-2 border-red-700 p-5 sm:p-8">
                        <h2 className="text-xl font-extrabold text-red-800">
                            Delete account
                        </h2>

                        <p className="mt-3 text-sm leading-6">
                            Permanently delete your SeeMenu account. Your
                            uploaded menu photos, restaurant suggestions, and
                            comments are intended to remain available with your
                            account attribution removed. Your votes and
                            notifications may be deleted.
                        </p>

                        <p className="mt-2 text-sm font-semibold">
                            This action cannot be undone.
                        </p>

                        {!showDeleteConfirm ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setDeleteError("");
                                    setDeleteConfirmation("");
                                    setShowDeleteConfirm(true);
                                }}
                                className="mt-5 inline-flex items-center gap-2 border-2 border-red-700 px-5 py-3 font-bold text-red-800 hover:bg-red-50"
                            >
                                <Trash2 size={17} />
                                Delete my account
                            </button>
                        ) : (
                            <div
                                className="mt-6 border-t border-red-200 pt-5"
                                role="alertdialog"
                                aria-labelledby="delete-confirm-title"
                                aria-describedby="delete-confirm-description"
                                aria-modal="true"
                            >
                                <div className="flex items-start gap-3">
                                    <AlertTriangle
                                        size={22}
                                        className="mt-1 shrink-0 text-red-700"
                                    />
                                    <div>
                                        <h3
                                            id="delete-confirm-title"
                                            className="font-bold"
                                        >
                                            Confirm permanent deletion
                                        </h3>
                                        <p
                                            id="delete-confirm-description"
                                            className="mt-2 text-sm"
                                        >
                                            To confirm, type{" "}
                                            <strong>DELETE</strong> in the
                                            field below.
                                        </p>
                                    </div>
                                </div>

                                <label
                                    htmlFor="deleteConfirmation"
                                    className="mb-2 mt-5 block text-sm font-semibold"
                                >
                                    Type DELETE to continue
                                </label>

                                <input
                                    id="deleteConfirmation"
                                    type="text"
                                    value={deleteConfirmation}
                                    onChange={(event) =>
                                        setDeleteConfirmation(event.target.value)
                                    }
                                    autoComplete="off"
                                    spellCheck="false"
                                    disabled={deleting}
                                    className="w-full border-2 border-ink bg-white px-4 py-3 outline-none focus:bg-red-50"
                                />

                                {deleteError && (
                                    <p
                                        role="alert"
                                        className="mt-4 text-sm font-semibold text-red-800"
                                    >
                                        {deleteError}
                                    </p>
                                )}

                                <div className="mt-5 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={handleDeleteAccount}
                                        disabled={
                                            deleting ||
                                            deleteConfirmation !== "DELETE"
                                        }
                                        className="inline-flex items-center gap-2 border-2 border-red-700 bg-red-700 px-5 py-3 font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Trash2 size={17} />
                                        {deleting
                                            ? "Deleting account..."
                                            : "Permanently delete"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowDeleteConfirm(false);
                                            setDeleteConfirmation("");
                                            setDeleteError("");
                                        }}
                                        disabled={deleting}
                                        className="border-2 border-ink px-5 py-3 font-bold hover:bg-mint disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </section>
        </main>
    );
}

export default EditProfile;
