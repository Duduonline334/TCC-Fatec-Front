export type DecimalValue = number | string | null;

type ReadingProps = {
  label: string;
  unit: string;
  value: DecimalValue;
  min: DecimalValue;
  max: DecimalValue;
};

function numberFrom(value: DecimalValue) {
  if (value == null || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export default function Reading({ label, unit, value, min, max }: ReadingProps) {
  const current = numberFrom(value);
  const lower = numberFrom(min);
  const upper = numberFrom(max);
  let fraction = 0;
  if (current !== null && upper !== null && (lower === null || lower <= upper)) {
    const start = lower ?? Math.min(0, upper);
    if (current >= upper) fraction = 1;
    else if (start < upper) fraction = Math.max(0, (current - start) / (upper - start));
  }
  let status = "Sem leitura";
  if (current !== null) {
    if (lower !== null && upper !== null && lower > upper) status = "Limites inválidos";
    else if (lower !== null && current < lower) status = "Alerta abaixo do mínimo";
    else if (upper !== null && current > upper) status = "Alerta acima do máximo";
    else if (lower === null && upper === null) status = "Sem limites configurados";
    else status = "Dentro da faixa";
  }

  return (
    <section className={unit === "%" ? "reading humidity" : "reading temperature"}>
      <h2>{label}</h2>
      <div className="dial">
        <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
          <circle className="dial-track" cx="50" cy="50" r="47" />
          {[0, 1].map(sweep => (
            <path key={sweep} d={`M50 97 A47 47 0 0 ${sweep} 50 3`}
              pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - fraction} />
          ))}
        </svg>
        <p>{current === null ? "—" : current.toLocaleString("pt-BR")} <span>{unit}</span></p>
      </div>
      <strong className={status.startsWith("Alerta") || status === "Limites inválidos" ? "reading-warning" : ""} role="status">{status}</strong>
      <dl className="bounds">
        <div><dt>Mínimo</dt><dd>{lower?.toLocaleString("pt-BR") ?? "—"} {unit}</dd></div>
        <div><dt>Máximo</dt><dd>{upper?.toLocaleString("pt-BR") ?? "—"} {unit}</dd></div>
      </dl>
    </section>
  );
}
