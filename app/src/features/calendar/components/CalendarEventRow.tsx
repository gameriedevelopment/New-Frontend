import { ArrowUpRight, MapPin } from "lucide-react";
import type { CalendarEvent } from "../types";
import { eventTypeLabels, formatEventTime, sourceLabels, statusLabels } from "../utils";

export function CalendarEventRow({
  event,
  onOpen,
  timeZone,
}: {
  event: CalendarEvent;
  onOpen: () => void;
  timeZone: string;
}) {
  const start = new Date(event.startTime);
  return (
    <button
      className="calendar-event-row"
      type="button"
      data-source={event.sourceType}
      onClick={onOpen}
    >
      <time dateTime={event.startTime}>
        <strong>
          {new Intl.DateTimeFormat(undefined, {
            timeZone,
            hour: "numeric",
            minute: "2-digit",
          }).format(start)}
        </strong>
      </time>
      <i aria-hidden="true" />
      <div className="calendar-event-row__body">
        <span>
          {sourceLabels[event.sourceType]} · {eventTypeLabels[event.type] || event.type}
          <em> · {statusLabels[event.status]}</em>
        </span>
        <strong>{event.title}</strong>
        <small>
          {formatEventTime(event, timeZone)}
          {event.location ? (
            <>
              <b> · </b>
              <MapPin size={11} />
              {event.location}
            </>
          ) : null}
        </small>
      </div>
      <div className="calendar-event-row__aside">
        <span data-status={event.status}>{statusLabels[event.status]}</span>
        <ArrowUpRight size={15} aria-hidden="true" />
      </div>
    </button>
  );
}
