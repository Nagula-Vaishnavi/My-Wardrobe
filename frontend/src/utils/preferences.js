const DEFAULT_PREFERENCES = {
  style: "Casual",
  showPrices: false,
};

export function getPreferenceStorageKey(email) {
  return `mywardrobe.preferences.${email || "guest"}`;
}

export function readPreferences(email) {
  try {
    const stored = JSON.parse(localStorage.getItem(getPreferenceStorageKey(email)) || "{}");
    const styles = ["Minimal", "Casual", "Classic", "Trendy", "Elegant", "Traditional", "Sporty", "Comfortable"];
    return {
      style: styles.includes(stored.style) ? stored.style : DEFAULT_PREFERENCES.style,
      showPrices: stored.showPrices === true,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function hasStoredPreferences(email) {
  try {
    return localStorage.getItem(getPreferenceStorageKey(email)) !== null;
  } catch {
    return false;
  }
}

export function writePreferences(email, preferences) {
  try {
    localStorage.setItem(getPreferenceStorageKey(email), JSON.stringify({
      style: preferences.style,
      showPrices: preferences.showPrices === true,
    }));
  } catch {
    // MySQL remains the source of truth if browser storage is unavailable.
  }
}
