import { Plus, Search, Tag, Shirt, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import Button from "../Components/Button";
import PageHeader from "../Components/Pageheader";
import ClothingCard from "../Components/ClothingCard";
import { readPreferences } from "../utils/preferences";
import { CLOTHING_CATEGORIES } from "../utils/clothingTaxonomy";

function Wardrobe({
  onNavigate,
  clothes = [],
  onSelectClothing,
  user,
}) {
  const showPrices = readPreferences(user?.email).showPrices;
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const [selectedColor, setSelectedColor] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedSize, setSelectedSize] = useState("All");

  const [sortBy, setSortBy] = useState("recent");

  // Wardrobe categories
  const categories = ["All", ...CLOTHING_CATEGORIES];

  // Normalize text to handle extra spaces and capitalization
  function normalize(value) {
    return String(value ?? "").trim().toLowerCase();
  }

  // Get unique, non-empty filter values from saved clothing
  const colors = useMemo(() => {
    return [
      ...new Set(
        clothes
          .map((item) => String(item.color ?? "").trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [clothes]);

  const brands = useMemo(() => {
    return [
      ...new Set(
        clothes
          .map((item) => String(item.brand ?? "").trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [clothes]);

  const sizes = useMemo(() => {
    return [
      ...new Set(
        clothes
          .map((item) => String(item.size ?? "").trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b, undefined, {
      numeric: true,
    }));
  }, [clothes]);

  // Filter and sort clothing
  const filtered = useMemo(() => {
    const searchText = normalize(query);

    const result = clothes.filter((item) => {

const itemCategory = normalize(item.category);

const categoryAliases = {
  shirts: ["shirt", "shirts"],
  "t-shirts": ["t-shirt", "t-shirts", "tshirt", "tshirts"],
  tops: ["top", "tops"],
  bottoms: ["bottom", "bottoms", "pants", "trousers", "jeans", "palazzo", "palazzos"],
  palazzos: ["palazzo", "palazzos"],
  dresses: ["dress", "dresses"],
  kurtis: ["kurti", "kurtis", "kurta", "kurtas"],
  sarees: ["saree", "sarees", "sari", "saris"],
  blouses: ["blouse", "blouses"],
  shoes: ["shoe", "shoes", "footwear"],
  bags: ["bag", "bags", "handbag", "handbags", "purse"],
  accessories: ["accessory", "accessories"],
};

const categoryMatch =
  active === "All" ||
  (categoryAliases[normalize(active)] || [normalize(active)])
    .includes(itemCategory);


      // Search by name, brand, category, and color
      const searchableText = [
        item.name,
        item.brand,
        item.category,
        item.color,
        item.size,
        item.notes,
      ]
        .map(normalize)
        .join(" ");

      const searchMatch = searchableText.includes(searchText);

      const colorMatch =
        selectedColor === "All" ||
        normalize(item.color) === normalize(selectedColor);

      const brandMatch =
        selectedBrand === "All" ||
        normalize(item.brand) === normalize(selectedBrand);

      const sizeMatch =
        selectedSize === "All" ||
        normalize(item.size) === normalize(selectedSize);

      return (
        categoryMatch &&
        searchMatch &&
        colorMatch &&
        brandMatch &&
        sizeMatch
      );
    });

    // Sort a copy so the original clothes array is not mutated
    const sorted = [...result];

    if (sortBy === "recent") {
      sorted.sort((a, b) => {
        const dateA = new Date(a.addedDate || 0).getTime() || 0;
        const dateB = new Date(b.addedDate || 0).getTime() || 0;
        return dateB - dateA;
      });
    }

    if (sortBy === "oldest") {
      sorted.sort((a, b) => {
        const dateA = new Date(a.addedDate || 0).getTime() || 0;
        const dateB = new Date(b.addedDate || 0).getTime() || 0;
        return dateA - dateB;
      });
    }

    if (sortBy === "nameAsc") {
      sorted.sort((a, b) =>
        String(a.name ?? "").localeCompare(
          String(b.name ?? "")
        )
      );
    }

    if (sortBy === "nameDesc") {
      sorted.sort((a, b) =>
        String(b.name ?? "").localeCompare(
          String(a.name ?? "")
        )
      );
    }

    return sorted;
  }, [
    clothes,
    active,
    query,
    selectedColor,
    selectedBrand,
    selectedSize,
    sortBy,
  ]);

  // Count active dropdown filters
  const activeFilterCount = [
    selectedColor,
    selectedBrand,
    selectedSize,
  ].filter((filter) => filter !== "All").length;

  // Reset search, category, and filters
  function clearFilters() {
    setQuery("");
    setActive("All");
    setSelectedColor("All");
    setSelectedBrand("All");
    setSelectedSize("All");
  }

  return (
    <div className="content">
      <PageHeader
        title="My wardrobe"
        subtitle="Everything you own, organized in one place."
        action={
          <Button onClick={() => onNavigate("add")}>
            <Plus size={17} />
            Add clothing
          </Button>
        }
      />

      {/* TOOLBAR */}
      <div className="wardrobe-toolbar">
        {/* Search */}
        <div className="search-field">
          <Search size={17} />

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your wardrobe"
            aria-label="Search your wardrobe"
          />
        </div>

        {/* Categories */}
        <div className="category-tabs">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActive(category)}
              className={active === category ? "selected" : ""}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Filters toggle */}
        <button
          type="button"
          className="filter-button"
          onClick={() => setShowFilters((previous) => !previous)}
          aria-expanded={showFilters}
        >
          <Tag size={15} />
          Filters

          {activeFilterCount > 0 && (
            <span>{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* FILTER PANEL */}
      {showFilters && (
        <div className="filter-panel">
          {/* Color filter */}
          <div className="filter-group">
            <label htmlFor="wardrobe-color">Color</label>

            <select
              id="wardrobe-color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
            >
              <option value="All">All colors</option>

              {colors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>

          {/* Brand filter */}
          <div className="filter-group">
            <label htmlFor="wardrobe-brand">Brand</label>

            <select
              id="wardrobe-brand"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="All">All brands</option>

              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {/* Size filter */}
          <div className="filter-group">
            <label htmlFor="wardrobe-size">Size</label>

            <select
              id="wardrobe-size"
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
            >
              <option value="All">All sizes</option>

              {sizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          {/* Clear filters */}
          <button
            type="button"
            className="clear-filter"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* WARDROBE COUNT AND SORTING */}
      <div className="wardrobe-meta">
        <span>
          {filtered.length}{" "}
          {filtered.length === 1 ? "piece" : "pieces"}
        </span>

        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort clothing"
        >
          <option value="recent">Recently added</option>
          <option value="oldest">Oldest added</option>
          <option value="nameAsc">Name A–Z</option>
          <option value="nameDesc">Name Z–A</option>
        </select>
      </div>

      {/* CLOTHING GRID */}
      <div className="clothing-grid">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <ClothingCard
              key={item.id}
              item={item}
              showPrices={showPrices}
              onClick={() => onSelectClothing(item)}
            />
          ))
        ) : (

<div className="empty-state">
  <div className="empty-state-icon">
    <Shirt size={32} strokeWidth={1.5} />
  </div>

  <h3>No clothing found</h3>

  <p>
    Try changing your search or filters, or add a new
    clothing piece to your wardrobe.
  </p>

  <div className="empty-state-actions">
    <Button onClick={() => onNavigate("add")}>
      <Plus size={17} />
      Add clothing
    </Button>

    {(query ||
      active !== "All" ||
      activeFilterCount > 0) && (
      <button
        type="button"
        className="empty-clear-button"
        onClick={clearFilters}
      >
        <RotateCcw size={15} />
        Clear filters
      </button>
    )}
  </div>
</div>

        )}
      </div>
    </div>
  );
}

export default Wardrobe;
