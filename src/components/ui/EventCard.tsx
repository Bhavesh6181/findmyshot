interface EventCardProps {
  eventName: string;
  date: string;
  photoCount: number;
  onClick: () => void;
}

export default function EventCard({
  eventName,
  date,
  photoCount,
  onClick,
}: EventCardProps) {
  return (
    <button
      onClick={onClick}
      className="
        touch-target w-full
        rounded-xl border-l-2 border-gold bg-surface
        p-4 text-left
        transition-all duration-200 ease-out
        hover:bg-surface/80
        active:scale-[0.98]
      "
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-lg text-ivory">{eventName}</h3>
        <div className="flex items-center gap-3">
          <span className="font-sans text-xs tracking-wide text-muted">
            {date}
          </span>
          <span className="h-1 w-1 rounded-full bg-faded" />
          <span className="font-sans text-xs tracking-wide text-muted">
            {photoCount.toLocaleString()} photos
          </span>
        </div>
      </div>
    </button>
  );
}
