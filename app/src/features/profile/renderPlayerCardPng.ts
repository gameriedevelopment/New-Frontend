import type { PlayerCardModel, PlayerCardStatTone } from "./playerCard";

const WIDTH = 1080;
const HEIGHT = 1350;

interface CardPalette {
  canvas: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  secondary: string;
  muted: string;
  brand: string;
  achievement: string;
}

function cssToken(styles: CSSStyleDeclaration, name: string, fallback: string) {
  return styles.getPropertyValue(name).trim() || fallback;
}

function cardPalette(): CardPalette {
  const styles = getComputedStyle(document.documentElement);
  return {
    canvas: cssToken(styles, "--g-canvas-deep", "#08090d"),
    surface: cssToken(styles, "--g-surface-1", "#10131a"),
    surfaceRaised: cssToken(styles, "--g-surface-2", "#141821"),
    border: cssToken(styles, "--g-color-void-600", "#252b39"),
    text: cssToken(styles, "--g-text-primary", "#f5f3f8"),
    secondary: cssToken(styles, "--g-text-secondary", "#b9b3c2"),
    muted: cssToken(styles, "--g-text-muted", "#8e8998"),
    brand: cssToken(styles, "--g-accent", "#b7a1ff"),
    achievement: cssToken(styles, "--g-achievement", "#dbc48a"),
  };
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const corner = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + corner, y);
  context.arcTo(x + width, y, x + width, y + height, corner);
  context.arcTo(x + width, y + height, x, y + height, corner);
  context.arcTo(x, y + height, x, y, corner);
  context.arcTo(x, y, x + width, y, corner);
  context.closePath();
}

function fillRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
) {
  roundedRect(context, x, y, width, height, radius);
  context.fillStyle = fill;
  context.fill();
}

function fitText(
  context: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
  initialSize: number,
  weight = 700,
  family = "Instrument Sans",
) {
  let size = initialSize;
  do {
    context.font = `${weight} ${size}px "${family}", sans-serif`;
    if (context.measureText(value).width <= maxWidth) return;
    size -= 2;
  } while (size > 24);
}

async function loadAvatar(source?: string): Promise<HTMLImageElement | null> {
  if (!source) return null;
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
}

function statColor(tone: PlayerCardStatTone, palette: CardPalette) {
  if (tone === "achievement") return palette.achievement;
  if (tone === "brand") return palette.brand;
  return palette.text;
}

function initials(username: string) {
  return (
    username
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "G"
  );
}

function drawAvatar(
  context: CanvasRenderingContext2D,
  model: PlayerCardModel,
  image: HTMLImageElement | null,
  palette: CardPalette,
) {
  const x = 80;
  const y = 174;
  const size = 176;
  context.save();
  context.beginPath();
  context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  context.clip();
  if (image) {
    const ratio = Math.max(size / image.naturalWidth, size / image.naturalHeight);
    const width = image.naturalWidth * ratio;
    const height = image.naturalHeight * ratio;
    context.drawImage(image, x + (size - width) / 2, y + (size - height) / 2, width, height);
  } else {
    context.fillStyle = palette.surfaceRaised;
    context.fillRect(x, y, size, size);
    context.fillStyle = palette.brand;
    context.font = '700 56px "Instrument Sans", sans-serif';
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(initials(model.username), x + size / 2, y + size / 2 + 2);
  }
  context.restore();
  context.strokeStyle = palette.brand;
  context.lineWidth = 3;
  context.beginPath();
  context.arc(x + size / 2, y + size / 2, size / 2 + 5, 0, Math.PI * 2);
  context.stroke();
}

function drawIdentitySignalMark(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  endorsed: boolean,
  palette: CardPalette,
) {
  context.save();
  context.fillStyle = palette.surfaceRaised;
  context.strokeStyle = endorsed ? palette.brand : palette.secondary;
  context.lineWidth = 2.5;
  context.beginPath();
  context.arc(x, y, 15, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.strokeStyle = endorsed ? palette.brand : palette.secondary;
  context.lineWidth = 2;
  context.lineCap = "round";
  context.lineJoin = "round";

  if (endorsed) {
    context.beginPath();
    context.moveTo(x, y - 8);
    context.lineTo(x + 7, y - 5);
    context.lineTo(x + 6, y + 3);
    context.quadraticCurveTo(x + 4, y + 8, x, y + 10);
    context.quadraticCurveTo(x - 4, y + 8, x - 6, y + 3);
    context.lineTo(x - 7, y - 5);
    context.closePath();
    context.stroke();
    context.beginPath();
    context.moveTo(x - 3, y);
    context.lineTo(x - 1, y + 3);
    context.lineTo(x + 4, y - 3);
    context.stroke();
  } else {
    context.beginPath();
    context.arc(x, y - 4, 4, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(x, y + 9, 8, Math.PI * 1.18, Math.PI * 1.82);
    context.stroke();
  }

  context.restore();
}

export async function renderPlayerCardPng(model: PlayerCardModel): Promise<Blob> {
  await document.fonts?.ready;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser cannot create the player card image.");
  const palette = cardPalette();

  context.fillStyle = palette.canvas;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  const glow = context.createRadialGradient(900, 80, 0, 900, 80, 640);
  glow.addColorStop(0, "rgba(183, 161, 255, 0.12)");
  glow.addColorStop(1, "rgba(183, 161, 255, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, WIDTH, 720);
  context.fillStyle = palette.achievement;
  context.fillRect(0, 0, WIDTH, 6);

  context.textBaseline = "alphabetic";
  context.textAlign = "left";
  context.fillStyle = palette.text;
  context.font = '700 34px "Instrument Sans", sans-serif';
  context.fillText("Gamerie", 80, 94);
  context.fillStyle = palette.achievement;
  context.font = '700 17px "Manrope", sans-serif';
  context.letterSpacing = "2px";
  context.fillText("PLAYER CARD", 828, 90);
  context.letterSpacing = "0px";

  const avatar = await loadAvatar(model.profileImage);
  drawAvatar(context, model, avatar, palette);

  context.fillStyle = palette.muted;
  context.font = '700 17px "Manrope", sans-serif';
  context.fillText("PLAYER IDENTITY", 302, 204);
  context.fillStyle = palette.text;
  fitText(context, model.username, 690, 66, 720);
  context.fillText(model.username, 302, 276);
  context.fillStyle = palette.brand;
  fitText(context, model.title, 690, 25, 680, "Manrope");
  context.fillText(model.title, 302, 322);

  fillRoundedRect(context, 80, 390, 920, 130, 18, palette.surface);
  context.fillStyle = palette.muted;
  context.font = '650 16px "Manrope", sans-serif';
  context.fillText("GAME ON PROFILE", 112, 432);
  context.fillText("STANDING", 588, 432);
  context.fillStyle = palette.text;
  context.font = '700 27px "Instrument Sans", sans-serif';
  context.fillText(model.game?.name || "Not shared", 112, 474);
  context.fillText(model.game?.standing || "Not recorded", 588, 474);
  context.fillStyle = palette.muted;
  context.font = '500 16px "Manrope", sans-serif';
  context.fillText(model.game?.identity || "Player profile", 112, 501);
  context.fillText(model.region || "Region not shared", 588, 501);

  context.fillStyle = palette.secondary;
  context.font = '700 18px "Manrope", sans-serif';
  context.fillText("RECORDED HIGHLIGHTS", 80, 594);
  context.fillStyle = palette.muted;
  context.font = '500 15px "Manrope", sans-serif';
  context.fillText("Available data only", 810, 594);

  if (model.stats.length) {
    const gap = 18;
    const width = (920 - gap * 2) / 3;
    model.stats.forEach((stat, index) => {
      const x = 80 + index * (width + gap);
      fillRoundedRect(context, x, 624, width, 178, 18, palette.surface);
      context.fillStyle = statColor(stat.tone, palette);
      context.font = '720 42px "Instrument Sans", sans-serif';
      context.fillText(stat.value, x + 24, 684);
      context.fillStyle = palette.text;
      context.font = '680 17px "Manrope", sans-serif';
      context.fillText(stat.label, x + 24, 730);
      context.fillStyle = palette.muted;
      context.font = '500 14px "Manrope", sans-serif';
      context.fillText(stat.context, x + 24, 765);
    });
  } else {
    fillRoundedRect(context, 80, 624, 920, 128, 18, palette.surface);
    context.fillStyle = palette.secondary;
    context.font = '560 20px "Manrope", sans-serif';
    context.fillText("No competitive statistics have been recorded yet.", 112, 697);
  }

  const strengthY = model.stats.length ? 874 : 824;
  context.fillStyle = palette.secondary;
  context.font = '700 18px "Manrope", sans-serif';
  context.fillText("IDENTITY SIGNALS", 80, strengthY);
  context.fillStyle = palette.muted;
  context.font = '500 15px "Manrope", sans-serif';
  context.fillText("Provenance shown", 830, strengthY);

  if (model.strengths.length) {
    model.strengths.forEach((strength, index) => {
      const y = strengthY + 30 + index * 92;
      fillRoundedRect(context, 80, y, 920, 76, 15, palette.surface);
      drawIdentitySignalMark(context, 116, y + 38, strength.endorsementCount > 0, palette);
      context.fillStyle = palette.text;
      context.font = '680 20px "Manrope", sans-serif';
      context.fillText(strength.name, 150, y + 33);
      context.fillStyle = palette.muted;
      context.font = '500 14px "Manrope", sans-serif';
      const provenance = strength.endorsementCount
        ? `${strength.provenance} · ${strength.endorsementCount} ${strength.endorsementCount === 1 ? "endorsement" : "endorsements"}`
        : strength.provenance;
      context.fillText(provenance, 150, y + 57);
    });
  } else {
    context.fillStyle = palette.muted;
    context.font = '520 19px "Manrope", sans-serif';
    context.fillText("No player strengths have been shared yet.", 80, strengthY + 64);
  }

  context.strokeStyle = palette.border;
  context.beginPath();
  context.moveTo(80, 1244);
  context.lineTo(1000, 1244);
  context.stroke();
  context.fillStyle = palette.achievement;
  context.font = '700 22px "Instrument Sans", sans-serif';
  context.fillText("gamerie.gg", 80, 1293);
  context.fillStyle = palette.muted;
  context.font = '500 15px "Manrope", sans-serif';
  context.textAlign = "right";
  context.fillText("Identity · community · competition", 1000, 1291);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("The player card image could not be created.")),
      "image/png",
      1,
    );
  });
}
