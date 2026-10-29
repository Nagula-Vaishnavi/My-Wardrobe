const COLOR_SWATCHES = [
  ["Black", [35, 35, 35]],
  ["White", [245, 245, 240]],
  ["Gray", [135, 135, 135]],
  ["Brown", [130, 82, 55]],
  ["Beige", [215, 195, 160]],
  ["Cream", [245, 232, 205]],
  ["Red", [190, 45, 50]],
  ["Pink", [225, 145, 165]],
  ["Orange", [220, 125, 45]],
  ["Yellow", [225, 195, 55]],
  ["Green", [55, 125, 70]],
  ["Olive", [120, 125, 55]],
  ["Blue", [55, 110, 180]],
  ["Navy", [40, 55, 95]],
  ["Purple", [120, 75, 155]],
  ["Multicolor", [0, 0, 0]],
];

function nearestColor([red, green, blue]) {
  const brightness = (red + green + blue) / 3;
  const spread = Math.max(red, green, blue) - Math.min(red, green, blue);
  if (spread < 22) {
    if (brightness < 60) return "Black";
    if (brightness > 205) return "White";
    return "Gray";
  }

  return COLOR_SWATCHES
    .filter(([name]) => name !== "Multicolor")
    .map(([name, swatch]) => ({
      name,
      distance: (red - swatch[0]) ** 2 +
        (green - swatch[1]) ** 2 +
        (blue - swatch[2]) ** 2,
    }))
    .sort((first, second) => first.distance - second.distance)[0].name;
}

export function estimatePhotoColor(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 48;
        canvas.height = 48;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Photo analysis is unavailable in this browser.");

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const bins = new Map();

        // Sample the center where the clothing item is most likely to appear.
        for (let y = 7; y < 43; y++) {
          for (let x = 8; x < 40; x++) {
            const index = (y * canvas.width + x) * 4;
            const alpha = pixels[index + 3];
            if (alpha < 128) continue;

            const red = pixels[index];
            const green = pixels[index + 1];
            const blue = pixels[index + 2];
            const key = [red >> 5, green >> 5, blue >> 5].join(":");
            const bin = bins.get(key) || { count: 0, red: 0, green: 0, blue: 0 };
            bin.count++;
            bin.red += red;
            bin.green += green;
            bin.blue += blue;
            bins.set(key, bin);
          }
        }

        const dominant = [...bins.values()].sort((a, b) => b.count - a.count)[0];
        if (!dominant) throw new Error("Could not find a usable color in this photo.");

        resolve(nearestColor([
          dominant.red / dominant.count,
          dominant.green / dominant.count,
          dominant.blue / dominant.count,
        ]));
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read this photo. Try another image."));
    };

    image.src = objectUrl;
  });
}
