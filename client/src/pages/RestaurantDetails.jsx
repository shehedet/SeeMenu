
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    MapPin,
    Utensils,
    ExternalLink,
    X,
    Flag,
    ThumbsUp,
    ThumbsDown,
    Trash2,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

function RestaurantDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [restaurant, setRestaurant] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [deletingRestaurant, setDeletingRestaurant] = useState(false);
    const [deleteRestaurantError, setDeleteRestaurantError] = useState("");

    const [menuImages, setMenuImages] = useState([]);
    const [isMenusLoading, setIsMenusLoading] = useState(true);
    const [menusError, setMenusError] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [deletingMenuImageId, setDeletingMenuImageId] = useState(null);
    const [menuDeleteError, setMenuDeleteError] = useState("");
    const { user, profile, loading: authLoading } = useAuth();
    
    const canEditRestaurant =
    user && ["moderator", "admin"].includes(profile?.role);

    const [isEditingRestaurant, setIsEditingRestaurant] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        description: "",
        address: "",
        area: "",
        city: "",
        google_maps_url: "",
    });
    const [editCoverFile, setEditCoverFile] = useState(null);
    const [editCoverPreview, setEditCoverPreview] = useState("");
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editError, setEditError] = useState("");
    const [editSuccess, setEditSuccess] = useState("");

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

    
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(true);
    const [commentsError, setCommentsError] = useState("");
    const [commentText, setCommentText] = useState("");
    const [commentSubmitting, setCommentSubmitting] = useState(false);
    const [commentActionId, setCommentActionId] = useState("");
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentText, setEditingCommentText] = useState("");
    const [commentSuccess, setCommentSuccess] = useState("");

    
    const [reportingCommentId, setReportingCommentId] = useState(null);
    const [commentReportReason, setCommentReportReason] = useState("");
    const [commentReportDetails, setCommentReportDetails] = useState("");
    const [commentReportSubmitting, setCommentReportSubmitting] = useState(false);
    const [commentReportError, setCommentReportError] = useState("");
    const [commentReportSuccess, setCommentReportSuccess] = useState("");




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


    
    const handleCommentSubmit = async (event) => {
        event.preventDefault();

        if (!user) {
            setCommentsError("Please log in to leave a comment.");
            return;
        }

        const content = commentText.trim();

        if (!content) {
            setCommentsError("Write a comment before submitting.");
            return;
        }

        if (commentSubmitting) return;

        setCommentSubmitting(true);
        setCommentsError("");
        setCommentSuccess("");

        try {
            const { error: insertError } = await supabase
                .from("comments")
                .insert({
                    restaurant_id: restaurant.id,
                    user_id: user.id,
                    content,
                });

            if (insertError) throw insertError;

            setCommentText("");
            setCommentSuccess("Your comment was posted.");
            await refreshComments();
        } catch (err) {
            console.error("Error posting comment:", err);
            setCommentsError(
                err.message || "Unable to post your comment."
            );
        } finally {
            setCommentSubmitting(false);
        }
    };



    
    const canModerateComments = ["moderator", "admin"].includes(profile?.role);

    
    const canDeleteMenuImages =
        user && ["moderator", "admin"].includes(profile?.role);

    const handleMenuImageDelete = async (menu) => {
        const confirmed = window.confirm(
            `Permanently delete this menu photo${menu.caption ? ` ("${menu.caption}")` : ""}?\n\n` +
            "The photo and its associated votes and reports will be deleted. This action cannot be undone."
        );

        if (!confirmed || deletingMenuImageId) return;

        setDeletingMenuImageId(menu.id);
        setMenuDeleteError("");

        try {
            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError) throw sessionError;

            const token = session?.access_token;

            if (!token) {
                throw new Error("Your session has expired. Please log in again.");
            }

            const API_URL =
                import.meta.env.VITE_API_URL || "http://localhost:5000";

            const response = await fetch(
                `${API_URL}/api/menu-images/${menu.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    result.error || "Unable to delete this menu photo."
                );
            }

            // Remove the photo from the page without refreshing.
            setMenuImages((current) =>
                current.filter((image) => image.id !== menu.id)
            );

            // Remove this photo's vote data from local state.
            setMenuVotes((current) => {
                const updated = { ...current };
                delete updated[menu.id];
                return updated;
            });

            // Close the enlarged view if it shows the deleted photo.
            setSelectedImage((current) =>
                current?.id === menu.id ? null : current
            );

            // Close the report form if it belongs to this photo.
            if (reportingImage?.id === menu.id) {
                closeReportForm();
            }
        } catch (err) {
            console.error("Error deleting menu photo:", err);
            setMenuDeleteError(
                err.message || "Something went wrong while deleting the photo."
            );
        } finally {
            setDeletingMenuImageId(null);
        }
    };


    const handleCommentEdit = async (commentId) => {
        const content = editingCommentText.trim();

        if (!content) {
            setCommentsError("A comment cannot be empty.");
            return;
        }

        if (content.length > 2000) {
            setCommentsError("Comments cannot exceed 2000 characters.");
            return;
        }

        if (commentActionId) return;

        setCommentActionId(commentId);
        setCommentsError("");
        setCommentSuccess("");

        try {
            const { error: updateError } = await supabase
                .from("comments")
                .update({
                    content,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", commentId);

            if (updateError) throw updateError;

            setEditingCommentId(null);
            setEditingCommentText("");
            setCommentSuccess("Comment updated successfully.");

            await refreshComments();
        } catch (err) {
            console.error("Error updating comment:", err);
            setCommentsError(err.message || "Unable to update comment.");
        } finally {
            setCommentActionId("");
        }
    };

    const handleCommentDelete = async (comment) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this comment? This cannot be undone."
        );

        if (!confirmed || commentActionId) return;

        setCommentActionId(comment.id);
        setCommentsError("");
        setCommentSuccess("");

        try {
            const { error: deleteError } = await supabase
                .from("comments")
                .delete()
                .eq("id", comment.id);

            if (deleteError) throw deleteError;

            if (editingCommentId === comment.id) {
                setEditingCommentId(null);
                setEditingCommentText("");
            }

            setCommentSuccess("Comment deleted successfully.");
            await refreshComments();
        } catch (err) {
            console.error("Error deleting comment:", err);
            setCommentsError(err.message || "Unable to delete comment.");
        } finally {
            setCommentActionId("");
        }
    };

    
    const refreshComments = useCallback(async () => {
        if (!restaurant?.id) return;

        setCommentsLoading(true);
        setCommentsError("");

        try {
            const { data, error: fetchError } = await supabase
                .from("comments")
                .select(`
                    id,
                    restaurant_id,
                    user_id,
                    content,
                    created_at,
                    updated_at,
                    profiles (
                        id,
                        username
                    )
                `)
                .eq("restaurant_id", restaurant.id)
                .order("created_at", { ascending: false });

            if (fetchError) throw fetchError;

            setComments(data || []);
        } catch (err) {
            console.error("Error loading comments:", err);
            setCommentsError("Unable to load comments. Please try again.");
        } finally {
            setCommentsLoading(false);
        }
    }, [restaurant?.id]);



    useEffect(() => {
        refreshComments();
    }, [refreshComments]);



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


    
    const startEditingRestaurant = () => {
        setEditForm({
            name: restaurant.name || "",
            description: restaurant.description || "",
            address: restaurant.address || "",
            area: restaurant.area || "",
            city: restaurant.city || "",
            google_maps_url: restaurant.google_maps_url || "",
        });

        setEditCoverFile(null);
        setEditCoverPreview("");
        setEditError("");
        setEditSuccess("");
        setIsEditingRestaurant(true);
    };

    const cancelEditingRestaurant = () => {
        if (editCoverPreview) {
            URL.revokeObjectURL(editCoverPreview);
        }

        setEditCoverFile(null);
        setEditCoverPreview("");
        setEditError("");
        setIsEditingRestaurant(false);
    };

    const handleEditCoverChange = (event) => {
        const file = event.target.files?.[0];

        setEditError("");

        if (editCoverPreview) {
            URL.revokeObjectURL(editCoverPreview);
        }

        setEditCoverFile(null);
        setEditCoverPreview("");

        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
            setEditError("Choose a JPEG, PNG, or WebP image.");
            event.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setEditError("The cover image must be 5 MB or smaller.");
            event.target.value = "";
            return;
        }

        setEditCoverFile(file);
        setEditCoverPreview(URL.createObjectURL(file));
    };

    const handleRestaurantUpdate = async (event) => {
        event.preventDefault();

        if (!user || !canEditRestaurant) {
            setEditError("Only moderators and admins can edit restaurants.");
            return;
        }

        const name = editForm.name.trim();

        if (!name) {
            setEditError("Restaurant name is required.");
            return;
        }

        if (name.length > 150) {
            setEditError("Restaurant name cannot exceed 150 characters.");
            return;
        }

        const mapsUrl = editForm.google_maps_url.trim();

        if (mapsUrl) {
            try {
                const parsedUrl = new URL(mapsUrl);

                if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                    throw new Error();
                }
            } catch {
                setEditError("Enter a valid Google Maps URL.");
                return;
            }
        }

        if (editSubmitting) return;

        setEditSubmitting(true);
        setEditError("");
        setEditSuccess("");

        let uploadedPath = "";

        try {
            let coverUrl = restaurant.cover_image_url || null;

            // Upload a new cover only if the editor has selected one.
            if (editCoverFile) {
                const extensionByType = {
                    "image/jpeg": "jpg",
                    "image/png": "png",
                    "image/webp": "webp",
                };

                const extension = extensionByType[editCoverFile.type];

                uploadedPath =
                    `${restaurant.id}/${crypto.randomUUID()}.${extension}`;

                const { error: uploadError } = await supabase.storage
                    .from("restaurant-covers")
                    .upload(uploadedPath, editCoverFile, {
                        contentType: editCoverFile.type,
                        upsert: false,
                    });

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from("restaurant-covers")
                    .getPublicUrl(uploadedPath);

                coverUrl = publicUrlData.publicUrl;
            }

            const updatedFields = {
                name,
                description: editForm.description.trim() || null,
                address: editForm.address.trim() || null,
                area: editForm.area.trim() || null,
                city: editForm.city.trim() || null,
                google_maps_url: mapsUrl || null,
                cover_image_url: coverUrl,
                updated_at: new Date().toISOString(),
            };

            const { data: updatedRestaurant, error: updateError } =
                await supabase
                    .from("restaurants")
                    .update(updatedFields)
                    .eq("id", restaurant.id)
                    .select()
                    .single();

            if (updateError) throw updateError;

            // The database update succeeded. The new cover is now in use.
            setRestaurant(updatedRestaurant);
            setIsEditingRestaurant(false);
            setEditCoverFile(null);

            if (editCoverPreview) {
                URL.revokeObjectURL(editCoverPreview);
            }

            setEditCoverPreview("");
            setEditSuccess("Restaurant details updated successfully.");

            // Remove the previous cover only after the database update succeeds.
            const oldCoverUrl = restaurant.cover_image_url;

            if (editCoverFile && oldCoverUrl) {
                try {
                    const oldUrl = new URL(oldCoverUrl);
                    const marker =
                        "/storage/v1/object/public/restaurant-covers/";

                    const markerIndex = oldUrl.pathname.indexOf(marker);

                    // Only delete files hosted in this Supabase Storage bucket.
                    if (markerIndex !== -1) {
                        const oldPath = decodeURIComponent(
                            oldUrl.pathname.slice(markerIndex + marker.length)
                        );

                        if (oldPath && oldPath !== uploadedPath) {
                            const { error: cleanupError } = await supabase.storage
                                .from("restaurant-covers")
                                .remove([oldPath]);

                            if (cleanupError) {
                                console.error(
                                    "Could not remove the previous cover:",
                                    cleanupError
                                );
                            }
                        }
                    }
                } catch (cleanupError) {
                    console.error(
                        "Could not process the previous cover URL:",
                        cleanupError
                    );
                }
            }
        } catch (err) {
            console.error("Error updating restaurant:", err);

            // Roll back the new upload if the database update failed.
            if (uploadedPath) {
                const { error: cleanupError } = await supabase.storage
                    .from("restaurant-covers")
                    .remove([uploadedPath]);

                if (cleanupError) {
                    console.error(
                        "Could not remove the unused cover:",
                        cleanupError
                    );
                }
            }

            setEditError(
                err.message || "Unable to update restaurant details."
            );
        } finally {
            setEditSubmitting(false);
        }
    };


    const handleRestaurantDelete = async () => {
        if (!user || !canEditRestaurant || !restaurant?.id) {
            setDeleteRestaurantError(
                "Only moderators and admins can delete restaurants."
            );
            return;
        }

        const confirmed = window.confirm(
            `Permanently delete "${restaurant.name}"?\n\n` +
            "This will also delete its menu photos and associated content. This action cannot be undone."
        );

        if (!confirmed || deletingRestaurant) return;

        setDeletingRestaurant(true);
        setDeleteRestaurantError("");

        try {
            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError) throw sessionError;

            const token = session?.access_token;

            if (!token) {
                throw new Error(
                    "Your session has expired. Please log in again."
                );
            }

            const API_URL =
                import.meta.env.VITE_API_URL || "http://localhost:5000";

            const response = await fetch(
                `${API_URL}/api/restaurants/${restaurant.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    result.error || "Unable to delete this restaurant."
                );
            }

            // Return to the listings after successful deletion.
            navigate("/");
        } catch (err) {
            console.error("Error deleting restaurant:", err);
            setDeleteRestaurantError(
                err.message || "Something went wrong while deleting the restaurant."
            );
        } finally {
            setDeletingRestaurant(false);
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


    
    const handleCommentReport = async (event, commentId) => {
        event.preventDefault();

        if (!user) {
            setCommentReportError("Please log in to report a comment.");
            return;
        }

        if (!commentReportReason) {
            setCommentReportError("Choose a reason for reporting.");
            return;
        }

        if (commentReportSubmitting) return;

        setCommentReportSubmitting(true);
        setCommentReportError("");
        setCommentReportSuccess("");

        try {
            const { error: insertError } = await supabase
                .from("reports")
                .insert({
                    reported_by: user.id,
                    comment_id: commentId,
                    reason: commentReportReason,
                    details: commentReportDetails.trim() || null,
                    status: "pending",
                });

            if (insertError) throw insertError;

            setCommentReportSuccess("Comment reported. The moderation team can review it.");
            setReportingCommentId(null);
            setCommentReportReason("");
            setCommentReportDetails("");
        } catch (err) {
            console.error("Error reporting comment:", err);
            setCommentReportError(
                err.message || "Unable to submit the report. Please try again."
            );
        } finally {
            setCommentReportSubmitting(false);
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
                            {isEditingRestaurant ? (
                                <form onSubmit={handleRestaurantUpdate} className="space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h1 className="text-2xl font-bold sm:text-3xl">
                                            Edit restaurant
                                        </h1>

                                        <button
                                            type="button"
                                            onClick={cancelEditingRestaurant}
                                            disabled={editSubmitting}
                                            className="min-h-10 border border-ink px-4 py-2 text-sm font-semibold hover:bg-pink disabled:opacity-60"
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                    <div>
                                        <label htmlFor="edit-restaurant-name" className="block text-sm font-semibold">
                                            Restaurant name *
                                        </label>
                                        <input
                                            id="edit-restaurant-name"
                                            value={editForm.name}
                                            onChange={(event) =>
                                                setEditForm({ ...editForm, name: event.target.value })
                                            }
                                            maxLength={150}
                                            required
                                            disabled={editSubmitting}
                                            className="mt-2 min-h-11 w-full border-2 border-ink bg-paper px-3 py-2"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="edit-restaurant-description" className="block text-sm font-semibold">
                                            Description
                                        </label>
                                        <textarea
                                            id="edit-restaurant-description"
                                            value={editForm.description}
                                            onChange={(event) =>
                                                setEditForm({ ...editForm, description: event.target.value })
                                            }
                                            rows={4}
                                            disabled={editSubmitting}
                                            className="mt-2 w-full border-2 border-ink bg-paper p-3"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="edit-restaurant-address" className="block text-sm font-semibold">
                                            Street address
                                        </label>
                                        <input
                                            id="edit-restaurant-address"
                                            value={editForm.address}
                                            onChange={(event) =>
                                                setEditForm({ ...editForm, address: event.target.value })
                                            }
                                            disabled={editSubmitting}
                                            className="mt-2 min-h-11 w-full border-2 border-ink bg-paper px-3 py-2"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="edit-restaurant-area" className="block text-sm font-semibold">
                                                Area / neighbourhood
                                            </label>
                                            <input
                                                id="edit-restaurant-area"
                                                value={editForm.area}
                                                onChange={(event) =>
                                                    setEditForm({ ...editForm, area: event.target.value })
                                                }
                                                disabled={editSubmitting}
                                                className="mt-2 min-h-11 w-full border-2 border-ink bg-paper px-3 py-2"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="edit-restaurant-city" className="block text-sm font-semibold">
                                                City
                                            </label>
                                            <input
                                                id="edit-restaurant-city"
                                                value={editForm.city}
                                                onChange={(event) =>
                                                    setEditForm({ ...editForm, city: event.target.value })
                                                }
                                                disabled={editSubmitting}
                                                className="mt-2 min-h-11 w-full border-2 border-ink bg-paper px-3 py-2"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="edit-restaurant-maps" className="block text-sm font-semibold">
                                            Google Maps URL
                                        </label>
                                        <input
                                            id="edit-restaurant-maps"
                                            type="url"
                                            value={editForm.google_maps_url}
                                            onChange={(event) =>
                                                setEditForm({ ...editForm, google_maps_url: event.target.value })
                                            }
                                            placeholder="https://maps.google.com/..."
                                            disabled={editSubmitting}
                                            className="mt-2 min-h-11 w-full border-2 border-ink bg-paper px-3 py-2"
                                        />
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold">Cover image</p>

                                        {editCoverPreview ? (
                                            <img
                                                src={editCoverPreview}
                                                alt="New restaurant cover preview"
                                                className="mt-3 h-48 w-full border border-ink object-cover sm:h-64"
                                            />
                                        ) : restaurant.cover_image_url ? (
                                            <img
                                                src={restaurant.cover_image_url}
                                                alt={`${restaurant.name} current cover`}
                                                className="mt-3 h-48 w-full border border-ink object-cover sm:h-64"
                                            />
                                        ) : (
                                            <div className="mt-3 flex h-40 items-center justify-center border border-ink bg-mint">
                                                <Utensils size={40} strokeWidth={1.3} />
                                            </div>
                                        )}

                                        <label htmlFor="edit-restaurant-cover" className="mt-4 block text-sm font-semibold">
                                            Choose a replacement cover (optional)
                                        </label>
                                        <input
                                            id="edit-restaurant-cover"
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleEditCoverChange}
                                            disabled={editSubmitting}
                                            className="mt-2 block w-full text-sm"
                                        />
                                        <p className="mt-2 text-xs text-muted">
                                            JPEG, PNG, or WebP. Maximum 5 MB. Leave this empty to keep the current cover.
                                        </p>
                                    </div>

                                    {editError && (
                                        <p role="alert" className="text-sm text-red-700">
                                            {editError}
                                        </p>
                                    )}

                                    
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="submit"
                                            disabled={editSubmitting || deletingRestaurant}
                                            className="min-h-11 border-2 border-ink bg-mint px-5 py-3 text-sm font-bold hover:bg-teal disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {editSubmitting ? "Saving changes..." : "Save changes"}
                                        </button>
                                    </div>

                                    <div className="mt-8 border-t-2 border-ink pt-5">
                                        <h2 className="text-lg font-bold">Danger zone</h2>

                                        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                                            Permanently remove this restaurant and its associated menu photos.
                                            This action cannot be undone.
                                        </p>

                                        {deleteRestaurantError && (
                                            <p role="alert" className="mt-3 text-sm text-red-700">
                                                {deleteRestaurantError}
                                            </p>
                                        )}

                                        <button
                                            type="button"
                                            onClick={handleRestaurantDelete}
                                            disabled={deletingRestaurant || editSubmitting}
                                            className="mt-4 inline-flex min-h-11 items-center gap-2 border-2 border-ink bg-pink px-4 py-2 text-sm font-bold hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <Trash2 size={16} />
                                            {deletingRestaurant ? "Deleting restaurant..." : "Delete this restaurant"}
                                        </button>
                                    </div>

                                </form>
                            ) : (
                                <>
                                    {restaurant.cover_image_url ? (
                                        <img
                                            src={restaurant.cover_image_url}
                                            alt={`${restaurant.name} venue`}
                                            className="mb-8 h-56 w-full border border-ink object-cover sm:h-80 lg:h-96"
                                        />
                                    ) : (
                                        <div className="mb-8 flex h-56 items-center justify-center border border-ink bg-mint sm:h-80 lg:h-96">
                                            <Utensils size={56} strokeWidth={1.3} />
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest">
                                                <Utensils size={16} />
                                                Restaurant details
                                            </p>

                                            <h1 className="mt-4 max-w-4xl break-words text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
                                                {restaurant.name}
                                            </h1>
                                        </div>

                                        {canEditRestaurant && (
                                            <button
                                                type="button"
                                                onClick={startEditingRestaurant}
                                                className="min-h-11 border-2 border-ink bg-mint px-4 py-2 text-sm font-bold hover:bg-teal"
                                            >
                                                Edit restaurant
                                            </button>
                                        )}
                                    </div>

                                    {editSuccess && (
                                        <p role="status" className="mt-4 text-sm">
                                            {editSuccess}
                                        </p>
                                    )}

                                    {restaurant.description && (
                                        <p className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg">
                                            {restaurant.description}
                                        </p>
                                    )}

                                    <div className="mt-6 flex flex-wrap items-start gap-x-6 gap-y-4">
                                        {location && (
                                            <p className="flex items-start gap-2 text-sm sm:text-base">
                                                <MapPin size={19} className="mt-0.5 shrink-0" />
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
                                </>
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
                                                
                                                {canDeleteMenuImages && (
                                                    <div className="border-t border-ink p-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMenuImageDelete(menu)}
                                                            disabled={deletingMenuImageId !== null}
                                                            className="flex min-h-10 w-full items-center justify-center gap-2 border border-ink px-3 py-2 text-sm font-semibold transition-colors hover:bg-pink disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <Trash2 size={15} />
                                                            {deletingMenuImageId === menu.id
                                                                ? "Deleting photo..."
                                                                : "Delete photo"}
                                                        </button>

                                                        {menuDeleteError && deletingMenuImageId === null && (
                                                            <p role="alert" className="mt-2 text-sm text-red-700">
                                                                {menuDeleteError}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}


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
                        

                        
                        <section className="mt-8 border-t-2 border-ink py-8 sm:mt-12 sm:py-10">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h2 className="text-2xl font-bold">
                                    Comments
                                </h2>
                                <span className="text-sm text-muted">
                                    {comments.length} {comments.length === 1 ? "comment" : "comments"}
                                </span>
                            </div>

                            <form onSubmit={handleCommentSubmit} className="mt-5">
                                <label
                                    htmlFor="restaurant-comment"
                                    className="block text-sm font-semibold"
                                >
                                    Leave a comment
                                </label>

                                <textarea
                                    id="restaurant-comment"
                                    value={commentText}
                                    onChange={(event) => setCommentText(event.target.value)}
                                    placeholder={
                                        user
                                            ? "Share your experience with this restaurant..."
                                            : "Log in to leave a comment."
                                    }
                                    disabled={!user || commentSubmitting}
                                    maxLength={2000}
                                    rows={4}
                                    className="mt-2 w-full border-2 border-ink bg-paper p-3 text-sm outline-none focus:border-teal disabled:opacity-60"
                                />

                                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                                    <span className="text-xs text-muted">
                                        {commentText.length}/2000 characters
                                    </span>

                                    <button
                                        type="submit"
                                        disabled={!user || !commentText.trim() || commentSubmitting}
                                        className="min-h-11 border-2 border-ink bg-mint px-4 py-2 text-sm font-semibold hover:bg-teal disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {commentSubmitting ? "Posting..." : "Post comment"}
                                    </button>
                                </div>
                            </form>

                            {commentsError && (
                                <p role="alert" className="mt-4 text-sm text-red-700">
                                    {commentsError}
                                </p>
                            )}

                            {commentSuccess && (
                                <p role="status" className="mt-4 text-sm">
                                    {commentSuccess}
                                </p>
                            )}

                            <div className="mt-8 divide-y divide-line border-y border-line">
                                {commentsLoading ? (
                                    <p className="py-5 text-sm text-muted">
                                        Loading comments...
                                    </p>
                                ) : comments.length === 0 ? (
                                    <p className="py-5 text-sm text-muted">
                                        No comments yet. Be the first to share your experience.
                                    </p>
                                ) : (
                                    comments.map((comment) => (
                                        <article key={comment.id} className="py-5">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className="text-sm font-semibold">
                                                    {comment.profiles?.username ||
                                                        (comment.user_id ? "Community member" : "Deleted user")}
                                                </p>

                                                <time
                                                    dateTime={comment.created_at || ""}
                                                    className="text-xs text-muted"
                                                >
                                                    {comment.created_at
                                                        ? new Date(comment.created_at).toLocaleDateString(
                                                            undefined,
                                                            {
                                                                year: "numeric",
                                                                month: "short",
                                                                day: "numeric",
                                                            }
                                                        )
                                                        : "Date unavailable"}
                                                </time>
                                            </div>

                                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">
                                                {/* {comment.content} */}
                                                {editingCommentId === comment.id ? (
                                                    <form
                                                        onSubmit={(event) => {
                                                            event.preventDefault();
                                                            handleCommentEdit(comment.id);
                                                        }}
                                                        className="mt-3"
                                                    >
                                                        <textarea
                                                            value={editingCommentText}
                                                            onChange={(event) =>
                                                                setEditingCommentText(event.target.value)
                                                            }
                                                            maxLength={2000}
                                                            rows={4}
                                                            required
                                                            disabled={commentActionId === comment.id}
                                                            className="w-full border-2 border-ink bg-paper p-3 text-sm outline-none focus:border-teal"
                                                        />

                                                        <div className="mt-3 flex flex-wrap gap-3">
                                                            <button
                                                                type="submit"
                                                                disabled={
                                                                    !editingCommentText.trim() ||
                                                                    commentActionId === comment.id
                                                                }
                                                                className="min-h-10 border-2 border-ink bg-mint px-3 py-2 text-sm font-semibold hover:bg-teal disabled:opacity-60"
                                                            >
                                                                {commentActionId === comment.id
                                                                    ? "Saving..."
                                                                    : "Save changes"}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                disabled={commentActionId === comment.id}
                                                                onClick={() => {
                                                                    setEditingCommentId(null);
                                                                    setEditingCommentText("");
                                                                }}
                                                                className="min-h-10 border border-line px-3 py-2 text-sm"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">
                                                        {comment.content}
                                                    </p>
                                                )}

                                                {comment.updated_at &&
                                                    comment.created_at &&
                                                    new Date(comment.updated_at).getTime() >
                                                        new Date(comment.created_at).getTime() + 1000 && (
                                                        <p className="mt-2 text-xs text-muted">
                                                            Edited
                                                        </p>
                                                    )}

                                                {user && (
                                                    <div className="mt-4 flex flex-wrap gap-4">
                                                        {(comment.user_id === user.id || canModerateComments) && (
                                                            <>
                                                                {comment.user_id === user.id && (
                                                                    <button
                                                                        type="button"
                                                                        disabled={Boolean(commentActionId)}
                                                                        onClick={() => {
                                                                            setEditingCommentId(comment.id);
                                                                            setEditingCommentText(comment.content || "");
                                                                            setCommentsError("");
                                                                            setCommentSuccess("");
                                                                        }}
                                                                        className="text-sm font-semibold underline underline-offset-4 disabled:opacity-50"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    disabled={Boolean(commentActionId)}
                                                                    onClick={() => handleCommentDelete(comment)}
                                                                    className="text-sm font-semibold text-red-700 underline underline-offset-4 disabled:opacity-50"
                                                                >
                                                                    {commentActionId === comment.id
                                                                        ? "Deleting..."
                                                                        : "Delete"}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                
                                                {user && comment.user_id !== user.id && (
                                                    <div className="mt-4">
                                                        {reportingCommentId === comment.id ? (
                                                            <form
                                                                onSubmit={(event) =>
                                                                    handleCommentReport(event, comment.id)
                                                                }
                                                                className="mt-3 border-t border-line pt-4"
                                                            >
                                                                <label
                                                                    htmlFor={`comment-report-reason-${comment.id}`}
                                                                    className="block text-sm font-semibold"
                                                                >
                                                                    Why are you reporting this comment?
                                                                </label>

                                                                <select
                                                                    id={`comment-report-reason-${comment.id}`}
                                                                    value={commentReportReason}
                                                                    onChange={(event) =>
                                                                        setCommentReportReason(event.target.value)
                                                                    }
                                                                    required
                                                                    disabled={commentReportSubmitting}
                                                                    className="mt-2 min-h-11 w-full border-2 border-ink bg-paper px-3 py-2 text-sm"
                                                                >
                                                                    <option value="">Choose a reason</option>
                                                                    <option value="Spam">Spam or advertising</option>
                                                                    <option value="Abusive content">Abusive or hateful content</option>
                                                                    <option value="Harassment">Harassment or bullying</option>
                                                                    <option value="False information">False or misleading information</option>
                                                                    <option value="Other">Other</option>
                                                                </select>

                                                                <label
                                                                    htmlFor={`comment-report-details-${comment.id}`}
                                                                    className="mt-4 block text-sm font-semibold"
                                                                >
                                                                    Additional details (optional)
                                                                </label>

                                                                <textarea
                                                                    id={`comment-report-details-${comment.id}`}
                                                                    value={commentReportDetails}
                                                                    onChange={(event) =>
                                                                        setCommentReportDetails(event.target.value)
                                                                    }
                                                                    maxLength={1000}
                                                                    rows={3}
                                                                    disabled={commentReportSubmitting}
                                                                    placeholder="Provide context for the moderation team..."
                                                                    className="mt-2 w-full border-2 border-ink bg-paper p-3 text-sm"
                                                                />

                                                                {commentReportError && (
                                                                    <p role="alert" className="mt-3 text-sm text-red-700">
                                                                        {commentReportError}
                                                                    </p>
                                                                )}

                                                                <div className="mt-3 flex flex-wrap gap-3">
                                                                    <button
                                                                        type="submit"
                                                                        disabled={!commentReportReason || commentReportSubmitting}
                                                                        className="min-h-10 border-2 border-ink bg-pink px-3 py-2 text-sm font-semibold disabled:opacity-60"
                                                                    >
                                                                        {commentReportSubmitting
                                                                            ? "Submitting..."
                                                                            : "Submit report"}
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        disabled={commentReportSubmitting}
                                                                        onClick={() => {
                                                                            setReportingCommentId(null);
                                                                            setCommentReportReason("");
                                                                            setCommentReportDetails("");
                                                                            setCommentReportError("");
                                                                        }}
                                                                        className="min-h-10 border border-line px-3 py-2 text-sm"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </form>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setReportingCommentId(comment.id);
                                                                    setCommentReportReason("");
                                                                    setCommentReportDetails("");
                                                                    setCommentReportError("");
                                                                    setCommentReportSuccess("");
                                                                }}
                                                                className="text-sm text-muted underline underline-offset-4 hover:text-ink"
                                                            >
                                                                Report comment
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {commentReportSuccess && (
                                                    <p role="status" className="mt-4 text-sm">
                                                        {commentReportSuccess}
                                                    </p>
                                                )}


                                            </p>
                                        </article>
                                    ))
                                )}
                            </div>
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