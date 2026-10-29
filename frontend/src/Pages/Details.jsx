
import { useState } from "react";
import {
  ArrowLeft,
  Heart,
  Trash2,
  Check,
} from "lucide-react";

import Button from "../Components/Button";
import { CLOTHING_CATEGORIES } from "../utils/clothingTaxonomy";

function Details({
  onNavigate,
  item,
  onUpdateClothing,
  onDeleteClothing,
}) {
  const [favorite, setFavorite] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [editData, setEditData] = useState({
    name: item?.name || "",
    brand: item?.brand || "",
    category: item?.category || "",
    color: item?.color || "",
    size: item?.size || "",
    price: item?.price ?? "",
    notes: item?.notes || "",
    pattern: item?.pattern || "",
    style: item?.style || "",
    fit: item?.fit || "",
    season: item?.season || "",
    material: item?.material || "",
    suitableOccasions: item?.suitableOccasions || "",
  });

  if (!item) {
    return (
      <div className="content">
        <button
          className="back-link"
          onClick={() => onNavigate("wardrobe")}
        >
          <ArrowLeft size={14} />
          Back to wardrobe
        </button>

        <div className="empty-state">
          <h2>Clothing item not found</h2>
          <p>Please select an item from your wardrobe.</p>
        </div>
      </div>
    );
  }

  function handleEdit() {
    setEditData({
      name: item.name || "",
      brand: item.brand || "",
      category: item.category || "",
      color: item.color || "",
      size: item.size || "",
      price: item.price ?? "",
      notes: item.notes || "",
      pattern: item.pattern || "",
      style: item.style || "",
      fit: item.fit || "",
      season: item.season || "",
      material: item.material || "",
      suitableOccasions: item.suitableOccasions || "",
    });

    setSaveSuccess(false);
    setEditing(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setEditData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSave() {
    if (saving) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      const updatedClothing = {
        ...item,
        ...editData,
        size: editData.size,
        price:
          editData.price === "" || editData.price == null
            ? null
            : Number(editData.price),
      };

      const updated = await onUpdateClothing(updatedClothing);

      if (updated) {
        setEditing(false);
        setSaveSuccess(true);

        window.setTimeout(() => {
          setSaveSuccess(false);
        }, 2500);
      }
    } catch (error) {
      console.error("Error saving clothing:", error);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditData({
      name: item.name || "",
      brand: item.brand || "",
      category: item.category || "",
      color: item.color || "",
      size: item.size || "",
      price: item.price ?? "",
      notes: item.notes || "",
      pattern: item.pattern || "",
      style: item.style || "",
      fit: item.fit || "",
      season: item.season || "",
      material: item.material || "",
      suitableOccasions: item.suitableOccasions || "",
    });

    setEditing(false);
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to remove this item from your wardrobe?"
    );

    if (!confirmed) return;

    const deleted = await onDeleteClothing(item.id);

    if (deleted) {
      onNavigate("wardrobe");
    }
  }

  function handleFavorite() {
    setFavorite((previous) => !previous);
  }

  return (
    <div className="content">
      <button
        className="back-link"
        onClick={() => onNavigate("wardrobe")}
      >
        <ArrowLeft size={14} />
        Back to wardrobe
      </button>

      <div className="details-layout">
        <div className="details-image">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="details-image-preview"
            />
          ) : (
            <span>Clothing image</span>
          )}
        </div>

        <div className="details-copy">
          {!editing ? (
            <>
              <span className="eyebrow">
                {item.category}
                {" · "}
                {item.color}
              </span>

              <h1>{item.name}</h1>

              {item.brand && (
                <p className="detail-brand">{item.brand}</p>
              )}

              <div className="detail-divider" />

              <div className="detail-list">
                <div>
                  <span>Color</span>
                  <strong>{item.color || "Not specified"}</strong>
                </div>

                {item.pattern && <div><span>Pattern</span><strong>{item.pattern}</strong></div>}
                {item.style && <div><span>Style</span><strong>{item.style}</strong></div>}
                {item.fit && <div><span>Fit</span><strong>{item.fit}</strong></div>}
                {item.season && <div><span>Season</span><strong>{item.season}</strong></div>}
                {item.material && <div><span>Material</span><strong>{item.material}</strong></div>}
                {item.suitableOccasions && <div><span>Occasions</span><strong>{item.suitableOccasions}</strong></div>}

                <div>
                  <span>Size</span>
                  <strong>{item.size || "Not specified"}</strong>
                </div>

                {item.price != null && item.price !== "" && (
                  <div>
                    <span>Price</span>
                    <strong>₹{item.price}</strong>
                  </div>
                )}

                <div>
                  <span>Added</span>
                  <strong>
                    {item.addedDate
                      ? new Date(item.addedDate).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )
                      : "Recently"}
                  </strong>
                </div>
              </div>

              {item.notes && (
                <p className="detail-note">{item.notes}</p>
              )}

              <div className="detail-actions">
                <Button onClick={handleEdit}>
                  Edit piece
                </Button>

                <Button
                  variant="outline"
                  onClick={handleFavorite}
                >
                  <Heart
                    size={16}
                    fill={favorite ? "currentColor" : "none"}
                  />
                  {favorite
                    ? "Remove from favorites"
                    : "Add to favorites"}
                </Button>
              </div>

              <button
                className="delete-link"
                onClick={handleDelete}
              >
                <Trash2 size={14} />
                Remove from wardrobe
              </button>
            </>
          ) : (
            <div className="details-edit-form">
              <h2>Edit piece</h2>

              <label>
                Name
                <input
                  name="name"
                  value={editData.name}
                  onChange={handleChange}
                />
              </label>

              <label>
                Brand
                <input
                  name="brand"
                  value={editData.brand}
                  onChange={handleChange}
                />
              </label>

              <label>
                Category
                <select
                  name="category"
                  value={editData.category}
                  onChange={handleChange}
                >
                  {editData.category && !CLOTHING_CATEGORIES.includes(editData.category) && (
                    <option value={editData.category}>{editData.category}</option>
                  )}
                  {CLOTHING_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label>
                Color
                <input
                  name="color"
                  value={editData.color}
                  onChange={handleChange}
                />
              </label>

              <label>Pattern<input name="pattern" value={editData.pattern} onChange={handleChange} /></label>
              <label>Style<input name="style" value={editData.style} onChange={handleChange} /></label>
              <label>Fit<input name="fit" value={editData.fit} onChange={handleChange} /></label>
              <label>Season<input name="season" value={editData.season} onChange={handleChange} /></label>
              <label>Material<input name="material" value={editData.material} onChange={handleChange} /></label>
              <label>Suitable occasions<input name="suitableOccasions" value={editData.suitableOccasions} onChange={handleChange} /></label>

              <label>
                Size
                <input
                  name="size"
                  value={editData.size}
                  onChange={handleChange}
                  placeholder="Enter size"
                />
              </label>

              <label>
                Price
                <input
                  name="price"
                  type="number"
                  min="0"
                  value={editData.price}
                  onChange={handleChange}
                />
              </label>

              <label>
                Notes
                <textarea
                  name="notes"
                  value={editData.notes}
                  onChange={handleChange}
                  rows={3}
                />
              </label>

              <div className="details-edit-actions">
                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="profile-save-button"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    "Saving..."
                  ) : (
                    "Save changes"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="save-success" role="status">
          <Check size={18} strokeWidth={2.5} />
          <span>Saved successfully!</span>
        </div>
      )}
    </div>
  );
}

export default Details;
