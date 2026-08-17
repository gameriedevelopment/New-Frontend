import { Award, ShieldCheck } from "lucide-react";
import { SafeImage } from "../../../components/ui";
import type { PlayerCardModel } from "../playerCard";

export function PlayerCard({ model }: { model: PlayerCardModel }) {
  return (
    <article className="player-card" aria-label={`${model.username}'s Gamerie player card`}>
      <header className="player-card__brand">
        <span>Gamerie</span>
        <small>Player card</small>
      </header>
      <div className="player-card__identity">
        <SafeImage src={model.profileImage} alt="" loading="eager" />
        <div>
          <p>
            Player identity
            {model.gamerieId ? <span>{model.gamerieId}</span> : null}
          </p>
          <h1>{model.username}</h1>
          <strong>{model.title}</strong>
        </div>
      </div>
      <div className="player-card__context">
        <div>
          <span>Game on profile</span>
          <strong>{model.game?.name || "Not shared"}</strong>
          {model.game?.identity ? <small>{model.game.identity}</small> : null}
        </div>
        <div>
          <span>Standing</span>
          <strong>{model.game?.standing || "Not recorded"}</strong>
          {model.region ? <small>{model.region}</small> : null}
        </div>
      </div>
      <section className="player-card__stats" aria-labelledby="card-stat-heading">
        <div className="player-card__section-heading">
          <span id="card-stat-heading">Recorded highlights</span>
          <small>Available data only</small>
        </div>
        {model.stats.length ? (
          <div>
            {model.stats.map((stat) => (
              <article key={stat.key} data-tone={stat.tone}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
                <small>{stat.context}</small>
              </article>
            ))}
          </div>
        ) : (
          <p>No competitive statistics have been recorded yet.</p>
        )}
      </section>
      <section className="player-card__strengths" aria-labelledby="card-strength-heading">
        <div className="player-card__section-heading">
          <span id="card-strength-heading">Identity signals</span>
          <small>Provenance shown</small>
        </div>
        {model.strengths.length ? (
          <div>
            {model.strengths.map((strength) => (
              <article key={strength.name}>
                <span className="player-card__strength-mark">
                  {strength.endorsementCount ? <ShieldCheck size={15} /> : <Award size={15} />}
                </span>
                <div>
                  <strong>{strength.name}</strong>
                  <small>
                    {strength.provenance}
                    {strength.endorsementCount
                      ? ` · ${strength.endorsementCount} ${strength.endorsementCount === 1 ? "endorsement" : "endorsements"}`
                      : ""}
                  </small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>No player strengths have been shared yet.</p>
        )}
      </section>
      <footer>
        <span>gamerie.gg</span>
        <small>Identity · community · competition</small>
      </footer>
    </article>
  );
}
