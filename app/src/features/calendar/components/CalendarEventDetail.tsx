import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Gamepad2,
  MapPin,
  Play,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { useUpdateCalendarEventStatus } from "../hooks";
import type { CalendarEvent, CalendarEventStatus } from "../types";
import {
  eventContextPath,
  eventTypeLabels,
  formatEventTime,
  sourceLabels,
  statusLabels,
} from "../utils";

export function CalendarEventDetail({
  event,
  onClose,
  timeZone,
}: {
  event: CalendarEvent;
  onClose: () => void;
  timeZone: string;
}) {
  const panel = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const update = useUpdateCalendarEventStatus();
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => close.current?.focus());
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panel.current) return;
      const nodes = [
        ...panel.current.querySelectorAll<HTMLElement>("button:not(:disabled),a[href]"),
      ];
      if (!nodes.length) return;
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
    };
  }, [onClose]);
  const contextPath = eventContextPath(event);
  const transition = async (status: CalendarEventStatus) => {
    await update.mutateAsync({ id: event.id, status });
    onClose();
  };
  const canManage =
    event.sourceType === "manual" && !["completed", "cancelled"].includes(event.status);
  return (
    <div
      className="calendar-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-detail-title"
    >
      <button
        className="calendar-sheet__scrim"
        type="button"
        aria-label="Close event details"
        onClick={onClose}
      />
      <aside ref={panel}>
        <header>
          <button className="calendar-sheet__back" type="button" onClick={onClose}>
            <ArrowLeft size={17} />
            Calendar
          </button>
          <button ref={close} type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="calendar-detail__identity" data-source={event.sourceType}>
          <span>{sourceLabels[event.sourceType]}</span>
          <h2 id="calendar-detail-title">{event.title}</h2>
          <p>{event.description || "No additional notes were added to this event."}</p>
        </div>
        <dl className="calendar-detail__facts">
          <div>
            <dt>
              <CalendarDays size={15} />
              Schedule
            </dt>
            <dd>{formatEventTime(event, timeZone)}</dd>
          </div>
          <div>
            <dt>
              <Clock3 size={15} />
              Status
            </dt>
            <dd>{statusLabels[event.status]}</dd>
          </div>
          {event.game ? (
            <div>
              <dt>
                <Gamepad2 size={15} />
                Game
              </dt>
              <dd>{event.game}</dd>
            </div>
          ) : null}
          {event.location ? (
            <div>
              <dt>
                <MapPin size={15} />
                Location
              </dt>
              <dd>{event.location}</dd>
            </div>
          ) : null}
        </dl>
        <div className="calendar-detail__meta">
          <span>{eventTypeLabels[event.type] || event.type}</span>
          <span>{timeZone.split("_").join(" ")}</span>
        </div>
        {contextPath ? (
          <Link className="calendar-context-link" to={contextPath}>
            Open {event.sourceType} <ArrowUpRight size={15} />
          </Link>
        ) : null}
        {update.isError ? (
          <p className="calendar-inline-error" role="alert">
            {getApiErrorMessage(update.error, "The event could not be updated.")}
          </p>
        ) : null}
        {canManage ? (
          <footer>
            <span>Manage this personal event</span>
            <div>
              {event.status === "pending" ? (
                <Button
                  size="small"
                  variant="secondary"
                  disabled={update.isPending}
                  onClick={() => transition("upcoming")}
                >
                  <Check size={14} />
                  Confirm
                </Button>
              ) : null}
              {event.status === "upcoming" ? (
                <Button
                  size="small"
                  variant="secondary"
                  disabled={update.isPending}
                  onClick={() => transition("ongoing")}
                >
                  <Play size={14} />
                  Start now
                </Button>
              ) : null}
              {["upcoming", "ongoing"].includes(event.status) ? (
                <Button
                  size="small"
                  variant="secondary"
                  disabled={update.isPending}
                  onClick={() => transition("completed")}
                >
                  <Check size={14} />
                  Complete
                </Button>
              ) : null}
              <Button
                size="small"
                variant="quiet"
                disabled={update.isPending}
                onClick={() => transition("cancelled")}
              >
                Cancel event
              </Button>
            </div>
          </footer>
        ) : event.sourceType !== "manual" ? (
          <p className="calendar-source-note">
            Schedule and status are managed from the {event.sourceType}.
          </p>
        ) : null}
      </aside>
    </div>
  );
}
