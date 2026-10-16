
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

function EditProfile() {
    const { user, profile, refreshProfile } = useAuth();

    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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

        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                full_name: fullName.trim() || null,
                phone: phone.trim() || null,
            })
            .eq("id", user.id);

        setSaving(false);

        if (updateError) {
            console.error("Profile update error:", updateError);
            setError("Unable to update your profile. Please try again.");
            return;
        }

        await refreshProfile();
        setSuccess("Your profile has been updated.");

        // Refresh the auth context's profile data if it exposes
        // a refresh function. We will connect this in a later step.
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
                    to={`/contributors/${encodeURIComponent(
                        profile?.username || ""
                    )}`}
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
                                <p role="alert" className="text-sm font-semibold text-red-700">
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
                                disabled={saving}
                                className="inline-flex items-center gap-2 border-2 border-ink bg-mint px-5 py-3 font-bold hover:bg-teal disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Save size={17} />
                                {saving ? "Saving..." : "Save changes"}
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    );
}

export default EditProfile;
