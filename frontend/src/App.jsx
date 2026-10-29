import { useEffect, useState } from "react";
import "./App.css";

import Sidebar from "./Components/Sidebar";
import Topbar from "./Components/Topbar";

import Home from "./Pages/Home";
import Wardrobe from "./Pages/Wardrobe";
import AddClothing from "./Pages/AddClothing";
import Outfits from "./Pages/Outfits";
import Profile from "./Pages/Profile";
import Details from "./Pages/Details";
import SavedOutfits from "./Pages/SavedOutfits";

import Login from "./Pages/Login";
import Register from "./Pages/Register";
import { apiRequest, apiUrl } from "./utils/api";
import { hasStoredPreferences, readPreferences, writePreferences } from "./utils/preferences";

function App() {
  const [page, setPage] = useState(() =>
    sessionStorage.getItem("token") ? "restoring-session" : "login"
  );
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const [restoreError, setRestoreError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedClothing, setSelectedClothing] = useState(null);
  const [clothes, setClothes] = useState([]);

  async function syncPreferences(email) {
    const remotePreferences = await apiRequest("/auth/preferences");
    if (!remotePreferences.configured && hasStoredPreferences(email)) {
      const savedPreferences = await apiRequest("/auth/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(readPreferences(email)),
      });
      writePreferences(email, savedPreferences);
      return savedPreferences;
    }
    writePreferences(email, remotePreferences);
    return remotePreferences;
  }

  // Expired tokens immediately return the app to sign-in instead of leaving
  // the user inside pages that can no longer load protected data.
  useEffect(() => {
    function handleExpiredSession() {
      sessionStorage.removeItem("token");
      setCurrentUser(null);
      setClothes([]);
      setSelectedClothing(null);
      setPage("login");
    }
    window.addEventListener("mywardrobe:session-expired", handleExpiredSession);
    return () => window.removeEventListener("mywardrobe:session-expired", handleExpiredSession);
  }, []);

  // Restore the signed-in account and wardrobe when the page is refreshed.
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return undefined;

    let active = true;

    async function restoreSession() {
      try {
        const user = await apiRequest("/auth/me");
        if (!active || sessionStorage.getItem("token") !== token) return;

        const data = await apiRequest("/clothes");
        try {
          await syncPreferences(user.email);
        } catch (preferencesError) {
          console.warn("Could not load account preferences:", preferencesError);
        }
        const formattedClothes = data.map((item) => ({
            ...item,
            color: item.color || "",
            size: item.size || "",
            notes: item.notes || "",
            pattern: item.pattern || "",
            style: item.style || "",
            fit: item.fit || "",
            season: item.season || "",
            material: item.material || "",
            suitableOccasions: item.suitableOccasions || "",
            image: item.imageUrl
              ? apiUrl(item.imageUrl)
              : "",
        }));

        if (!active || sessionStorage.getItem("token") !== token) return;
        setCurrentUser(user);
        setClothes(formattedClothes);
        setPage("dashboard");
      } catch (error) {
        if (!active || sessionStorage.getItem("token") !== token) return;
        console.warn("Could not restore sign-in session:", error);
        // A network or server error does not mean the saved token is invalid.
        // Keep it so the user can retry after the backend/database is available.
        setRestoreError(error.message || "Could not connect to the backend.");
        setPage("restore-error");
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, [restoreAttempt]);

  // Load clothing from Spring Boot + MySQL
  async function loadClothes() {
    try {
      const data = await apiRequest("/clothes");

      const formattedClothes = data.map((item) => ({
        ...item,
        color: item.color || "",
        size: item.size || "",
        notes: item.notes || "",
        pattern: item.pattern || "",
        style: item.style || "",
        fit: item.fit || "",
        season: item.season || "",
        material: item.material || "",
        suitableOccasions: item.suitableOccasions || "",
        image: item.imageUrl
          ? apiUrl(item.imageUrl)
          : "",
      }));

      setClothes(formattedClothes);

      return formattedClothes;
    } catch (error) {
      console.error("Loading wardrobe failed:", error);
      setClothes([]);

      alert(
        "Could not load your wardrobe. Check the backend and try logging in again."
      );

      return null;
    }
  }

  // Handle successful login
  async function handleLogin(credentials) {
    if (!credentials?.token || !credentials?.email) {
      alert("Login succeeded, but the user or token information is missing.");
      return;
    }

    sessionStorage.setItem("token", credentials.token);

    try {
      const user = await apiRequest("/auth/me");
      setCurrentUser(user);
      try {
        await syncPreferences(user.email);
      } catch (preferencesError) {
        console.warn("Could not load account preferences:", preferencesError);
      }
    } catch (error) {
      console.error("Loading profile failed:", error);
      sessionStorage.removeItem("token");
      alert("Could not load your account profile. Please try signing in again.");
      return;
    }

    await loadClothes();

    setPage("dashboard");
  }

  async function updateProfile(name) {
    const token = sessionStorage.getItem("token");
    if (!token) throw new Error("Please log in again.");

    const updatedUser = await apiRequest("/auth/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });
    setCurrentUser(updatedUser);
    return updatedUser;
  }

  async function updatePreferences(preferences) {
    const updated = await apiRequest("/auth/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    });
    writePreferences(currentUser?.email, updated);
    return updated;
  }

  // Logout
  function handleLogout() {
    sessionStorage.removeItem("token");
    setCurrentUser(null);
    setClothes([]);
    setSelectedClothing(null);
    setMenuOpen(false);
    setPage("login");
  }

  function retryRestoreSession() {
    setRestoreError("");
    setPage("restoring-session");
    setRestoreAttempt((attempt) => attempt + 1);
  }

  function handleSelectClothing(item) {
    if (!item?.id) {
      console.error("Cannot open clothing details: item has no ID.", item);
      return;
    }
    setSelectedClothing(item);
    setPage("details");
  }

  // Create an account through Spring Boot.
  async function handleRegister(userDetails) {
    return apiRequest("/auth/register", {
      auth: false,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: userDetails.name.trim(),
        email: userDetails.email.trim(),
        password: userDetails.password,
      }),
    });
  }

  // Add clothing to the database
  async function addClothing(newClothing) {
    const token = sessionStorage.getItem("token");

    if (!token) {
      throw new Error("Please log in again.");
    }

    // 1. Save clothing details
    const clothingData = {
      name: newClothing.name,
      brand: newClothing.brand,
      category: newClothing.category,
      size: newClothing.size || "",
      color: newClothing.color || "",
      price:
        newClothing.price !== "" && newClothing.price != null
          ? Number(newClothing.price)
          : null,
      notes: newClothing.notes || "",
      pattern: newClothing.pattern || "",
      style: newClothing.style || "",
      fit: newClothing.fit || "",
      season: newClothing.season || "",
      material: newClothing.material || "",
      suitableOccasions: newClothing.suitableOccasions || "",
    };

    const savedClothing = await apiRequest("/clothes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(clothingData),
    });

    // 2. Upload the image if one was selected
    if (newClothing.imageFile) {
      const imageData = new FormData();
      imageData.append("image", newClothing.imageFile);

      try {
        await apiRequest(`/upload/${savedClothing.id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: imageData,
        });
      } catch (error) {
        throw new Error(
          `Clothing details were saved, but the image was not uploaded: ${error.message}`,
          { cause: error }
        );
      }
    }

    // 3. Reload the latest items
    await loadClothes();
  }

  // Update clothing in the database
  async function updateClothing(updatedClothing) {
    const token = sessionStorage.getItem("token");

    if (!token) {
      alert("Please log in again.");
      return false;
    }

    try {
      const payload = {
        name: updatedClothing.name,
        brand: updatedClothing.brand,
        category: updatedClothing.category,
        color: updatedClothing.color || "",
        size: updatedClothing.size || "",
        price:
          updatedClothing.price !== "" && updatedClothing.price != null
            ? Number(updatedClothing.price)
            : null,
        notes: updatedClothing.notes || "",
        pattern: updatedClothing.pattern || "",
        style: updatedClothing.style || "",
        fit: updatedClothing.fit || "",
        season: updatedClothing.season || "",
        material: updatedClothing.material || "",
        suitableOccasions: updatedClothing.suitableOccasions || "",
      };

      await apiRequest(`/clothes/${updatedClothing.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
      });

      // Reload the actual saved values
      const refreshedClothes = await loadClothes();

      if (!refreshedClothes) {
        return false;
      }

      const savedItem = refreshedClothes.find(
        (clothing) =>
          String(clothing.id) === String(updatedClothing.id)
      );

      if (!savedItem) {
        throw new Error(
          "Updated clothing item was not found after reloading."
        );
      }

      setSelectedClothing(savedItem);

      return true;
    } catch (error) {
      console.error("Error updating clothing:", error);
      alert(error.message || "Could not update this item. Please try again.");
      return false;
    }
  }

  // Delete clothing from the database
  async function deleteClothing(clothingId) {
    const token = sessionStorage.getItem("token");

    if (!token) {
      alert("Please log in again.");
      return false;
    }

    try {
      await apiRequest(`/clothes/${clothingId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
      });

      await loadClothes();
      setSelectedClothing(null);
      setPage("wardrobe");

      return true;
    } catch (error) {
      console.error("Error deleting clothing:", error);
      alert(error.message || "Could not delete this item. Please try again.");
      return false;
    }
  }

  // Login page
  if (page === "restoring-session") {
    return (
      <div className="session-loading" role="status" aria-live="polite">
        Loading your wardrobe…
      </div>
    );
  }

  if (page === "restore-error") {
    return (
      <div className="session-loading">
        <div className="session-error-card" role="alert">
          <h1>We couldn’t load your wardrobe</h1>
          <p>{restoreError}</p>
          <p>Your sign-in is saved. Check that Spring Boot and MySQL are running, then retry.</p>
          <div className="session-error-actions">
            <button type="button" onClick={retryRestoreSession}>Retry</button>
            <button type="button" className="session-signout" onClick={handleLogout}>Sign in again</button>
          </div>
        </div>
      </div>
    );
  }

  if (page === "login") {
    return (
      <Login
        onLogin={handleLogin}
        onNavigate={setPage}
      />
    );
  }

  // Registration page
  if (page === "register") {
    return (
      <Register
        onRegister={handleRegister}
        onNavigate={setPage}
      />
    );
  }

  // Render the selected page
  function renderPage() {
    if (page === "dashboard") {
      return (
        <Home
          onNavigate={setPage}
          clothes={clothes}
          user={currentUser}
          onSelectClothing={handleSelectClothing}
        />
      );
    }

    if (page === "wardrobe") {
      return (
        <Wardrobe
          onNavigate={setPage}
          clothes={clothes}
          user={currentUser}
          onSelectClothing={handleSelectClothing}
        />
      );
    }

    if (page === "add") {
      return (
        <AddClothing
          onNavigate={setPage}
          onAddClothing={addClothing}
        />
      );
    }

    if (page === "outfits") {
      return <Outfits clothes={clothes} user={currentUser} />;
    }

    if (page === "saved-outfits") {
      return <SavedOutfits />;
    }

    if (page === "profile") {
      return <Profile key={currentUser?.email} user={currentUser} onUpdateProfile={updateProfile} onUpdatePreferences={updatePreferences} />;
    }

    if (page === "details") {
      return (
        <Details
          onNavigate={setPage}
          item={selectedClothing}
          onUpdateClothing={updateClothing}
          onDeleteClothing={deleteClothing}
        />
      );
    }

    return (
      <Home
        onNavigate={setPage}
        clothes={clothes}
        user={currentUser}
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        active={page}
        onNavigate={setPage}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        user={currentUser}
        onLogout={handleLogout}
      />

      <div className="app-main">
        <Topbar
          onMenu={() => setMenuOpen(true)}
          onNavigate={setPage}
          user={currentUser}
        />

        {renderPage()}
      </div>

      {menuOpen && (
        <button
          className="mobile-overlay"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation menu"
        />
      )}
    </div>
  );
}

export default App;
