export const CLOTHING_CATEGORIES = [
  "Tops",
  "Shirts",
  "T-Shirts",
  "Bottoms",
  "Dresses",
  "Kurtis",
  "Palazzos",
  "Sarees",
  "Blouses",
  "Shoes",
  "Bags",
  "Accessories",
  "Other",
];

const CATEGORY_TYPES = {
  tops: "top",
  shirts: "top",
  "t shirts": "top",
  "t shirt": "top",
  kurtis: "kurti",
  kurti: "kurti",
  bottoms: "bottom",
  palazzos: "bottom",
  palazzo: "bottom",
  dresses: "dress",
  dress: "dress",
  sarees: "saree",
  saree: "saree",
  blouses: "blouse",
  blouse: "blouse",
  shoes: "shoes",
  footwear: "shoes",
  bags: "accessory",
  accessories: "accessory",
};

export function getGarmentType(item) {
  const category = String(item?.category || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (CATEGORY_TYPES[category]) return CATEGORY_TYPES[category];

  // Support older records whose category was broad or missing.
  const name = String(item?.name || "").toLowerCase();
  if (/\b(saree|sari)\b/.test(name)) return "saree";
  if (/\b(dress|jumpsuit|romper|one piece)\b/.test(name)) return "dress";
  if (/\b(shoe|sneaker|sandal|footwear|loafer|boot)\b/.test(name)) return "shoes";
  if (/\b(bag|purse|handbag|accessory|accessories)\b/.test(name)) return "accessory";
  if (/\b(blouse)\b/.test(name)) return "blouse";
  if (/\b(pant|trouser|jean|bottom|legging|palazzo|skirt|shorts)\b/.test(name)) return "bottom";
  if (/\b(kurti|kurta)\b/.test(name)) return "kurti";
  if (/\b(shirt|top|t shirt|tee|sweater|jacket)\b/.test(name)) return "top";
  return "unknown";
}
