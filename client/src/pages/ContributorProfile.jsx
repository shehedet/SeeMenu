// import { useEffect, useState } from "react";
// import { Link, useParams } from "react-router-dom";
// import {
//     ArrowLeft,
//     MapPin,
//     Utensils,
//     ExternalLink,
//     X,
//     Flag,
// } from "lucide-react";

// import Navbar from "../components/Navbar";
// import { useAuth } from "../context/AuthContext";
// import { supabase } from "../lib/supabase";

// function RestaurantDetails() {
//     const { id } = useParams();

//     const [restaurant, setRestaurant] = useState(null);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState("");

//     const [menuImages, setMenuImages] = useState([]);
//     const [isMenusLoading, setIsMenusLoading] = useState(true);
//     const [menusError, setMenusError] = useState("");
//     const [selectedImage, setSelectedImage] = useState(null);

//     const { user, loading: authLoading } = useAuth();
//     const [reportingImage, setReportingImage] = useState(null);
//     const [reportReason, setReportReason] = useState("");
//     const [reportDetails, setReportDetails] = useState("");
//     const [reportSubmitting, setReportSubmitting] = useState(false);
//     const [reportError, setReportError] = useState("");
//     const [reportSuccess, setReportSuccess] = useState("");

//     useEffect(() => {
//         const controller = new AbortController();

//         async function fetchRestaurant() {
//             try {
//                 setIsLoading(true);
//                 setError("");
//                 setRestaurant(null);

//                 const response = await fetch(
//                     `http://localhost:5000/api/restaurants/${id}`,
//                     { signal: controller.signal }
//                 );

//                 const result = await response.json();

//                 if (!response.ok) {
//                     throw new Error(
//                         result.error || "Unable to load this restaurant."
//                     );
//                 }

//                 setRestaurant(result.data);
//             } catch (err) {
//                 if (err.name !== "AbortError") {
//                     setError(
//                         err.message || "Something went wrong."
//                     );
//                 }
//             } finally {
//                 if (!controller.signal.aborted) {
//                     setIsLoading(false);
//                 }
//             }
//         }

//         fetchRestaurant();

//         return () => controller.abort();
//     }, [id]);


//     useEffect(() => {
//         const controller = new AbortController();

//         async function fetchMenuImages() {
//             try {
//                 setIsMenusLoading(true);
//                 setMenusError("");

//                 const response = await fetch(
//                     `http://localhost:5000/api/restaurants/${id}/menus`,
//                     { signal: controller.signal }
//                 );

//                 const result = await response.json();

//                 if (!response.ok) {
//                     throw new Error(
//                         result.error || "Unable to load menu photos."
//                     );
//                 }

//                 setMenuImages(result.data);
//             } catch (err) {
//                 if (err.name !== "AbortError") {
//                     setMenusError(
//                         err.message || "Something went wrong."
//                     );
//                 }
//             } finally {
//                 if (!controller.signal.aborted) {
//                     setIsMenusLoading(false);
//                 }
//             }
//         }

//         fetchMenuImages();

//         return () => controller.abort();
//     }, [id]);


    


//     const openReportForm = (menu) => {
//         setReportingImage(menu);
//         setReportReason("");
//         setReportDetails("");
//         setReportError("");
//         setReportSuccess("");
//     };

//     const closeReportForm = () => {
//         setReportingImage(null);
//         setReportReason("");
//         setReportDetails("");
//         setReportError("");
//         setReportSuccess("");
//     };

//     const handleReportSubmit = async (event) => {
//         event.preventDefault();

//         if (!user) {
//             setReportError("Please log in before submitting a report.");
//             return;
//         }

//         if (!reportingImage?.id) {
//             setReportError("Unable to identify the menu photo.");
//             return;
//         }

//         if (!reportReason) {
//             setReportError("Please select a reason for reporting this photo.");
//             return;
//         }

//         if (reportSubmitting) return;

//         setReportSubmitting(true);
//         setReportError("");
//         setReportSuccess("");

//         try {
//             const { error: submitError } = await supabase
//                 .from("reports")
//                 .insert({
//                     reported_by: user.id,
//                     menu_image_id: reportingImage.id,
//                     reason: reportReason,
//                     details: reportDetails.trim() || null,
//                     status: "pending",
//                 });

//             if (submitError) {
//                 if (submitError.code === "23505") {
//                     throw new Error(
//                         "You have already reported this menu photo."
//                     );
//                 }

//                 if (submitError.code === "42501") {
//                     throw new Error(
//                         "You do not have permission to submit this report."
//                     );
//                 }

//                 if (submitError.code === "23503") {
//                     throw new Error(
//                         "This menu photo no longer exists or is unavailable."
//                     );
//                 }

//                 throw new Error(
//                     submitError.message || "Unable to submit your report."
//                 );
//             }

//             setReportSuccess(
//                 "Report submitted. A moderator will review this photo."
//             );
//             setReportReason("");
//             setReportDetails("");
//         } catch (err) {
//             setReportError(err.message || "Something went wrong.");
//         } finally {
//             setReportSubmitting(false);
//         }
//     };






//     const location = restaurant
//         ? [
//               restaurant.address,
//               restaurant.area,
//               restaurant.city,
//           ]
//               .filter(Boolean)
//               .filter((value, index, array) =>
//                   array.indexOf(value) === index
//               )
//               .join(", ")
//         : "";

//     return (
//         <div className="min-h-screen bg-paper text-ink">
//             <Navbar />

//             <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
//                 <Link
//                     to="/"
//                     className="inline-flex items-center gap-2 border-b border-ink pb-1 text-sm font-semibold hover:border-teal"
//                 >
//                     <ArrowLeft size={16} />
//                     Back to listings
//                 </Link>

//                 {isLoading ? (
//                     <section
//                         className="border-y border-line py-16"
//                         role="status"
//                     >
//                         <h1 className="text-2xl font-bold">
//                             Loading restaurant...
//                         </h1>
//                         <p className="mt-2 text-muted">
//                             Fetching restaurant details.
//                         </p>
//                     </section>
//                 ) : error ? (
//                     <section
//                         className="border-y border-line py-16"
//                         role="alert"
//                     >
//                         <h1 className="text-2xl font-bold">
//                             Couldn't load restaurant
//                         </h1>
//                         <p className="mt-3 text-muted">{error}</p>

//                         <Link
//                             to="/"
//                             className="mt-5 inline-block border-2 border-ink bg-mint px-4 py-2 font-semibold hover:bg-teal"
//                         >
//                             Return home
//                         </Link>
//                     </section>
//                 ) : restaurant ? (
//                     <>
//                         <section className="mt-8 border-b-2 border-ink pb-8 sm:mt-12 sm:pb-10">
//                             {restaurant.cover_image_url ? (
//                                 <img
//                                     src={restaurant.cover_image_url}
//                                     alt={`${restaurant.name} venue`}
//                                     className="mb-8 h-56 w-full border border-ink object-cover sm:h-80 lg:h-96"
//                                 />
//                             ) : (
//                                 <div className="mb-8 flex h-56 items-center justify-center border border-ink bg-mint sm:h-80 lg:h-96">
//                                     <Utensils
//                                         size={56}
//                                         strokeWidth={1.3}
//                                     />
//                                 </div>
//                             )}

//                             <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest">
//                                 <Utensils size={16} />
//                                 Restaurant details
//                             </p>

//                             <h1 className="mt-4 max-w-4xl break-words text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
//                                 {restaurant.name}
//                             </h1>

//                             {restaurant.description && (
//                                 <p className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg">
//                                     {restaurant.description}
//                                 </p>
//                             )}

//                             <div className="mt-6 flex flex-wrap items-start gap-x-6 gap-y-4">
//                                 {location && (
//                                     <p className="flex items-start gap-2 text-sm sm:text-base">
//                                         <MapPin
//                                             size={19}
//                                             className="mt-0.5 shrink-0"
//                                         />
//                                         <span>{location}</span>
//                                     </p>
//                                 )}

//                                 {restaurant.google_maps_url && (
//                                     <a
//                                         href={restaurant.google_maps_url}
//                                         target="_blank"
//                                         rel="noreferrer"
//                                         className="inline-flex items-center gap-2 border-b border-ink pb-1 text-sm font-semibold hover:border-teal"
//                                     >
//                                         View on Google Maps
//                                         <ExternalLink size={15} />
//                                     </a>
//                                 )}
//                             </div>
//                         </section>

                        
//                         <section className="py-10 sm:py-12">
//                             <p className="text-sm font-semibold uppercase tracking-widest">
//                                 Menu
//                             </p>

//                             <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
//                                 Explore the menu
//                             </h2>

//                             {isMenusLoading ? (
//                                 <div className="mt-6 border-y border-line py-10" role="status">
//                                     <p className="font-semibold">Loading menu photos...</p>
//                                 </div>
//                             ) : menusError ? (
//                                 <div className="mt-6 border-y border-line py-10" role="alert">
//                                     <h3 className="font-bold">Couldn't load menu photos</h3>
//                                     <p className="mt-2 text-sm text-muted">{menusError}</p>
//                                 </div>
//                             ) : menuImages.length > 0 ? (
//                                 <>
//                                     <p className="mt-3 text-sm text-muted">
//                                         {menuImages.length} approved{" "}
//                                         {menuImages.length === 1 ? "photo" : "photos"}
//                                     </p>

//                                     <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
//                                         {menuImages.map((menu) => (
//                                             <div
//                                                 key={menu.id}
//                                                 className="min-w-0 border border-ink"
//                                             >
//                                                 <button
//                                                     type="button"
//                                                     onClick={() => setSelectedImage(menu)}
//                                                     className="group block w-full min-w-0 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
//                                                     aria-label={`View menu photo${menu.caption ? `: ${menu.caption}` : ""}`}
//                                                 >
//                                                     <img
//                                                         src={menu.image_url}
//                                                         alt={menu.caption || "Restaurant menu"}
//                                                         loading="lazy"
//                                                         className="h-48 w-full object-cover transition-opacity group-hover:opacity-80 sm:h-60"
//                                                     />

//                                                     {menu.caption && (
//                                                         <span className="block border-t border-line p-2 text-sm">
//                                                             {menu.caption}
//                                                         </span>
//                                                     )}
//                                                 </button>

//                                                 <div className="border-t border-line p-2">
//                                                     <button
//                                                         type="button"
//                                                         onClick={() => openReportForm(menu)}
//                                                         className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold underline underline-offset-4 hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
//                                                         aria-label="Report this menu photo"
//                                                     >
//                                                         <Flag size={15} />
//                                                         Report photo
//                                                     </button>

//                                                     {reportingImage?.id === menu.id && (
//                                                         <div className="mt-3 border-t border-line pt-3">
//                                                             <div className="flex items-start justify-between gap-3">
//                                                                 <h3 className="font-bold">
//                                                                     Report this photo
//                                                                 </h3>

//                                                                 <button
//                                                                     type="button"
//                                                                     onClick={closeReportForm}
//                                                                     className="shrink-0 underline underline-offset-4"
//                                                                     aria-label="Close report form"
//                                                                 >
//                                                                     Cancel
//                                                                 </button>
//                                                             </div>

//                                                             {authLoading ? (
//                                                                 <p className="mt-3 text-sm text-muted" role="status">
//                                                                     Checking your sign-in status...
//                                                                 </p>
//                                                             ) : !user ? (
//                                                                 <p className="mt-3 text-sm leading-6 text-muted">
//                                                                     You need to{" "}
//                                                                     <Link
//                                                                         to="/login"
//                                                                         className="font-semibold text-ink underline underline-offset-4"
//                                                                     >
//                                                                         log in
//                                                                     </Link>{" "}
//                                                                     before reporting a photo.
//                                                                 </p>
//                                                             ) : reportSuccess ? (
//                                                                 <div className="mt-3" role="status">
//                                                                     <p className="text-sm leading-6">
//                                                                         {reportSuccess}
//                                                                     </p>
//                                                                     <button
//                                                                         type="button"
//                                                                         onClick={closeReportForm}
//                                                                         className="mt-3 border border-ink bg-mint px-3 py-2 text-sm font-semibold hover:bg-teal"
//                                                                     >
//                                                                         Done
//                                                                     </button>
//                                                                 </div>
//                                                             ) : (
//                                                                 <form
//                                                                     onSubmit={handleReportSubmit}
//                                                                     className="mt-3 space-y-3"
//                                                                 >
//                                                                     <div>
//                                                                         <label
//                                                                             htmlFor={`report-reason-${menu.id}`}
//                                                                             className="mb-1 block text-sm font-semibold"
//                                                                         >
//                                                                             Reason
//                                                                         </label>

//                                                                         <select
//                                                                             id={`report-reason-${menu.id}`}
//                                                                             value={reportReason}
//                                                                             onChange={(event) =>
//                                                                                 setReportReason(event.target.value)
//                                                                             }
//                                                                             required
//                                                                             disabled={reportSubmitting}
//                                                                             className="min-h-11 w-full min-w-0 border border-ink bg-paper px-3 py-2 text-sm"
//                                                                         >
//                                                                             <option value="">
//                                                                                 Select a reason
//                                                                             </option>
//                                                                             <option value="Incorrect or outdated menu">
//                                                                                 Incorrect or outdated menu
//                                                                             </option>
//                                                                             <option value="Misleading or edited photo">
//                                                                                 Misleading or edited photo
//                                                                             </option>
//                                                                             <option value="Inappropriate content">
//                                                                                 Inappropriate content
//                                                                             </option>
//                                                                             <option value="Spam or duplicate photo">
//                                                                                 Spam or duplicate photo
//                                                                             </option>
//                                                                             <option value="Other">
//                                                                                 Other
//                                                                             </option>
//                                                                         </select>
//                                                                     </div>

//                                                                     <div>
//                                                                         <label
//                                                                             htmlFor={`report-details-${menu.id}`}
//                                                                             className="mb-1 block text-sm font-semibold"
//                                                                         >
//                                                                             Additional details (optional)
//                                                                         </label>

//                                                                         <textarea
//                                                                             id={`report-details-${menu.id}`}
//                                                                             value={reportDetails}
//                                                                             onChange={(event) =>
//                                                                                 setReportDetails(event.target.value)
//                                                                             }
//                                                                             maxLength={1000}
//                                                                             rows={3}
//                                                                             disabled={reportSubmitting}
//                                                                             placeholder="Explain the issue..."
//                                                                             className="w-full min-w-0 resize-y border border-ink bg-paper px-3 py-2 text-sm"
//                                                                         />
//                                                                     </div>

//                                                                     {reportError && (
//                                                                         <p
//                                                                             className="text-sm text-red-700"
//                                                                             role="alert"
//                                                                         >
//                                                                             {reportError}
//                                                                         </p>
//                                                                     )}

//                                                                     <button
//                                                                         type="submit"
//                                                                         disabled={reportSubmitting || !reportReason}
//                                                                         className="min-h-11 w-full border-2 border-ink bg-pink px-3 py-2 text-sm font-semibold hover:bg-mint disabled:cursor-not-allowed disabled:opacity-60"
//                                                                     >
//                                                                         {reportSubmitting
//                                                                             ? "Submitting..."
//                                                                             : "Submit report"}
//                                                                     </button>

//                                                                     <p className="text-xs leading-5 text-muted">
//                                                                         Reports are reviewed by moderators.
//                                                                         Reporting a photo does not automatically
//                                                                         remove it.
//                                                                     </p>
//                                                                 </form>
//                                                             )}
//                                                         </div>
//                                                     )}
//                                                 </div>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 </>
//                             ) : (
//                                 <div className="mt-6 border-y border-line py-10">
//                                     <Utensils size={32} strokeWidth={1.4} />

//                                     <h3 className="mt-4 text-lg font-bold">
//                                         No menu photos yet
//                                     </h3>

//                                     <p className="mt-2 max-w-xl leading-6 text-muted">
//                                         Menu photos shared by the community will appear here
//                                         once they have been approved.
//                                     </p>
//                                 </div>
//                             )}
//                         </section>
//                     </>
//                 ) : null}

                
//                 {selectedImage && (
//                     <div
//                         className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4"
//                         onClick={() => setSelectedImage(null)}
//                         onKeyDown={(event) => {
//                             if (event.key === "Escape") {
//                                 setSelectedImage(null);
//                             }
//                         }}
//                         role="presentation"
//                     >
//                         <div
//                             className="relative max-h-full w-full max-w-4xl"
//                             onClick={(event) => event.stopPropagation()}
//                             role="dialog"
//                             aria-modal="true"
//                             aria-label="Enlarged menu photo"
//                         >
//                             <button
//                                 type="button"
//                                 onClick={() => setSelectedImage(null)}
//                                 className="mb-3 ml-auto flex items-center gap-2 border border-paper bg-paper px-3 py-2 text-sm font-semibold text-ink"
//                             >
//                                 Close <X size={18} />
//                             </button>

//                             <img
//                                 src={selectedImage.image_url}
//                                 alt={selectedImage.caption || "Restaurant menu"}
//                                 className="mx-auto max-h-[75vh] w-auto max-w-full object-contain"
//                             />

//                             {selectedImage.caption && (
//                                 <p className="mt-3 text-center text-sm text-paper">
//                                     {selectedImage.caption}
//                                 </p>
//                             )}
//                         </div>
//                     </div>
//                 )}
//             </main>

//             <footer className="border-t-2 border-ink">
//                 <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
//                     <p>
//                         <span className="font-bold text-ink">
//                             SeeMenu
//                         </span>{" "}
//                         — Menus made easier to find.
//                     </p>
//                     <p>Community-powered food discovery.</p>
//                 </div>
//             </footer>
//         </div>
//     );
// }

// export default RestaurantDetails;   





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
                            Unable to open profile
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

                                <p className="mt-2 text-sm text-muted">
                                    Member since{" "}
                                    {contributor.created_at
                                        ? new Date(
                                              contributor.created_at
                                          ).toLocaleDateString()
                                        : "Unknown"}
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