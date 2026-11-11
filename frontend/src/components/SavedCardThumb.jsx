import { useEffect, useState } from "react";
import { useApi } from "@/lib/api";
import { ScaledCard, useWidth } from "@/components/card/PlayerCard";
import { blankData, blankPhoto } from "@/lib/cardUtils";

export function SavedCardThumb({ card, sport, template }) {
  const api = useApi();
  const [src, setSrc] = useState("");
  const [ref, w] = useWidth(400);
  useEffect(() => {
    if (!card.thumb_at) return undefined;
    let url = "";
    api("get", `/me/cards/${card.id}/thumb`, undefined, { v: card.thumb_at }, { responseType: "blob" })
      .then((b) => { url = URL.createObjectURL(b); setSrc(url); }).catch(() => setSrc(""));
    return () => url && URL.revokeObjectURL(url);
  }, [card.id, card.thumb_at]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div ref={ref} className="w-full aspect-[5/7] rounded-lg overflow-hidden bg-muted" data-testid={`saved-card-thumb-${card.id}`}>
      {src ? <img src={src} alt={card.title || "Saved card"} className="w-full h-full object-cover protect" draggable={false} data-testid={`saved-card-image-${card.id}`} />
        : sport && template && <ScaledCard width={w} template={template} sport={sport} data={{ ...blankData(sport), ...card.data }} photo={blankPhoto} />}
    </div>
  );
}
