import type { CalendarEvent } from "../types";
import { dayKey, monthCells } from "../utils";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarMonth({
  events,
  month,
  onOpenEvent,
  onSelectDay,
  selectedDay,
  timeZone,
}: {
  events: CalendarEvent[];
  month: string;
  onOpenEvent: (event: CalendarEvent) => void;
  onSelectDay: (day: string) => void;
  selectedDay: string;
  timeZone: string;
}) {
  const cells = monthCells(month);
  const grouped = events.reduce<Record<string, CalendarEvent[]>>((result, event) => {
    const key = dayKey(event.startTime, timeZone);
    (result[key] ||= []).push(event);
    return result;
  }, {});
  const today = dayKey(new Date(), timeZone);
  return (
    <div
      className="calendar-month"
      role="grid"
      aria-label={new Date(`${month}-02T12:00:00Z`).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
        timeZone,
      })}
    >
      <div className="calendar-month__weekdays" role="row">
        {weekdays.map((day) => (
          <span role="columnheader" key={day}>
            {day}
          </span>
        ))}
      </div>
      <div className="calendar-month__days">
        {cells.map((key) => {
          const dayEvents = grouped[key] || [];
          const outside = !key.startsWith(month);
          return (
            <div
              role="gridcell"
              key={key}
              aria-selected={selectedDay === key}
              data-outside={outside}
              data-today={today === key}
            >
              <button
                type="button"
                onClick={() => onSelectDay(key)}
                aria-label={`${new Date(`${key}T12:00:00Z`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}${dayEvents.length ? `, ${dayEvents.length} events` : ""}`}
              >
                <span>{Number(key.slice(-2))}</span>
                {dayEvents.length ? (
                  <i>
                    {dayEvents.slice(0, 3).map((event) => (
                      <b key={event.id} data-source={event.sourceType} />
                    ))}
                    {dayEvents.length > 3 ? <small>+{dayEvents.length - 3}</small> : null}
                  </i>
                ) : null}
              </button>
              <div className="calendar-month__event-list">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    type="button"
                    data-source={event.sourceType}
                    key={event.id}
                    onClick={() => onOpenEvent(event)}
                  >
                    <time>
                      {new Intl.DateTimeFormat(undefined, {
                        timeZone,
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(new Date(event.startTime))}
                    </time>
                    <span>{event.title}</span>
                  </button>
                ))}
                {dayEvents.length > 3 ? (
                  <button type="button" onClick={() => onSelectDay(key)}>
                    +{dayEvents.length - 3} more
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
