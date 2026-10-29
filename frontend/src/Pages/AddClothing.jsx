import {
  Plus,
  Check,
} from "lucide-react";

import {
  useRef,
  useState,
} from "react";

import Button from "../Components/Button";
import PageHeader from "../Components/Pageheader";
import { estimatePhotoColor } from "../utils/photoColor";
import { CLOTHING_CATEGORIES } from "../utils/clothingTaxonomy";

const COLOR_OPTIONS = [
  "Black", "White", "Gray", "Brown", "Beige", "Cream", "Red",
  "Pink", "Orange", "Yellow", "Green", "Olive", "Blue", "Navy",
  "Purple", "Multicolor",
];

function AddClothing({
  onNavigate,
  onAddClothing,
}) {
  const [saved, setSaved] = useState(false);
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customColor, setCustomColor] = useState(false);
  const [isAnalyzingColor, setIsAnalyzingColor] = useState(false);
  const [colorSuggestion, setColorSuggestion] = useState("");
  const [colorError, setColorError] = useState("");

  const fileInputRef = useRef(null);

  // Clothing form data
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "",
    color: "",
    size: "",
    price: "",
    notes: "",
  });

  // Handle changes in form fields
  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "color") {
      setColorSuggestion("");
      setColorError("");
    }

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  // Handle selected image
  function handleImage(file) {
    if (!file) {
      return;
    }

    // Make sure it is an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be smaller than 10MB.");
      return;
    }

    // Clean up the previous preview URL
    if (image) {
      URL.revokeObjectURL(image);
    }

    // Create a preview and keep the actual file
    const imageUrl = URL.createObjectURL(file);

    setImage(imageUrl);
    setImageFile(file);
    setColorSuggestion("");
    setColorError("");
  }

  async function handleSuggestColor() {
    if (!imageFile || isAnalyzingColor) return;

    setIsAnalyzingColor(true);
    setColorSuggestion("");
    setColorError("");
    try {
      const color = await estimatePhotoColor(imageFile);
      setCustomColor(false);
      setFormData((previousData) => ({ ...previousData, color }));
      setColorSuggestion(`Photo suggests ${color}. Please check it before saving.`);
    } catch (error) {
      setColorError(error.message || "Could not estimate the photo color.");
    } finally {
      setIsAnalyzingColor(false);
    }
  }

  // File picker
  function handleImageChange(e) {
    const file = e.target.files[0];

    handleImage(file);

    // Allow selecting the same file again
    e.target.value = "";
  }

  // Open file picker
  function handleBrowse() {
    fileInputRef.current?.click();
  }

  // Drag started
  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  // Drag left the upload area
  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  // Image dropped
  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];

    handleImage(file);
  }

  // Save clothing
  async function handleSubmit(e) {
    e.preventDefault();

    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await onAddClothing({
        ...formData,
        image,
        imageFile,
      });

      setSaved(true);

      setTimeout(() => {
        onNavigate("wardrobe");
      }, 700);
    } catch (error) {
      console.error("Failed to save clothing:", error);

      alert(
        error.message ||
          "Could not save clothing. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="content form-page">
      <PageHeader
        title="Add to your wardrobe"
        subtitle="Give your clothes a digital home."
      />

      <div className="form-layout">

        {/* Upload */}
        <div
          className={`upload-card ${
            isDragging ? "dragging" : ""
          }`}
          onClick={handleBrowse}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {image ? (
            <>
              <img
                src={image}
                alt="Clothing preview"
                className="upload-preview"
              />

              <button
                className="browse-link"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBrowse();
                }}
                type="button"
              >
                Change image
              </button>
            </>
          ) : (
            <>
              <div className="upload-mark">
                <Plus size={23} />
              </div>

              <h3>Upload a photo</h3>

              <p>
                Drag and drop an image here,
                or browse from your device.
              </p>

              <button
                className="browse-link"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBrowse();
                }}
                type="button"
              >
                Browse files
              </button>

              <small>PNG, JPG up to 10MB</small>
            </>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
        </div>

        {/* Form */}
        <form
          className="clothing-form"
          onSubmit={handleSubmit}
        >
          {/* ABOUT THIS PIECE */}
          <div className="form-section">
            <div className="form-title">
              <span>01</span>
              <h2>About this piece</h2>
            </div>

            <div className="input-grid">
              <label>
                Name

                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Linen button-down"
                  required
                />
              </label>

              <label>
                Brand

                <input
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g. COS"
                />
              </label>

              <label>
                Category

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    Select category
                  </option>

                  {CLOTHING_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>

              <div className="color-field">
                <label htmlFor="clothing-color">Color</label>
                <select
                  id="clothing-color"
                  value={customColor ? "__custom__" : formData.color}
                  onChange={(e) => {
                    const value = e.target.value;
                    const useCustomColor = value === "__custom__";
                    setColorSuggestion("");
                    setColorError("");
                    setCustomColor(useCustomColor);
                    setFormData((previousData) => ({
                      ...previousData,
                      color: useCustomColor ? "" : value,
                    }));
                  }}
                  required={!customColor}
                  aria-label="Choose clothing color"
                >
                  <option value="" disabled>Select color</option>
                  {COLOR_OPTIONS.map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                  <option value="__custom__">Other…</option>
                </select>
                {customColor && (
                  <input
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="Enter a color"
                    aria-label="Enter a custom clothing color"
                    required
                    autoFocus
                  />
                )}
                <button
                  className="color-suggest-button"
                  type="button"
                  onClick={handleSuggestColor}
                  disabled={!imageFile || isAnalyzingColor || isSaving}
                >
                  {isAnalyzingColor ? "Checking photo..." : "Suggest color from photo"}
                </button>
                {colorSuggestion && <small className="color-suggest-note" role="status">{colorSuggestion}</small>}
                {colorError && <small className="color-suggest-error" role="alert">{colorError}</small>}
              </div>
            </div>
          </div>

          {/* MORE DETAILS */}
          <div className="form-section">
            <div className="form-title">
              <span>02</span>
              <h2>More details</h2>
              <em>optional</em>
            </div>

            <div className="input-grid">
              <label>
                Size

                <input
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  placeholder="e.g. M"
                />
              </label>

              <label>
                Price

                <input
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g. 899"
                  type="number"
                  min="0"
                  step="0.01"
                />
              </label>

              <label>
                Pattern
                <input name="pattern" value={formData.pattern || ""} onChange={handleChange} placeholder="e.g. Floral, striped, solid" />
              </label>

              <label>
                Style
                <input name="style" value={formData.style || ""} onChange={handleChange} placeholder="e.g. Casual, minimal, traditional" />
              </label>

              <label>
                Fit
                <input name="fit" value={formData.fit || ""} onChange={handleChange} placeholder="e.g. Relaxed, slim, oversized" />
              </label>

              <label>
                Season
                <input name="season" value={formData.season || ""} onChange={handleChange} placeholder="e.g. Summer, all-season" />
              </label>

              <label>
                Material
                <input name="material" value={formData.material || ""} onChange={handleChange} placeholder="e.g. Cotton, denim, unknown" />
              </label>

              <label>
                Suitable occasions
                <input name="suitableOccasions" value={formData.suitableOccasions || ""} onChange={handleChange} placeholder="e.g. College, casual, work" />
              </label>
            </div>

            <label>
              Notes

              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Anything worth remembering about this piece?"
                rows="3"
              />
            </label>
          </div>

          {/* ACTIONS */}
          <div className="form-actions">
            <Button
              variant="ghost"
              onClick={() => onNavigate("wardrobe")}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isSaving}>
              {saved ? (
                <>
                  <Check size={17} />
                  Saved
                </>
              ) : isSaving ? (
                "Saving..."
              ) : (
                "Save to wardrobe"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddClothing;
