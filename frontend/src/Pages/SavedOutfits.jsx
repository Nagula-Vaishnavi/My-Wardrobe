
import { useEffect, useState } from "react";
import {
  Shirt,
  CloudSun,
  CalendarDays,
  RefreshCw,
  Trash2,
  Check,
  RotateCcw,
  Heart,
} from "lucide-react";

import PageHeader from "../Components/Pageheader";
import { apiRequest } from "../utils/api";


function SavedOutfits() {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  // Load saved outfits from the backend
  async function loadSavedOutfits() {
    setLoading(true);
    setError("");

    const token = sessionStorage.getItem("token");

    if (!token) {
      setError("Your session has expired. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const data = await apiRequest("/outfits");

      if (!Array.isArray(data)) {
        throw new Error("The server returned an unexpected response.");
      }

      setOutfits(data);
    } catch (err) {
      console.error("Error loading saved outfits:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Delete a saved outfit
  async function handleDeleteOutfit(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this saved outfit?"
    );

    if (!confirmed) {
      return;
    }

    const token = sessionStorage.getItem("token");

    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    try {
      await apiRequest(`/outfits/${id}`, { method: "DELETE" });

      // Remove the deleted outfit from the screen
      setOutfits((previousOutfits) =>
        previousOutfits.filter((outfit) => outfit.id !== id)
      );
    } catch (err) {
      console.error("Error deleting outfit:", err);
      window.alert(
        err.message || "Something went wrong while deleting the outfit."
      );
    }
  }

  async function handleToggleWorn(outfit) {
    const token = sessionStorage.getItem("token");
    if (!token) {
      window.alert("Your session has expired. Please log in again.");
      return;
    }

    setUpdatingId(outfit.id);
    try {
      const updated = await apiRequest(`/outfits/${outfit.id}/worn?worn=${!outfit.wornAt}`, {
        method: "PATCH",
      });
      setOutfits((previous) => previous.map((item) =>
        item.id === updated.id ? updated : item
      ));
    } catch (err) {
      console.error("Could not update outfit history:", err);
      window.alert(err.message || "Could not update outfit history.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleToggleFavorite(outfit) {
    setUpdatingId(outfit.id);
    try {
      const updated = await apiRequest(
        `/outfits/${outfit.id}/favorite?favorite=${!outfit.favorite}`,
        { method: "PATCH" }
      );
      setOutfits((previous) => previous.map((item) =>
        item.id === updated.id ? updated : item
      ));
    } catch (err) {
      window.alert(err.message || "Could not update this favorite.");
    } finally {
      setUpdatingId(null);
    }
  }

  // Load outfits when this page opens
  useEffect(() => {
    Promise.resolve().then(loadSavedOutfits);
  }, []);

  const visibleOutfits = outfits.filter((outfit) => {
    if (filter === "worn") return Boolean(outfit.wornAt);
    if (filter === "unworn") return !outfit.wornAt;
    if (filter === "favorites") return Boolean(outfit.favorite);
    return true;
  });

  return (
    <div className="content">
      <PageHeader
        eyebrow="Your personal collection"
        title="Saved Outfits"
        subtitle="Your favourite combinations, made from clothes you already own."
      />

      {/* Loading state */}
      {loading && (
        <div className="saved-outfits-message">
          Loading your saved outfits...
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="saved-outfits-message">
          <p>{error}</p>

          <button
            className="saved-outfits-retry"
            onClick={loadSavedOutfits}
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && outfits.length === 0 && (
        <div className="saved-outfits-empty panel">
          <Shirt size={36} />

          <h2>No saved outfits yet</h2>

          <p>
            Visit the Outfits page, generate a look, and save it.
            Your saved combinations will appear here.
          </p>
        </div>
      )}

      {/* Saved outfits grid */}
      {!loading && !error && outfits.length > 0 && (
        <>
        <div className="saved-outfits-filters" role="group" aria-label="Filter saved outfits">
          {[
            ["all", `All (${outfits.length})`],
            ["worn", `Worn (${outfits.filter((outfit) => outfit.wornAt).length})`],
            ["unworn", `Not worn (${outfits.filter((outfit) => !outfit.wornAt).length})`],
            ["favorites", `Favorites (${outfits.filter((outfit) => outfit.favorite).length})`],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? "selected" : ""}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {visibleOutfits.length === 0 ? (
          <div className="saved-outfits-message">No outfits match this filter.</div>
        ) : (
        <div className="saved-outfits-grid">
          {visibleOutfits.map((outfit) => {
            const clothingNames = outfit.clothingItemNames
              ? outfit.clothingItemNames
                  .split(",")
                  .map((name) => name.trim())
                  .filter(Boolean)
              : [];

            return (
              <article
                className="saved-outfit-card"
                key={outfit.id}
              >
                <div className="saved-outfit-card-top">
                  <div className="saved-outfit-icon">
                    <Shirt size={23} />
                  </div>

                  <span className="saved-outfit-badge">
                    {outfit.occasion || "Outfit"}
                  </span>
                </div>

                <h2>{outfit.name || "My Outfit"}</h2>
                {outfit.favorite && <p className="saved-outfit-worn-date"><Heart size={14} fill="currentColor" /> Favorite</p>}

                <div className="saved-outfit-meta">
                  <span>
                    <CalendarDays size={15} />
                    {outfit.occasion || "Occasion not specified"}
                  </span>

                  <span>
                    <CloudSun size={15} />
                    {outfit.weather || "Weather not specified"}
                  </span>
                </div>

                {outfit.wornAt && (
                  <p className="saved-outfit-worn-date">
                    Worn on {new Date(outfit.wornAt).toLocaleDateString()}
                  </p>
                )}

                <div className="saved-outfit-clothes">
                  <h3>Clothing pieces</h3>

                  {clothingNames.length > 0 ? (
                    <ul>
                      {clothingNames.map((name, index) => (
                        <li key={`${name}-${index}`}>
                          {name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>
                      {outfit.clothingItemIds
                        ? "Names are unavailable for this saved outfit."
                        : "No clothing details saved."}
                    </p>
                  )}
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  className="saved-outfit-worn"
                  onClick={() => handleToggleFavorite(outfit)}
                  disabled={updatingId === outfit.id}
                >
                  <Heart size={16} fill={outfit.favorite ? "currentColor" : "none"} />
                  {updatingId === outfit.id ? "Updating..." : outfit.favorite ? "Remove favorite" : "Add to favorites"}
                </button>
                <button
                  type="button"
                  className="saved-outfit-worn"
                  onClick={() => handleToggleWorn(outfit)}
                  disabled={updatingId === outfit.id}
                >
                  {outfit.wornAt ? <RotateCcw size={16} /> : <Check size={16} />}
                  {updatingId === outfit.id
                    ? "Updating..."
                    : outfit.wornAt ? "Undo worn mark" : "Mark as worn"}
                </button>
                <button
                  type="button"
                  className="saved-outfit-delete"
                  onClick={() => handleDeleteOutfit(outfit.id)}
                >
                  <Trash2 size={16} />
                  Delete Outfit
                </button>
              </article>
            );
          })}
        </div>
        )}
        </>
      )}
    </div>
  );
}

export default SavedOutfits;
