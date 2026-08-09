import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

export default function EmojiPickerPanel({ onSelect }: { onSelect: (emoji: string) => void }) {
  return <Picker data={data} theme="dark" previewPosition="none" skinTonePosition="none" onEmojiSelect={(emoji: { native: string }) => onSelect(emoji.native)} />;
}
