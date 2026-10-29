import { useState } from "react";
import PageHeader from "../Components/Pageheader";
import { readPreferences } from "../utils/preferences";

function Profile({ user, onUpdateProfile, onUpdatePreferences }) {
  const [name, setName] = useState(user?.name || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [preferences, setPreferences] = useState(() => readPreferences(user?.email));
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState("");

  async function savePreferences(nextPreferences) {
    if (savingPreferences) return;
    setSavingPreferences(true);
    setPreferencesMessage("");
    try {
      const updated = await onUpdatePreferences(nextPreferences);
      setPreferences({ style: updated.style, showPrices: updated.showPrices });
      setPreferencesMessage("Preferences saved to your account.");
    } catch (error) {
      setPreferencesMessage(error.message || "Could not save your preferences.");
    } finally {
      setSavingPreferences(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      setMessage("Please enter your name.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await onUpdateProfile(name.trim());
      setEditing(false);
      setMessage("Profile saved.");
    } catch (error) {
      setMessage(error.message || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  const initials = (user?.name || user?.email || "U")
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="content">
      <PageHeader title="Profile & settings" subtitle="Make MyWardrobe feel like yours." />
      <div className="profile-layout">
        <section className="panel profile-card">
          <div className="large-avatar">{initials}</div>
          <h2>{user?.name || "Your profile"}</h2>
          <p>{user?.email || "No account email available"}</p>
        </section>

        <section className="panel settings-card">
          <div className="section-heading">
            <div><h2>Personal details</h2><p>Your account information</p></div>
            {!editing && <button className="text-link" onClick={() => { setName(user?.name || ""); setEditing(true); setMessage(""); }}>Edit</button>}
          </div>

          {editing ? (
            <div className="profile-edit-form">
              <label>Full name<input type="text" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></label>
              <label>Email address<input type="email" value={user?.email || ""} readOnly disabled /></label>
              <p className="profile-help-text">Email is your sign-in address and cannot be changed here.</p>
              <div className="profile-edit-actions">
                <button className="profile-cancel-button" onClick={() => { setEditing(false); setName(user?.name || ""); }}>Cancel</button>
                <button className="profile-save-button" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
              </div>
            </div>
          ) : (
            <>
              <div className="setting-row"><span>Full name</span><strong>{user?.name || "—"}</strong></div>
              <div className="setting-row"><span>Email address</span><strong>{user?.email || "—"}</strong></div>
            </>
          )}
          {message && <p className="profile-status" role="status">{message}</p>}

          <div className="section-heading settings-heading">
            <div><h2>Preferences</h2><p>Saved to your account</p></div>
          </div>
          <label className="setting-row profile-style-row">
            <span>Preferred style</span>
            <select value={preferences.style} disabled={savingPreferences} onChange={(event) => savePreferences({ ...preferences, style: event.target.value })}>
              {["Minimal", "Casual", "Classic", "Trendy", "Elegant", "Traditional", "Sporty", "Comfortable"].map((style) => <option key={style}>{style}</option>)}
            </select>
          </label>
          <button type="button" className="toggle-row" aria-pressed={preferences.showPrices} disabled={savingPreferences} onClick={() => savePreferences({ ...preferences, showPrices: !preferences.showPrices })}>
            <span><strong>Show prices</strong><small>Display item prices in your wardrobe</small></span>
            <span className={`toggle ${preferences.showPrices ? "on" : ""}`}><i /></span>
          </button>
          {preferencesMessage && <p className="profile-status" role="status">{preferencesMessage}</p>}
        </section>
      </div>
    </div>
  );
}

export default Profile;
