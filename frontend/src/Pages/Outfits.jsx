
import {
  Sparkles,
  Heart,
  Star,
  ArrowRight,
  Check,
} from "lucide-react";

import { useEffect, useState } from "react";

import Button from "../Components/Button";
import PageHeader from "../Components/Pageheader";
import { apiRequest } from "../utils/api";
import { readPreferences } from "../utils/preferences";
import { getGarmentType } from "../utils/clothingTaxonomy";

// Convert clothing color names into CSS colors
function colorToCss(value) {
  const color = (value || "").toLowerCase().trim();

  const colorMap = {
    white: "#f8f8f5",
    black: "#353238",
    blue: "#9ec5e8",
    "light blue": "#d5eafa",
    "dark blue": "#45658b",
    navy: "#40516f",
    "navy blue": "#40516f",
    red: "#e7a0a0",
    pink: "#f3cddd",
    green: "#b9d8bd",
    "dark green": "#648b70",
    yellow: "#f5e5a4",
    beige: "#e8d8bd",
    brown: "#b99378",
    grey: "#d5d5d8",
    gray: "#d5d5d8",
    purple: "#d0c0ed",
    orange: "#f2c29e",
    cream: "#f5edda",
    maroon: "#9b5365",
  };

  if (colorMap[color]) {
    return colorMap[color];
  }

  if (/^#[0-9a-f]{6}$/i.test(color)) {
    return color;
  }

  return "#eee9f3";
}



 // Normalize clothing color names
function normalizeColor(value) {
  const color = (value || "")
    .toLowerCase()
    .trim()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ");

  const aliases = {
    "navy blue": "navy",
    "dark blue": "blue",
    "light blue": "blue",
    "sky blue": "blue",
    "baby pink": "pink",
    "light pink": "pink",
    "dark green": "green",
    "olive green": "olive",
    "olive": "olive",
    "grey": "gray",
    "off white": "cream",
    "off-white": "cream",
    "tan": "brown",
    "camel": "brown",
    "wine": "maroon",
  };

  return aliases[color] || color;
}

// Identify the broad color family
function getColorFamily(value) {
  const color = normalizeColor(value);

  const families = {
    neutral: [
      "white", "black", "gray", "beige",
      "cream", "brown", "ivory", "taupe",
    ],
    blue: ["blue", "navy", "teal", "turquoise"],
    red: ["red", "pink", "maroon", "burgundy"],
    green: ["green", "olive", "mint"],
    yellow: ["yellow", "mustard", "gold"],
    purple: ["purple", "lavender", "violet"],
    orange: ["orange", "coral", "peach"],
  };

  for (const [family, colors] of Object.entries(families)) {
    if (colors.includes(color)) {
      return family;
    }
  }

  return "unknown";
}

// Score how well two clothing colors coordinate
function scoreColorPair(colorA, colorB) {
  const a = normalizeColor(colorA);
  const b = normalizeColor(colorB);

  const familyA = getColorFamily(a);
  const familyB = getColorFamily(b);

  // Missing or unrecognized colors get a neutral score
  if (
    !a || !b ||
    familyA === "unknown" ||
    familyB === "unknown"
  ) {
    return 2.5;
  }

  // Same color or same color family
  if (a === b) return 3;
  if (familyA === familyB) return 2;

  // Neutrals pair easily with most colors
  if (familyA === "neutral" || familyB === "neutral") {
    return 5;
  }

  // Some contrasting families can work well together
  const goodContrasts = [
    ["blue", "orange"],
    ["red", "green"],
    ["yellow", "purple"],
  ];

  const isGoodContrast = goodContrasts.some(
    ([first, second]) =>
      (familyA === first && familyB === second) ||
      (familyA === second && familyB === first)
  );

  return isGoodContrast ? 4 : 2;
}

function getItemText(item) {
  return [
    item.name, item.category, item.tags, item.notes, item.pattern,
    item.style, item.fit, item.season, item.material, item.suitableOccasions,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getPatternType(item) {
  const text = [item.pattern, item.notes, item.tags]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/\b(solid|plain|no pattern)\b/.test(text)) return "solid";
  if (/floral|striped?|checked|plaid|polka|graphic|geometric|printed|patterned|abstract/.test(text)) {
    return "patterned";
  }
  return "unknown";
}

function scorePatternHarmony(items) {
  const patterns = items
    .filter((item) => ["top", "kurti", "bottom", "dress", "saree", "blouse"].includes(getGarmentType(item)))
    .map(getPatternType);
  const patternedCount = patterns.filter((pattern) => pattern === "patterned").length;
  const solidCount = patterns.filter((pattern) => pattern === "solid").length;

  if (patternedCount > 1) return -2;
  if (patternedCount === 1 && solidCount > 0) return 1;
  return 0;
}

function getOutfitKey(items) {
  return items
    .map((item) => String(item.id ?? `${item.category}:${item.name}`))
    .sort()
    .join("|");
}

function getSuggestionKey(items) {
  // Treat a combination as seen across contexts so changing weather or
  // occasion does not immediately return the same exact pieces.
  return getOutfitKey(items);
}

function getGarmentCombinationKey(items) {
  const clothingPieces = items.filter((item) =>
    !["shoes", "accessory"].includes(getGarmentType(item))
  );
  return getOutfitKey(clothingPieces.length ? clothingPieces : items);
}

function prioritizeGarmentVariety(combinations) {
  const primary = [];
  const footwearVariations = [];
  const seenGarmentCombinations = new Set();

  combinations.forEach((combination) => {
    const key = getGarmentCombinationKey(combination.items);
    if (!seenGarmentCombinations.has(key)) {
      seenGarmentCombinations.add(key);
      primary.push(combination);
    } else {
      footwearVariations.push(combination);
    }
  });

  return [...primary, ...footwearVariations];
}

function readSeenSuggestions(email) {
  if (!email || typeof window === "undefined") return [];
  try {
    const key = `mywardrobe:stylist-seen-v2:${encodeURIComponent(email.toLowerCase())}`;
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

function rememberSuggestion(email, suggestionKey) {
  if (!email || !suggestionKey || typeof window === "undefined") return;
  try {
    const key = `mywardrobe:stylist-seen-v2:${encodeURIComponent(email.toLowerCase())}`;
    const current = readSeenSuggestions(email);
    if (current.includes(suggestionKey)) return;
    window.localStorage.setItem(key, JSON.stringify([...current, suggestionKey].slice(-250)));
  } catch {
    // Suggestions still work for this visit when browser storage is unavailable.
  }
}

function scoreForOccasion(items, occasion) {
  const preferences = {
    Casual: /casual|t-shirt|tee|jeans|sneaker|comfortable|denim/,
    College: /t-shirt|tee|jeans|sneaker|backpack|comfortable|casual|kurti/,
    Office: /formal|shirt|trouser|slack|blazer|workwear|office|loafer|structured/,
    Dinner: /dress|blouse|skirt|heel|elegant|dinner|party|statement/,
    Traditional: /kurti|kurta|saree|ethnic|traditional|palazzo|dupatta|blouse/,
    Travel: /sneaker|jeans|trouser|comfortable|hoodie|jacket|travel|flat|breathable/,
  };
  const preferred = preferences[occasion];
  const unsuitable = {
    Casual: /wedding gown|black tie|tuxedo/,
    College: /black tie|wedding gown|stiletto/,
    Office: /shorts|flip-flops?|slippers?|sportswear|gymwear|sweatpants|partywear/,
    Dinner: /sportswear|gymwear|track suit/,
    Traditional: /sportswear|gymwear|track suit/,
    Travel: /stiletto|high heel|restricting|black tie/,
  }[occasion];

  const aliases = {
    Casual: ["casual", "everyday"],
    College: ["college", "campus", "casual"],
    Office: ["office", "work", "formal"],
    Dinner: ["dinner", "party", "evening"],
    Traditional: ["traditional", "ethnic", "festive"],
    Travel: ["travel", "trip", "vacation"],
  }[occasion] || [occasion.toLowerCase()];

  return items.reduce((score, item) => {
    const text = getItemText({ ...item, suitableOccasions: "" });
    const suitability = String(item.suitableOccasions || "")
      .toLowerCase()
      .split(/[,;|]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    const explicitlySuitable = suitability.length > 0;
    const matchesDeclaredOccasion = suitability.some((entry) =>
      aliases.some((alias) => entry === alias || entry.includes(alias))
    );

    if (unsuitable?.test(text)) return score - 7;
    if (explicitlySuitable && !matchesDeclaredOccasion) return score - 3;
    return score + (matchesDeclaredOccasion ? 5 : preferred?.test(text) ? 2 : 0);
  }, 0);
}

function scoreForWeather(items, weather) {
  const preferences = {
    Warm: {
      good: /cotton|linen|sleeveless|short sleeve|lightweight|breathable|sandals/,
      avoid: /wool|sweater|hoodie|heavy jacket|coat|boots/,
      seasons: { good: /summer|spring|warm|all.?season/, avoid: /winter|autumn|fall|cold/ },
    },
    Cool: {
      good: /wool|sweater|hoodie|jacket|coat|long sleeve|boots/,
      avoid: /sleeveless|shorts|sandals/,
      seasons: { good: /winter|autumn|fall|cold|all.?season/, avoid: /summer|hot/ },
    },
    Rainy: {
      good: /raincoat|waterproof|water-resistant|rain boot|umbrella|closed.?toe|rubber sole/,
      avoid: /suede|silk|canvas shoe|open.?toe sandal|espadrille/,
      seasons: { good: /rainy|monsoon|all.?season/, avoid: /summer|winter/ },
    },
  };
  const preference = preferences[weather];

  return items.reduce((score, item) => {
    const text = getItemText(item);
    const season = String(item.season || "").toLowerCase();
    let itemScore = 0;
    if (preference.avoid.test(text)) itemScore -= 6;
    else if (preference.good.test(text)) itemScore += 2;
    if (preference.seasons.avoid.test(season)) itemScore -= 3;
    else if (preference.seasons.good.test(season)) itemScore += 3;
    return score + itemScore;
  }, 0);
}

function scoreForStyle(items, style) {
  const styleSignals = {
    Minimal: /minimal|simple|plain|basic|clean|solid/,
    Casual: /casual|t-shirt|tee|jeans|denim|sneaker|comfortable/,
    Classic: /classic|tailored|button-down|trouser|loafer|navy/,
    Trendy: /trendy|oversized|crop|statement|graphic|fashion/,
    Elegant: /elegant|formal|dress|blouse|heel|satin/,
    Traditional: /kurti|kurta|saree|ethnic|traditional|palazzo|dupatta/,
    Sporty: /sport|active|gym|track|sneaker|hoodie/,
    Comfortable: /comfortable|soft|loose|relaxed|cotton|knit|flat|sneaker/,
  };
  const preferred = styleSignals[style];

  return items.reduce((score, item) => {
    if (preferred?.test(getItemText(item))) return score + 2;
    if (
      style === "Minimal" &&
      ["white", "black", "gray", "beige", "cream", "ivory"].includes(
        normalizeColor(item.color)
      )
    ) return score + 1;
    return score;
  }, 0);
}

function scoreForMood(items, mood) {
  const signals = {
    Everyday: /casual|basic|simple|jeans|t-shirt|tee|sneaker|comfortable/,
    Relaxed: /relaxed|soft|loose|cotton|linen|knit|flat|sneaker|comfortable/,
    Confident: /bold|statement|tailored|structured|blazer|red|black|heel/,
    Polished: /classic|tailored|formal|elegant|clean|blazer|trouser|loafer|navy/,
    Playful: /bright|colorful|multicolor|floral|graphic|printed|pink|yellow|orange/,
  };
  const preferred = signals[mood];
  return items.reduce((score, item) => {
    const text = `${getItemText(item)} ${item.color || ""}`;
    return score + (preferred?.test(text) ? 2 : 0);
  }, 0);
}

function scoreForComfort(items, prioritizeComfort) {
  if (!prioritizeComfort) return 0;
  const comfortable = /cotton|linen|knit|soft|stretch|relaxed|loose|flat|sneaker|breathable/;
  const uncomfortable = /stiff|tight|restricting|high heel|stiletto/;
  return items.reduce((score, item) => {
    const text = getItemText(item);
    if (uncomfortable.test(text)) return score - 2;
    if (comfortable.test(text)) return score + 2;
    return score;
  }, 0);
}

function scoreForPersonalRequest(items, personalRequest) {
  const request = String(personalRequest || "").toLowerCase();
  if (!request.trim()) return 0;

  const avoidPrefix = String.raw`(?:avoid|no|without|(?:do not|don't)\s+(?:wear|want)(?:\s+to\s+wear)?)\s+(?:any\s+)?`;
  const avoidRules = [
    { request: new RegExp(`${avoidPrefix}(?:high\\s+)?heels?|stilettos?\\b`), item: /\b(?:high\s+)?heels?\b|\bstilettos?\b/ },
    { request: new RegExp(`${avoidPrefix}sandals?|flip[ -]?flops?\\b`), item: /\bsandals?\b|\bflip[ -]?flops?\b/ },
    { request: new RegExp(`${avoidPrefix}sneakers?|trainers?\\b`), item: /\bsneakers?\b|\btrainers?\b/ },
    { request: new RegExp(`${avoidPrefix}boots?\\b`), item: /\bboots?\b/ },
    { request: new RegExp(`${avoidPrefix}dresses?\\b`), item: /\bdresses?\b/ },
    { request: new RegExp(`${avoidPrefix}skirts?\\b`), item: /\bskirts?\b/ },
    { request: new RegExp(`${avoidPrefix}shorts?\\b`), item: /\bshorts?\b/ },
    { request: new RegExp(`${avoidPrefix}(?:jeans?|denim)\\b`), item: /\bjeans?\b|\bdenim\b/ },
  ];

  const avoidedItemPenalty = avoidRules.reduce((score, rule) => {
    if (!rule.request.test(request)) return score;
    return score + (items.some((item) => rule.item.test(getItemText(item))) ? -100 : 0);
  }, 0);

  const colorNames = ["black", "white", "blue", "navy", "red", "pink", "green", "yellow", "purple", "orange", "brown", "beige"];
  const avoidedColorPenalty = colorNames.reduce((score, color) => {
    const colorRequest = new RegExp(`${avoidPrefix}${color}\\b`);
    if (!colorRequest.test(request)) return score;
    const itemMatchesColor = items.some((item) =>
      normalizeColor(item.color).split(" ").includes(color) ||
      new RegExp(`\\b${color}\\b`).test(getItemText(item))
    );
    if (colorRequest.test(request)) return score + (itemMatchesColor ? -60 : 0);

    const preferColor = new RegExp(`\\b(?:prefer|more|include|choose|wear)\\s+(?:a\\s+)?${color}\\b`);
    if (preferColor.test(request)) return score + (itemMatchesColor ? 6 : 0);
    return score;
  }, 0);

  return avoidedItemPenalty + avoidedColorPenalty;
}


function Outfits({ clothes = [], user }) {
  const [preferredStyle] = useState(() => readPreferences(user?.email).style);
  const [occasion, setOccasion] = useState("Casual");
  const [weather, setWeather] = useState("Warm");
  const [mood, setMood] = useState("Everyday");
  const [prioritizeComfort, setPrioritizeComfort] = useState(false);
  const [personalRequest, setPersonalRequest] = useState("");

  const [generated, setGenerated] = useState(false);

  const [generatedOccasion, setGeneratedOccasion] =
    useState("Casual");

  const [generatedWeather, setGeneratedWeather] =
    useState("Warm");
  const [generatedMood, setGeneratedMood] = useState("Everyday");
  const [generatedComfort, setGeneratedComfort] = useState(false);
  const [generatedPersonalRequest, setGeneratedPersonalRequest] = useState("");
  const [generatedStyle, setGeneratedStyle] = useState(preferredStyle);
  const [manualOutfit, setManualOutfit] = useState(null);

  const [outfitVersion, setOutfitVersion] = useState(0);
  const [seenOutfits, setSeenOutfits] = useState(() => readSeenSuggestions(user?.email));
  const [selectedSuggestionKey, setSelectedSuggestionKey] = useState("");
  const [aiPreferredKey, setAiPreferredKey] = useState("");
  const [aiStyling, setAiStyling] = useState({ status: "idle", explanations: {} });
  const [recentWornKeys, setRecentWornKeys] = useState([]);
  const [favorite, setFavorite] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedOutfitId, setSavedOutfitId] = useState(null);
  const [worn, setWorn] = useState(false);
  const [markingWorn, setMarkingWorn] = useState(false);
  const [favoriteUpdating, setFavoriteUpdating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const occasions = [
    "Casual",
    "College",
    "Office",
    "Dinner",
    "Traditional",
    "Travel",
  ];

  const weatherOptions = ["Warm", "Cool", "Rainy"];

  useEffect(() => {
    let active = true;
    const token = sessionStorage.getItem("token");

    if (token) {
      apiRequest("/outfits")
        .then((outfits) => {
          if (!active || !Array.isArray(outfits)) return;
          const recentCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
          const keys = outfits
            .filter((outfit) => outfit.wornAt && new Date(outfit.wornAt).getTime() >= recentCutoff)
            .map((outfit) => String(outfit.clothingItemIds || "")
              .split(",")
              .map((id) => id.trim())
              .filter(Boolean)
              .sort()
              .join("|"))
            .filter(Boolean);
          setRecentWornKeys(keys);
        })
        .catch((error) => {
          console.warn("Could not load outfit history for suggestions:", error);
        });
    }

    return () => {
      active = false;
    };
  }, []);

  const currentOutfit = (() => {
    if (!clothes || clothes.length === 0) {
      return null;
    }
    const tops = clothes.filter((item) => ["top", "kurti"].includes(getGarmentType(item)));
    const kurtis = clothes.filter((item) => getGarmentType(item) === "kurti");
    const bottoms = clothes.filter((item) => getGarmentType(item) === "bottom");
    const dresses = clothes.filter((item) => getGarmentType(item) === "dress");
    const sarees = clothes.filter((item) => getGarmentType(item) === "saree");
    const blouses = clothes.filter((item) => getGarmentType(item) === "blouse");
    const shoes = clothes.filter((item) => getGarmentType(item) === "shoes");
    const combinations = [];

    if (generatedOccasion === "Traditional") {
      sarees.forEach((saree) => {
        const matchingBlouses = blouses.length ? blouses : [null];
        matchingBlouses.forEach((blouse) => {
          combinations.push(blouse ? [saree, blouse] : [saree]);
        });
      });
      // A kurti with a bottom is a complete traditional look too.
      kurtis.forEach((top) => {
        bottoms.forEach((bottom) => combinations.push([top, bottom]));
      });
    } else {
      tops.forEach((top) => {
        bottoms.forEach((bottom) => combinations.push([top, bottom]));
      });
      dresses.forEach((dress) => combinations.push([dress]));
    }

    if (combinations.length === 0) {
      return null;
    }

    // Shoes complete a look when available, but are never used as an outfit alone.
    const completeCombinations = shoes.length
      ? combinations.flatMap((items) =>
          shoes.map((shoe) => [...items, shoe])
        )
      : combinations;


    // Rank wardrobe combinations for the selected occasion and weather.
    const rankedCombinations = completeCombinations
      .map((items) => {
        let colorScore = 0;
        let comparisons = 0;

        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            colorScore += scoreColorPair(
              items[i].color,
              items[j].color
            );
            comparisons++;
          }
        }

        const averageColorScore =
          comparisons > 0 ? colorScore / comparisons : 1;

        const occasionScore = scoreForOccasion(items, generatedOccasion);
        const weatherScore = scoreForWeather(items, generatedWeather);
        const styleScore = scoreForStyle(items, generatedStyle);
        const patternScore = scorePatternHarmony(items);
        const moodScore = scoreForMood(items, generatedMood);
        const comfortScore = scoreForComfort(items, generatedComfort);
        const personalRequestScore = scoreForPersonalRequest(items, generatedPersonalRequest);

        return {
          items,
          score: averageColorScore + occasionScore + weatherScore + styleScore + patternScore + moodScore + comfortScore + personalRequestScore,
          occasionScore,
          weatherScore,
          styleScore,
          patternScore,
          moodScore,
          comfortScore,
        };
      })
      .sort((a, b) => b.score - a.score);

    // Skip recently worn combinations when other looks are available.
    const freshCombinations = rankedCombinations.filter(
      (combination) => !recentWornKeys.includes(getOutfitKey(combination.items))
    );
    const availableCombinations = freshCombinations.length
      ? freshCombinations
      : rankedCombinations;

    const wardrobeById = new Map(clothes.map((item) => [String(item.id), item]));
    const seenGarmentCombinations = new Set(seenOutfits
      .map((outfitKey) => {
        const items = outfitKey.split("|")
          .map((id) => wardrobeById.get(id))
          .filter(Boolean);
        return items.length ? getGarmentCombinationKey(items) : "";
      })
      .filter(Boolean));

    const unseenCombinations = availableCombinations.filter(
      (combination) => !seenOutfits.includes(getOutfitKey(combination.items))
    );
    const unseenGarmentCombinations = unseenCombinations.filter(
      (combination) => !seenGarmentCombinations.has(getGarmentCombinationKey(combination.items))
    );
    const prioritizedUnseen = prioritizeGarmentVariety(
      unseenGarmentCombinations.length ? unseenGarmentCombinations : unseenCombinations
    );
    const prioritizedAvailable = prioritizeGarmentVariety(availableCombinations);
    const nextCombination = prioritizedUnseen[0];
    const selectedCombination = nextCombination ||
      prioritizedAvailable[outfitVersion % prioritizedAvailable.length];
    const uniqueUnseenGarments = prioritizedUnseen.filter((combination, index, list) =>
      list.findIndex((candidate) =>
        getGarmentCombinationKey(candidate.items) === getGarmentCombinationKey(combination.items)
      ) === index
    );
    const recommendationPool = uniqueUnseenGarments.length > 1
      ? uniqueUnseenGarments
      : prioritizedUnseen;
    const recommendationOptions = (recommendationPool.length
      ? recommendationPool
      : prioritizedAvailable).slice(0, 3);
    const explicitlySelectedCombination = recommendationOptions.find(
      (combination) => getOutfitKey(combination.items) === selectedSuggestionKey
    );
    const aiSelectedCombination = recommendationOptions.find(
      (combination) => getOutfitKey(combination.items) === aiPreferredKey
    );
    const activeCombination = explicitlySelectedCombination || aiSelectedCombination || selectedCombination;
    const selectedItems = manualOutfit || [...activeCombination.items];
    const suggestionKey = getSuggestionKey(selectedItems);
    const selectedOccasionScore = scoreForOccasion(selectedItems, generatedOccasion);
    const selectedWeatherScore = scoreForWeather(selectedItems, generatedWeather);
    const selectedStyleScore = scoreForStyle(selectedItems, generatedStyle);
    const selectedPatternScore = scorePatternHarmony(selectedItems);
    const selectedMoodScore = scoreForMood(selectedItems, generatedMood);
    const selectedComfortScore = scoreForComfort(selectedItems, generatedComfort);

    const occasionReason = selectedOccasionScore > 0
      ? `The pieces fit a ${generatedOccasion.toLowerCase()} occasion.`
      : "This look uses items from your wardrobe for the selected occasion.";
    const weatherReason = selectedWeatherScore > 0
      ? ` Its item details also suit ${generatedWeather.toLowerCase()} weather.`
      : selectedWeatherScore < 0
        ? ` Some item details may be less suited to ${generatedWeather.toLowerCase()} weather.`
        : ` Check the forecast for ${generatedWeather.toLowerCase()} weather, since item weather details are limited.`;
    const styleReason = selectedStyleScore > 0
      ? ` The item details also match your ${generatedStyle.toLowerCase()} style preference.`
      : " Add style keywords to clothing notes to improve style matching.";
    const patternReason = selectedPatternScore > 0
      ? " The patterned piece is balanced with a simpler item."
      : selectedPatternScore < 0
        ? " This combination has multiple patterned pieces; try another look for a calmer mix."
        : "";
    const moodReason = selectedMoodScore > 0
      ? ` The pieces also fit a ${generatedMood.toLowerCase()} mood.`
      : "";
    const comfortReason = generatedComfort
      ? selectedComfortScore > 0
        ? " It prioritizes comfortable fabrics and fits where your item details are available."
        : " Comfort details are limited for these pieces; add fabric or fit details to improve comfort matching."
      : "";
    const availableGarmentCombinationCount = new Set(
      availableCombinations.map((combination) => getGarmentCombinationKey(combination.items))
    ).size;
    const varietyReason = nextCombination
      ? availableGarmentCombinationCount === 1 && availableCombinations.length > 1
        ? " Your wardrobe has no other complete clothing combination for this request, so the remaining options mainly change footwear."
        : ""
      : " You have seen all available combinations for this selection; change the occasion or weather for a fresh ranking.";
    const historyReason = freshCombinations.length < rankedCombinations.length && freshCombinations.length
      ? " This look also avoids a combination you marked as worn in the last 30 days."
      : "";

    return {
      items: selectedItems,
      key: getOutfitKey(selectedItems),
      suggestionKey,
      alternatives: recommendationOptions.map((combination) => ({
        items: combination.items,
        key: getOutfitKey(combination.items),
        score: combination.score,
      })),
      reason: `${occasionReason}${weatherReason}${styleReason}${patternReason}${moodReason}${comfortReason}${manualOutfit ? " You swapped a piece to personalize this look." : ""}${historyReason}${varietyReason}`,
      hasUnseenAlternatives: availableCombinations.some(
        (combination) => !seenOutfits.includes(getSuggestionKey(combination.items))
      ),
    };
  })();

  // Keep the calculated combination hidden until the user asks to generate it.
  const shownOutfit = generated ? currentOutfit : null;
  const stylistRequest = generated && currentOutfit?.alternatives?.length
    ? {
        occasion: generatedOccasion,
        weather: generatedWeather,
        mood: generatedMood,
        style: generatedStyle,
        prioritizeComfort: generatedComfort,
        personalRequest: generatedPersonalRequest.trim(),
        optionItemIds: currentOutfit.alternatives.map((option) => option.items.map((item) => item.id)),
      }
    : null;
  const stylistRequestSignature = stylistRequest ? JSON.stringify(stylistRequest) : "";
  const currentAiStyling = aiStyling.signature === stylistRequestSignature
    ? aiStyling
    : null;
  const aiStylingStatus = currentAiStyling?.status || (stylistRequestSignature ? "loading" : "idle");
  const selectedAiExplanation = shownOutfit
    ? currentAiStyling?.explanations?.[shownOutfit.key]
    : "";

  // Gemini may reorder and explain only the local candidates. The server checks
  // every item belongs to this account, and the rules-based options stay usable
  // if Gemini is missing or temporarily unavailable.
  useEffect(() => {
    if (!stylistRequestSignature) {
      return undefined;
    }

    let active = true;
    const request = JSON.parse(stylistRequestSignature);
    const optionKeys = request.optionItemIds.map((ids) => ids.map(String).sort().join("|"));

    apiRequest("/stylist/advice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: stylistRequestSignature,
    })
      .then((response) => {
        if (!active) return;
        if (!response?.available) {
          setAiPreferredKey("");
          setAiStyling({ signature: stylistRequestSignature, status: "fallback", message: response?.message || "Using wardrobe-based suggestions.", explanations: {} });
          return;
        }
        const rankedKeys = (response.rankedOptionIndexes || [])
          .map((index) => optionKeys[index])
          .filter(Boolean);
        const explanations = {};
        (response.options || []).forEach((option) => {
          const key = optionKeys[option.optionIndex];
          if (key && option.explanation) explanations[key] = option.explanation;
        });
        setAiPreferredKey(rankedKeys[0] || "");
        setAiStyling({ signature: stylistRequestSignature, status: "ready", rankedKeys, explanations, message: "" });
      })
      .catch((error) => {
        if (!active) return;
        console.warn("Gemini stylist advice unavailable; using local ranking:", error);
        setAiPreferredKey("");
        const message = error?.status === 401
          ? "Your sign-in session expired. Sign in again to get Gemini styling advice. Wardrobe-based suggestions are still available."
          : error?.status === 403
            ? "The stylist request was denied. Check your sign-in permissions and try again. Wardrobe-based suggestions are still available."
            : error?.message || "The stylist request failed. Wardrobe-based suggestions are still available.";
        setAiStyling({
          signature: stylistRequestSignature,
          status: "fallback",
          message,
          explanations: {},
        });
      });

    return () => {
      active = false;
    };
  }, [stylistRequestSignature]);

  // Keep generated suggestions out of the first slot after refresh. The history
  // is scoped to the signed-in account. Occasion/weather ranking still decides
  // which unseen combination is the best fit for the current request.
  useEffect(() => {
    if (generated && currentOutfit?.suggestionKey) {
      rememberSuggestion(user?.email, currentOutfit.suggestionKey);
    }
  }, [generated, currentOutfit?.suggestionKey, user?.email]);


  // Generate outfit
  function handleGenerate() {
    const sameContext = occasion === generatedOccasion &&
      weather === generatedWeather && mood === generatedMood &&
      prioritizeComfort === generatedComfort && generatedStyle === preferredStyle &&
      personalRequest.trim() === generatedPersonalRequest.trim();
    if (generated && sameContext && currentOutfit?.key) {
      setSeenOutfits((previous) =>
        previous.includes(currentOutfit.suggestionKey)
          ? previous
          : [...previous, currentOutfit.suggestionKey]
      );
    } else {
      // Keep the account's history; suggestion keys include the context.
    }
    setGeneratedOccasion(occasion);
    setGeneratedWeather(weather);
    setGeneratedMood(mood);
    setGeneratedComfort(prioritizeComfort);
    setGeneratedPersonalRequest(personalRequest);
    setGeneratedStyle(preferredStyle);
    setManualOutfit(null);
    setSelectedSuggestionKey("");
    setAiPreferredKey("");
    setOutfitVersion((previous) => previous + 1);
    setSaved(false);
    setSavedOutfitId(null);
    setWorn(false);
    setFavorite(false);
    setGenerated(true);
  }

  // Try another outfit
  function handleTryAnother() {
    if (currentOutfit?.key) {
      setSeenOutfits((previous) =>
        previous.includes(currentOutfit.suggestionKey)
          ? previous
          : [...previous, currentOutfit.suggestionKey]
      );
    }
    setOutfitVersion((previousVersion) => previousVersion + 1);
    setManualOutfit(null);
    setSelectedSuggestionKey("");
    setAiPreferredKey("");
    setSaved(false);
    setSavedOutfitId(null);
    setWorn(false);
    setFavorite(false);
  }

  function handleSwapPiece(item) {
    if (!currentOutfit) return;
    const role = getGarmentType(item);
    const alternatives = clothes.filter((candidate) =>
      getGarmentType(candidate) === role && String(candidate.id) !== String(item.id)
    );
    if (!alternatives.length) return;

    const currentItems = [...currentOutfit.items];
    const remainingItems = currentItems.filter((piece) => piece !== item && String(piece.id) !== String(item.id));
    const replacementScore = (candidate) => {
      const relatedColor = remainingItems.reduce(
        (score, other) => score + scoreColorPair(candidate.color, other.color), 0
      );
      return relatedColor +
        scoreForOccasion([candidate], generatedOccasion) +
        scoreForWeather([candidate], generatedWeather) +
        scoreForStyle([candidate], generatedStyle) +
        scorePatternHarmony([...remainingItems, candidate]) +
        scoreForMood([candidate], generatedMood) +
        scoreForComfort([candidate], generatedComfort) +
        scoreForPersonalRequest([candidate], generatedPersonalRequest);
    };
    const rankedAlternatives = alternatives
      .map((candidate) => {
        const items = currentItems.map((piece) =>
          String(piece.id) === String(item.id) ? candidate : piece
        );
        return {
          items,
          score: replacementScore(candidate),
          key: getSuggestionKey(items),
        };
      })
      .sort((a, b) => b.score - a.score);
    const unseenAlternatives = rankedAlternatives.filter(
      (candidate) => !seenOutfits.includes(candidate.key) && !recentWornKeys.includes(getOutfitKey(candidate.items))
    );
    const nextAlternative = (unseenAlternatives.length ? unseenAlternatives : rankedAlternatives)[0];
    if (!nextAlternative) return;

    const replacedItems = nextAlternative.items;
    setManualOutfit(replacedItems);
    setSelectedSuggestionKey("");
    setAiPreferredKey("");
    setSaved(false);
    setSavedOutfitId(null);
    setWorn(false);
  }

  function handleSelectSuggestion(suggestion) {
    setSelectedSuggestionKey(suggestion.key);
    setAiPreferredKey("");
    setManualOutfit(null);
    setSaved(false);
    setSavedOutfitId(null);
    setWorn(false);
    setFavorite(false);
  }

  // Toggle favorite
  async function handleFavorite() {
    if (favoriteUpdating || saving || !generated || !currentOutfit) return;
    setFavoriteUpdating(true);
    setSaveError("");
    try {
      let outfitId = savedOutfitId;
      if (!outfitId) {
        const savedOutfit = await handleSave();
        outfitId = savedOutfit?.id;
      }
      if (!outfitId) return;

      const updated = await apiRequest(
        `/outfits/${outfitId}/favorite?favorite=${!favorite}`,
        { method: "PATCH" }
      );
      setSaved(true);
      setSavedOutfitId(outfitId);
      setFavorite(Boolean(updated?.favorite));
    } catch (error) {
      setSaveError(error.message || "Could not update this favorite.");
    } finally {
      setFavoriteUpdating(false);
    }
  }

  // Toggle saved state

  // Save the outfit to Spring Boot and MySQL

  // Save the outfit to Spring Boot and MySQL
  async function handleSave() {
    if (saving) return;

    setSaveError("");

    if (!generated || !currentOutfit || currentOutfit.items.length === 0) {
      setSaveError("Add a top and a bottom, or a dress, to create a complete outfit before saving.");
      return;
    }

    const token = sessionStorage.getItem("token");

    if (!token) {
      setSaveError("Your session has expired. Please log in again.");
      return;
    }

    const clothingIds = currentOutfit.items
      .map((item) => item.id)
      .filter((id) => id !== null && id !== undefined);

    if (clothingIds.length !== currentOutfit.items.length) {
      setSaveError(
        "Some clothing items are missing IDs. Please reload your wardrobe."
      );
      return;
    }

    const clothingNames = currentOutfit.items
      .map((item) => item.name)
      .join(", ");

    setSaving(true);

    try {
      const savedOutfit = await apiRequest("/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: `${generatedOccasion} Outfit`,
            occasion: generatedOccasion,
            weather: generatedWeather,
            clothingItemIds: clothingIds.join(","),
            clothingItemNames: clothingNames,
        }),
      });

      setSaved(true);
      setSavedOutfitId(savedOutfit?.id ?? null);
      return savedOutfit;
    } catch (error) {
      console.error("Error saving outfit:", error);
      setSaveError(
        error.message || "Could not save the outfit. Please try again."
      );
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkWorn() {
    if (!savedOutfitId || markingWorn) return;
    setSaveError("");
    setMarkingWorn(true);
    try {
      const updated = await apiRequest(`/outfits/${savedOutfitId}/worn?worn=true`, {
        method: "PATCH",
      });
      setWorn(Boolean(updated?.wornAt));
      if (updated?.wornAt && currentOutfit?.key) {
        setRecentWornKeys((previous) => [
          ...new Set([...previous, currentOutfit.key]),
        ]);
      }
    } catch (error) {
      console.error("Could not update outfit history:", error);
      setSaveError(error.message || "Could not mark this outfit as worn.");
    } finally {
      setMarkingWorn(false);
    }
  }



  // Create a background using the selected clothing colors
  const firstColor = shownOutfit?.items?.[0]?.color;
  const secondColor =
    shownOutfit?.items?.[1]?.color || firstColor;

  const previewBackground = shownOutfit
    ? `linear-gradient(
        135deg,
        ${colorToCss(firstColor)},
        ${colorToCss(secondColor)}
      )`
    : "linear-gradient(145deg, #e4eee5, #fff0e6, #f7e8ed)";

  return (
    <div className="content">
      <PageHeader
        eyebrow="Your personal stylist"
        title="What should I wear?"
        subtitle="A considered outfit, made from what you already own."
      />

      <div className="outfit-layout">
        {/* Outfit Builder */}
        <section className="outfit-builder panel">
          <div className="builder-top">
            <span className="ai-sparkle">
              <Sparkles size={16} />
              AI stylist
            </span>

            <span className="step-count">1 of 2</span>
          </div>

          <h2>Set the mood</h2>

          <p>Tell us a little about where you're going.</p>

          <label className="builder-label">Occasion</label>

          <div className="choice-grid">
            {occasions.map((item) => (
              <button
                key={item}
                onClick={() => setOccasion(item)}
                className={
                  occasion === item ? "choice-selected" : ""
                }
              >
                {item}
              </button>
            ))}
          </div>

          <label className="builder-label">
            How's the weather?
          </label>

          <div className="weather-row">
            {weatherOptions.map((item) => (
              <button
                key={item}
                onClick={() => setWeather(item)}
                className={
                  weather === item ? "choice-selected" : ""
                }
              >
                {item === "Warm" && "☀️ Warm"}
                {item === "Cool" && "☁️ Cool"}
                {item === "Rainy" && "🌧 Rainy"}
              </button>
            ))}
          </div>

          <div className="stylist-context-row">
            <label htmlFor="outfit-mood">
              Outfit mood
              <select
                id="outfit-mood"
                value={mood}
                onChange={(event) => setMood(event.target.value)}
              >
                {["Everyday", "Relaxed", "Confident", "Polished", "Playful"].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="comfort-priority">
              <input
                type="checkbox"
                checked={prioritizeComfort}
                onChange={(event) => setPrioritizeComfort(event.target.checked)}
              />
              <span>Prioritize comfort</span>
            </label>
          </div>

          <label className="builder-label" htmlFor="stylist-request">
            Anything else the stylist should know?
          </label>
          <textarea
            id="stylist-request"
            className="stylist-request-input"
            value={personalRequest}
            onChange={(event) => setPersonalRequest(event.target.value.slice(0, 240))}
            placeholder="For example: comfortable for walking, avoid heels"
            maxLength={240}
            rows={2}
          />

          <Button
            className="generate-button"
            onClick={handleGenerate}
          >
            <Sparkles size={17} />
            {generated ? "Refresh outfit" : "Generate outfit"}
          </Button>
        </section>

        {/* Outfit Suggestion */}
        <section className="suggestion panel">
          <div className="suggestion-head">
            <div>
              <span className="eyebrow">
                {generated
                  ? "Your look for today"
                  : "A little inspiration"}
              </span>

              <h2>{generatedOccasion}, considered.</h2>
            </div>

            <button
              className={`icon-button ${
                favorite ? "favorite-active" : ""
              }`}
              onClick={handleFavorite}
              disabled={!shownOutfit || favoriteUpdating || saving}
              aria-label={
                favoriteUpdating
                  ? "Updating favorite"
                  : favorite
                  ? "Remove from favorites"
                  : "Add to favorites"
              }
            >
              <Heart
                size={17}
                fill={favorite ? "currentColor" : "none"}
              />
            </button>
          </div>

          {generated && currentOutfit?.alternatives?.length > 1 && (
            <div className="outfit-options" aria-label="More outfit options">
              <p>Choose a look</p>
              {currentOutfit.alternatives.map((option, index) => (
                <button
                  type="button"
                  key={option.key}
                  className={`outfit-option ${shownOutfit?.key === option.key && !manualOutfit ? "outfit-option-selected" : ""}`}
                  onClick={() => handleSelectSuggestion(option)}
                  aria-pressed={shownOutfit?.key === option.key && !manualOutfit}
                >
                  <span>Look {index + 1}</span>
                  <strong>{option.items.map((item) => item.name).filter(Boolean).join(" + ")}</strong>
                  <small>{option.items.map((item) => item.color).filter(Boolean).join(" · ") || "From your wardrobe"}</small>
                </button>
              ))}
            </div>
          )}

          {/* Outfit Preview */}
          <div
            className="outfit-visual"
            style={{ background: previewBackground }}
          >
            {shownOutfit ? (
              <div className="outfit-preview-content">
                <span className="preview-badge">
                  <Sparkles size={16} />
                  {generated
                    ? `${generatedOccasion} · ${generatedWeather}`
                    : "Your Outfit Preview"}
                </span>

                <div className="preview-clothes">
                  {shownOutfit.items
                    .filter((item) => item.image)
                    .map((item, index) => (
                      <div
                        className="preview-clothing-item"
                        key={item.id ?? `${item.name}-${index}`}
                      >
                        <img src={item.image} alt={item.name} />
                        <span>{item.name}</span>
                      </div>
                    ))}
                </div>

                <p className="preview-note">
                  Your selected wardrobe pieces
                </p>
              </div>
            ) : (
              <div className="outfit-preview-content">
                <Sparkles size={28} />
                <span>
                  {generated && clothes.length > 0
                    ? "Add compatible pieces to create a complete outfit"
                    : clothes.length === 0
                      ? "Add clothes to your wardrobe to start styling"
                      : "Generate an outfit to see your selected pieces"}
                </span>
              </div>
            )}
          </div>

          {/* Outfit Items */}
          <div className="outfit-items">
            {shownOutfit ? (
              shownOutfit.items.map((item, index) => (
                <div key={item.id ?? `${item.name}-${index}`}>
                  <span>
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="outfit-item-image"
                    />
                  )}

                  <strong>{item.name}</strong>

                  <small>
                    {[item.category, item.color, item.brand].filter(Boolean).join(" · ")}
                  </small>
                  {clothes.filter((candidate) =>
                    getGarmentType(candidate) === getGarmentType(item) &&
                    String(candidate.id) !== String(item.id)
                  ).length > 0 && (
                    <button
                      type="button"
                      className="piece-swap"
                      onClick={() => handleSwapPiece(item)}
                    >
                      Try another piece
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="outfit-empty-prompt">
                {clothes.length === 0
                  ? "Add clothes to your wardrobe to generate outfit suggestions."
                  : generated
                    ? "Add a top and a bottom, or a dress, to create a complete outfit. Bags and accessories are not used as clothing pieces."
                    : "Choose an occasion and weather, then generate an outfit to see your pieces here."}
              </p>
            )}
          </div>

          {/* Why This Works */}
          <div className="why-box">
            <Star size={16} />

            <div>
              <strong>Why this works</strong>

              <p>
                {shownOutfit
                  ? selectedAiExplanation || shownOutfit.reason
                  : generated && !currentOutfit
                    ? "Your wardrobe does not have a complete outfit for this selection yet. Add a top and a bottom, or a dress, then try again."
                    : clothes.length === 0
                    ? "Add clothes to your wardrobe to get personalized outfit suggestions."
                    : "Your stylist will explain the look after you generate an outfit."}
              </p>
              {generated && aiStylingStatus === "loading" && (
                <small className="ai-stylist-status" aria-live="polite">Getting styling notes…</small>
              )}
              {generated && aiStylingStatus === "fallback" && (
                <small className="ai-stylist-status" aria-live="polite">{currentAiStyling?.message}</small>
              )}
            </div>
          </div>


  {/* Actions */}
  <div className="suggestion-actions">
    <Button
      variant="outline"
      onClick={handleTryAnother}
      disabled={!generated || !currentOutfit?.hasUnseenAlternatives}
    >
      <ArrowRight size={16} />
      {currentOutfit?.hasUnseenAlternatives ? "Try another" : "All looks shown"}
    </Button>

      <Button
      onClick={handleSave}
      disabled={!generated || !currentOutfit || saving || saved}
    >
      {saving ? (
        "Saving..."
      ) : saved ? (
        <>
          <Check size={16} />
          Saved
        </>
      ) : (
        "Save outfit"
      )}
    </Button>
    <Button
      variant="outline"
      onClick={handleMarkWorn}
      disabled={!savedOutfitId || worn || markingWorn}
      title={!savedOutfitId ? "Save this outfit first" : undefined}
    >
      {worn ? <><Check size={16} /> Worn</> : markingWorn ? "Updating..." : "Mark worn"}
    </Button>
  </div>

  {saveError && (
    <p className="auth-error" role="alert">
      {saveError}
    </p>
  )}

        </section>
      </div>
    </div>
  );
}

export default Outfits;
