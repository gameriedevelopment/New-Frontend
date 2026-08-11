import { ArrowUpRight, CalendarDays, Clock3, MapPin, Trophy, Users } from "lucide-react";
import { SafeImage } from "../../../components/ui";
import type { Tournament } from "../types";
import {
  formatPrize,
  formatTournamentDate,
  getTournamentTiming,
  safeTournamentUrl,
  tournamentRequirements,
} from "../utils";

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  const timing = getTournamentTiming(tournament);
  const requirements = tournamentRequirements(tournament);
  const registrationUrl = safeTournamentUrl(tournament.platformUrl);
  const capacityKnown = Boolean(tournament.maxTeams);
  const currentTeams = Math.max(0, tournament.currentTeams ?? 0);
  const maxTeams = Math.max(0, tournament.maxTeams ?? 0);
  const capacity = maxTeams ? Math.min(100, Math.round((currentTeams / maxTeams) * 100)) : 0;

  return (
    <article className="tournament-card" data-registration={timing.registration}>
      <div className="tournament-card__media">
        <SafeImage src={tournament.image} fallback="/profile-cover-fallback.jpg" alt="" />
        <span className="tournament-card__status">
          <i />
          {timing.registrationLabel}
        </span>
        <span className="tournament-card__game">{tournament.game}</span>
      </div>
      <div className="tournament-card__body">
        <header>
          <div>
            <p>{tournament.organizer || tournament.platform || "Tournament organizer"}</p>
            <h2>{tournament.name}</h2>
          </div>
          <strong>
            <Trophy size={14} />
            {formatPrize(tournament.prizePool)}
            <small>Prize pool</small>
          </strong>
        </header>
        {tournament.description ? (
          <p className="tournament-card__description">{tournament.description}</p>
        ) : null}
        <dl className="tournament-card__schedule">
          <div>
            <dt>
              <CalendarDays size={14} />
              Starts
            </dt>
            <dd>
              <time dateTime={tournament.startDate}>
                {formatTournamentDate(tournament.startDate, true)}
              </time>
            </dd>
          </div>
          <div>
            <dt>
              <Clock3 size={14} />
              Register by
            </dt>
            <dd>
              {tournament.registrationDeadline ? (
                <time dateTime={tournament.registrationDeadline}>
                  {formatTournamentDate(tournament.registrationDeadline, true)}
                </time>
              ) : (
                "No deadline supplied"
              )}
            </dd>
          </div>
        </dl>
        <div className="tournament-card__requirements" aria-label="Entry requirements">
          <span>{tournament.platform || "Any platform"}</span>
          {requirements.map((requirement) => (
            <span key={requirement}>{requirement}</span>
          ))}
          {tournament.format ? <span>{tournament.format}</span> : null}
        </div>
        <footer>
          <div className="tournament-card__capacity">
            <span>
              <Users size={14} />
              {capacityKnown
                ? `${currentTeams} of ${maxTeams} teams`
                : tournament.totalParticipants
                  ? `${tournament.totalParticipants} participants`
                  : "Capacity not listed"}
            </span>
            {capacityKnown ? (
              <i aria-hidden="true">
                <b style={{ width: `${capacity}%` }} />
              </i>
            ) : null}
          </div>
          {registrationUrl ? (
            <a href={registrationUrl} target="_blank" rel="noreferrer">
              {timing.registration === "open" || timing.registration === "closing"
                ? "View registration"
                : "View tournament"}
              <ArrowUpRight size={14} />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <span className="tournament-card__unavailable">
              <MapPin size={13} />
              Registration link unavailable
            </span>
          )}
        </footer>
      </div>
    </article>
  );
}
