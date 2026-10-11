
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Send } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const initialForm = {
    name: "",
    address: "",
    area: "",
    city: "Dhaka",
    google_maps_url: "",
    description: "",
    reason: "",
};

export default function RestaurantRequest() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState(initialForm);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));

        setError("");
        setSuccess("");
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!user) {
            navigate("/login");
            return;
        }

        if (profile?.role !== "contributor") {
            setError("Only contributor accounts can submit restaurant requests.");
            return;
        }

        const requiredFields = [
            ["name", "Restaurant name"],
            ["address", "Address"],
            ["area", "Area"],
            ["city", "City"],
        ];

        for (const [field, label] of requiredFields) {
            if (!form[field].trim()) {
                setError(`${label} is required.`);
                return;
            }
        }

        if (
            form.google_maps_url.trim() &&
            !/^https?:\/\/\S+$/i.test(form.google_maps_url.trim())
        ) {
            setError("Enter a valid Google Maps URL beginning with http:// or https://.");
            return;
        }

        setSubmitting(true);

        try {
            const { error: insertError } = await supabase
                .from("restaurant_requests")
                .insert({
                    requested_by: user.id,
                    name: form.name.trim(),
                    address: form.address.trim(),
                    area: form.area.trim(),
                    city: form.city.trim(),
                    google_maps_url: form.google_maps_url.trim() || null,
                    description: form.description.trim() || null,
                    reason: form.reason.trim() || null,
                    status: "pending",
                });

            if (insertError) {
                if (insertError.code === "42501") {
                    throw new Error(
                        "Your account cannot submit requests at this time. Check your contribution status."
                    );
                }

                throw insertError;
            }

            setForm(initialForm);
            setSuccess(
                "Your restaurant suggestion has been submitted for moderator review."
            );
        } catch (err) {
            console.error("Restaurant request error:", err);
            setError(
                err.message ||
                    "We couldn't submit your request. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-paper text-ink">
            <Navbar />

            <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
                <Link
                    to="/"
                    className="mb-8 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
                >
                    <ArrowLeft size={16} />
                    Back to restaurants
                </Link>

                <div className="mb-8 border-b-2 border-ink pb-6">
                    <p className="mb-2 text-sm font-bold uppercase tracking-widest text-muted">
                        Community contribution
                    </p>

                    <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                        Suggest a restaurant
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                        Know a food place that is missing from SeeMenu?
                        Submit its details so a moderator can review your
                        suggestion.
                    </p>
                </div>

                {success && (
                    <div
                        role="status"
                        className="mb-6 flex items-start gap-3 border-2 border-ink bg-mint p-4"
                    >
                        <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
                        <div>
                            <p className="font-bold">Request submitted</p>
                            <p className="mt-1 text-sm">{success}</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div
                        role="alert"
                        className="mb-6 border-2 border-ink bg-pink p-4 text-sm"
                    >
                        <p className="font-bold">Unable to submit request</p>
                        <p className="mt-1">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label
                            htmlFor="name"
                            className="mb-2 block text-sm font-bold"
                        >
                            Restaurant name *
                        </label>
                        <input
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            maxLength={150}
                            required
                            placeholder="e.g. Star Kabab"
                            className="w-full border-2 border-ink bg-white px-4 py-3 outline-none focus:bg-mint/20"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="address"
                            className="mb-2 block text-sm font-bold"
                        >
                            Full address *
                        </label>
                        <textarea
                            id="address"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            maxLength={500}
                            required
                            rows={2}
                            placeholder="Street, building, or nearby landmark"
                            className="w-full resize-y border-2 border-ink bg-white px-4 py-3 outline-none focus:bg-mint/20"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="area"
                                className="mb-2 block text-sm font-bold"
                            >
                                Area / neighborhood *
                            </label>
                            <input
                                id="area"
                                name="area"
                                value={form.area}
                                onChange={handleChange}
                                maxLength={120}
                                required
                                placeholder="e.g. Dhanmondi"
                                className="w-full border-2 border-ink bg-white px-4 py-3 outline-none focus:bg-mint/20"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="city"
                                className="mb-2 block text-sm font-bold"
                            >
                                City *
                            </label>
                            <input
                                id="city"
                                name="city"
                                value={form.city}
                                onChange={handleChange}
                                maxLength={120}
                                required
                                placeholder="e.g. Dhaka"
                                className="w-full border-2 border-ink bg-white px-4 py-3 outline-none focus:bg-mint/20"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="google_maps_url"
                            className="mb-2 block text-sm font-bold"
                        >
                            Google Maps link
                            <span className="ml-2 font-normal text-muted">
                                (optional)
                            </span>
                        </label>
                        <input
                            id="google_maps_url"
                            name="google_maps_url"
                            type="url"
                            value={form.google_maps_url}
                            onChange={handleChange}
                            maxLength={1000}
                            placeholder="https://maps.google.com/..."
                            className="w-full border-2 border-ink bg-white px-4 py-3 outline-none focus:bg-mint/20"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="description"
                            className="mb-2 block text-sm font-bold"
                        >
                            Description
                            <span className="ml-2 font-normal text-muted">
                                (optional)
                            </span>
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            maxLength={2000}
                            rows={3}
                            placeholder="What kind of food does this place serve?"
                            className="w-full resize-y border-2 border-ink bg-white px-4 py-3 outline-none focus:bg-mint/20"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="reason"
                            className="mb-2 block text-sm font-bold"
                        >
                            Why should it be added?
                            <span className="ml-2 font-normal text-muted">
                                (optional)
                            </span>
                        </label>
                        <textarea
                            id="reason"
                            name="reason"
                            value={form.reason}
                            onChange={handleChange}
                            maxLength={1000}
                            rows={3}
                            placeholder="Share any helpful information for the moderator."
                            className="w-full resize-y border-2 border-ink bg-white px-4 py-3 outline-none focus:bg-mint/20"
                        />
                    </div>

                    <div className="border-l-4 border-teal bg-mint/30 p-4 text-sm leading-6">
                        <strong>What happens next?</strong>
                        <p className="mt-1">
                            Your suggestion will be marked as pending. A
                            moderator will review it and check whether the
                            restaurant already exists before approving it.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex w-full items-center justify-center gap-2 border-2 border-ink bg-mint px-5 py-3 font-bold hover:bg-teal disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                        <Send size={17} />
                        {submitting ? "Submitting..." : "Submit suggestion"}
                    </button>
                </form>
            </main>
        </div>
    );
}