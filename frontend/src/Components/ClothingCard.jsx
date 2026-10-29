import { Heart } from "lucide-react";
import { useState } from "react";

function ClothingCard({ item, onClick, showPrices = false }) {
  const [liked, setLiked] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  function handleLike(e) {
    e.stopPropagation();
    setLiked(!liked);
  }

  function handleDetails(e) {
    e.stopPropagation();
    setShowDetails(!showDetails);
  }

  return (
    <article
      className={`clothing-card ${showDetails ? "show-details" : ""}`}
      onClick={onClick}
    >
      <div className="clothing-image">

        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
          />
        ) : (
          <div className="image-placeholder">
            Clothing
          </div>
        )}

        {/* Like button */}
        <button
          className={`heart-button ${liked ? "liked" : ""}`}
          onClick={handleLike}
          aria-label={
            liked
              ? "Remove from favorites"
              : "Add to favorites"
          }
        >
          <Heart
            size={16}
            fill={liked ? "currentColor" : "none"}
          />
        </button>

      </div>

      <div className="clothing-meta">

        <div>
          <h3>{item.name}</h3>

          <p>
            {item.category}
            <span>·</span>
            {item.color}
          </p>
          {showPrices && item.price != null && item.price !== "" && (
            <small className="clothing-price">₹{item.price}</small>
          )}
        </div>

        {/* Details button */}
        <button
          className="more-dots"
          onClick={handleDetails}
          aria-label="Show clothing details"
        >
          ···
        </button>

      </div>

      {/* Small details section */}
      {showDetails && (
        <div
          className="card-details"
          onClick={(e) => e.stopPropagation()}
        >
          <p>
            <strong>Category:</strong> {item.category}
          </p>

          <p>
            <strong>Color:</strong> {item.color}
          </p>

          {item.brand && (
            <p>
              <strong>Brand:</strong> {item.brand}
            </p>
          )}

          {item.size && (
            <p>
              <strong>Size:</strong> {item.size}
            </p>
          )}
        </div>
      )}

    </article>
  );
}

export default ClothingCard;
