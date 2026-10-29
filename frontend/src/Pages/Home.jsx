import {
  ArrowRight,
  Sparkles,
  Plus,
} from "lucide-react";

import Button from "../Components/Button";
import PageHeader from "../Components/Pageheader";
import ClothingCard from "../Components/ClothingCard";
import { readPreferences } from "../utils/preferences";

function Home({ onNavigate, clothes = [], user, onSelectClothing }) {
  const showPrices = readPreferences(user?.email).showPrices;
  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const hour = today.getHours();

  let greeting = "Good morning";

  if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon";
  } else if (hour >= 17) {
    greeting = "Good evening";
  }

  // Get the logged-in user's name
  const username = user?.name?.trim()
    ? user.name.trim().split(" ")[0]
    : user?.email?.split("@")[0] || "there";

  // Use real clothing data from App.jsx
  const totalItems = clothes.length;

  // Normalize categories to handle capitalization and spaces
  const normalizeCategory = (category) =>
    (category || "").trim().toLowerCase();

  const countCategory = (...categories) =>
    clothes.filter((item) =>
      categories.includes(normalizeCategory(item.category))
    ).length;

  const topsCount = countCategory(
    "tops",
    "shirts",
    "t-shirts",
    "t shirt",
    "t-shirts",
    "blouses",
    "kurtis",
    "kurti"
  );

  const bottomsCount = countCategory(
    "bottoms",
    "pants",
    "trousers",
    "jeans",
    "palazzos",
    "palazzo",
    "leggings",
    "skirts",
    "shorts"
  );

  const shoesCount = countCategory("shoes", "footwear");

  // Find the four most recently added items.
  // createdAt is preferred; IDs are the fallback.
  const recentClothes = [...clothes]
    .sort((a, b) => {
      const dateA = a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;

      const dateB = b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;

      if (dateA !== dateB) {
        return dateB - dateA;
      }

      return Number(b.id || 0) - Number(a.id || 0);
    })
    .slice(0, 4);

  const todayOutfit = {
    title: "Choose a look for today",
    description:
      totalItems > 0
        ? `Generate an outfit from the ${totalItems} ${
            totalItems === 1 ? "piece" : "pieces"
          } you already own.`
        : "Add your first clothing item, then get outfit ideas made from your wardrobe.",
  };

  return (
    <div className="content">

      {/* PAGE HEADER */}

      <PageHeader
        eyebrow={formattedDate}
        title={`${greeting}, ${username}`}
        subtitle="Let's find something great to wear today."
        action={
          <Button
            onClick={() => onNavigate("outfits")}
          >
            <Sparkles size={17} />
            What should I wear?
          </Button>
        }
      />

      {/* STATS */}

      <div className="stats-grid">

        <div className="stat-card">
          <span>Total items</span>
          <strong>{totalItems}</strong>

          <small>
            In your wardrobe
          </small>
        </div>

        <div className="stat-card">
          <span>Tops</span>
          <strong>{topsCount}</strong>
          <small>In your wardrobe</small>
        </div>

        <div className="stat-card">
          <span>Bottoms</span>
          <strong>{bottomsCount}</strong>
          <small>In your wardrobe</small>
        </div>

        <div className="stat-card">
          <span>Shoes</span>
          <strong>{shoesCount}</strong>
          <small>In your wardrobe</small>
        </div>

      </div>

      {/* RECENTLY ADDED */}

      <section className="section">

        <div className="section-heading">

          <div>
            <h2>Recently added</h2>

            <p>
              The latest pieces in your wardrobe
            </p>
          </div>

          <button
            className="text-link"
            onClick={() => onNavigate("wardrobe")}
          >
            View all
            <ArrowRight size={15} />
          </button>

        </div>

        {recentClothes.length > 0 ? (
          <div className="clothing-grid">

            {recentClothes.map((item) => (
              <ClothingCard
                key={item.id}
                item={item}
                showPrices={showPrices}
                onClick={() => onSelectClothing?.(item)}
              />
            ))}

          </div>
        ) : (
          <div className="empty-wardrobe">
            <h3>Your wardrobe is waiting</h3>

            <p>
              Add your first clothing item to see it here.
            </p>

            <Button
              onClick={() => onNavigate("add")}
            >
              <Plus size={17} />
              Add your first item
            </Button>
          </div>
        )}

      </section>

      {/* LOWER DASHBOARD */}

      <div className="dashboard-lower">

        {/* TODAY'S OUTFIT */}

        <section className="panel today-panel">

          <div className="section-heading">

            <div>
              <h2>Today's outfit</h2>

              <p>Build a look from the clothes you already own</p>
            </div>

          </div>

          <div className="today-content">

            <div className="today-photo">
              Your wardrobe
            </div>

            <div className="today-copy">

              <span className="eyebrow">
                AI stylist
              </span>

              <h3>{todayOutfit.title}</h3>

              <p>{todayOutfit.description}</p>

              <button
                className="text-link"
                onClick={() => onNavigate("outfits")}
              >
                Choose an outfit
                <ArrowRight size={15} />
              </button>

            </div>

          </div>

        </section>

        {/* QUICK ACTIONS */}

        <section className="panel actions-panel">

          <div className="section-heading">

            <div>
              <h2>Quick actions</h2>

              <p>
                Make your wardrobe work harder
              </p>
            </div>

          </div>

          <button
            className="action-row"
            onClick={() => onNavigate("add")}
          >

            <span className="action-icon">
              <Plus size={18} />
            </span>

            <span>
              <strong>Add a new piece</strong>

              <small>
                Give clothes a digital home
              </small>
            </span>

            <ArrowRight size={16} />

          </button>

          <button
            className="action-row"
            onClick={() => onNavigate("outfits")}
          >

            <span className="action-icon accent">
              <Sparkles size={18} />
            </span>

            <span>
              <strong>Find an outfit</strong>

              <small>
                For wherever today takes you
              </small>
            </span>

            <ArrowRight size={16} />

          </button>

        </section>

      </div>

    </div>
  );
}

export default Home;
