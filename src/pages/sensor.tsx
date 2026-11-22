import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/conection";
import Reading, { type DecimalValue } from "../components/reading";
type Sensor = {
  id: number;
  name: string;
  location: string;
  last_seen: string | null;
  alert_reading_id: number | null;
  alert_summary: string | null;
  alert_ack_at: string | null;
  temp_high: boolean;
  humidity_high: boolean;
  connection: "online" | "waiting" | "silent";
  last_value_temp: DecimalValue;
  last_value_umid: DecimalValue;
  temp_min: DecimalValue;
  temp_max: DecimalValue;
  umid_min: DecimalValue;
  umid_max: DecimalValue;
};
type Sample = {
  id: number;
  date: string;
  value_temp: string;
  value_umid: string;
};
const limits = {
  temp_min: "Temperatura mínima (°C)",
  temp_max: "Temperatura máxima (°C)",
  umid_min: "Umidade mínima (%)",
  umid_max: "Umidade máxima (%)",
} as const;
function Chart({
  rows,
  field,
  label,
}: {
  rows: Sample[];
  field: "value_temp" | "value_umid";
  label: string;
}) {
  const values = rows.map((r) => Number(r[field])).reverse(),
    lo = Math.min(...values),
    hi = Math.max(...values);
  const points = values.map((v, i) => [
    4 + (292 * i) / Math.max(1, values.length - 1),
    hi === lo ? 40 : 76 - (72 * (v - lo)) / (hi - lo),
  ]);
  return (
    <figure className={field === "value_temp" ? "temperature" : "humidity"}>
      <figcaption>
        {label} · {lo.toLocaleString("pt-BR")} a {hi.toLocaleString("pt-BR")}
      </figcaption>
      <svg
        viewBox="0 0 300 80"
        role="img"
        aria-label={label + " por ordem de coleta"}
      >
        <polyline
          points={points.map((p) => p.join(",")).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx={points.at(-1)?.[0]} cy={points.at(-1)?.[1]} r="3" />
      </svg>
    </figure>
  );
}
function Detail({ sensor: s, onSave }: { sensor: Sensor; onSave: () => void }) {
  const [ackBusy, setAckBusy] = useState(false);
  const [ackError, setAckError] = useState("");
  async function acknowledge() {
    setAckBusy(true);
    setAckError("");
    try {
      await api.post(
        "/sensor/" + s.id + "/alerts/" + s.alert_reading_id + "/ack",
      );
      onSave();
    } catch {
      setAckError(
        "Não foi possível confirmar este alerta. Confira se há um alerta mais recente e tente novamente.",
      );
    } finally {
      setAckBusy(false);
    }
  }
  const [rows, setRows] = useState<Sample[]>([]),
    [historyMsg, setHistoryMsg] = useState("Carregando histórico…"),
    [message, setMessage] = useState("");
  useEffect(() => {
    const c = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const r = await api.get<Sample[]>("/sensor/" + s.id + "/history", {
          signal: c.signal,
        });
        if (!c.signal.aborted) {
          setRows(r.data);
          setHistoryMsg(r.data.length ? "" : "Ainda não há medições.");
        }
      } catch {
        if (!c.signal.aborted)
          setHistoryMsg("Não foi possível atualizar o histórico.");
      }
      if (!c.signal.aborted) timer = setTimeout(poll, 5000);
    }
    void poll();
    return () => {
      c.abort();
      clearTimeout(timer);
    };
  }, [s.id]);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.patch("/sensor/config/" + s.id, {
        name: f.get("name"),
        location: f.get("location"),
        ...Object.fromEntries(
          Object.keys(limits).map((k) => [k, Number(f.get(k))]),
        ),
      });
      setMessage("Configuração salva.");
      onSave();
    } catch {
      setMessage(
        "Falha ao salvar. Confira se cada mínimo é menor ou igual ao máximo.",
      );
    }
  }
  return (
    <>
      {s.alert_reading_id != null && (
          <section className="alert-card" aria-label="Confirmação de alerta">
            <h2>
              {s.alert_ack_at
                ? "Alerta confirmado"
                : "Alerta de máximo excedido"}
            </h2>
            <p style={{ whiteSpace: "pre-line" }}>{s.alert_summary}</p>
            {s.alert_ack_at ? (
              <p>
                Ciência registrada em{" "}
                {new Date(s.alert_ack_at).toLocaleString("pt-BR")}.
              </p>
            ) : (
              <>
                <p>
                  Confirme a leitura para interromper os e-mails enviados a cada
                  3 minutos.
                </p>
                <button disabled={ackBusy} onClick={acknowledge}>
                  Estou ciente
                </button>
              </>
            )}
            {ackError && <p role="alert">{ackError}</p>}
          </section>
        )}
      <div className="grid">
        <Reading
          label="Temperatura"
          unit="°C"
          value={s.last_value_temp}
          min={s.temp_min}
          max={s.temp_max}
        />
        <Reading
          label="Umidade relativa"
          unit="%"
          value={s.last_value_umid}
          min={s.umid_min}
          max={s.umid_max}
        />
      </div>
      <section>
        <h2>Histórico recente</h2>
        <p>
          Últimas 120 medições ·{" "}
          {rows[0]?.date
            ? "Última coleta: " + new Date(rows[0].date).toLocaleString("pt-BR")
            : "Aguardando primeira coleta"}
        </p>
        <p role="status">{historyMsg}</p>
        {!!rows.length && (
          <>
            <div className="grid">
              <Chart rows={rows} field="value_temp" label="Temperatura (°C)" />
              <Chart rows={rows} field="value_umid" label="Umidade (%)" />
            </div>
            <details>
              <summary>Ver medições</summary>
              <div className="scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Data e hora</th>
                      <th>°C</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td>{new Date(r.date).toLocaleString("pt-BR")}</td>
                        <td>{r.value_temp}</td>
                        <td>{r.value_umid}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </section>
      <section>
        <details>
          <summary>Configurar sensor e limites</summary>
          <form className="settings" onSubmit={save}>
            <label>
              Nome
              <input
                name="name"
                required
                maxLength={100}
                defaultValue={s.name}
              />
            </label>
            <label>
              Local de instalação
              <input
                name="location"
                maxLength={100}
                placeholder="Ex.: Sala de aula"
                defaultValue={s.location}
              />
            </label>
            {(["temp","umid"] as const).map(group => (<fieldset key={group}><legend>{group === "temp" ? "Temperatura" : "Umidade"}</legend>{(Object.keys(limits) as (keyof typeof limits)[]).filter(k => k.startsWith(group)).map((k) => (
              <label key={k}>
                {k.endsWith("min") ? "Mínimo" : "Máximo"} ({group === "temp" ? "°C" : "%"})
                <input
                  type="number"
                  name={k}
                  step="any"
                  min={k.startsWith("umid") ? 0 : undefined}
                  max={k.startsWith("umid") ? 100 : undefined}
                  required
                  defaultValue={s[k] ?? ""}
                />
              </label>
            ))}
            </fieldset>))}
            <button>Salvar configuração</button>
          </form>
          <p role="status">{message}</p>
        </details>
      </section>
    </>
  );
}
export default function Dashboard() {
  const navigate = useNavigate(),
    [sensors, setSensors] = useState<Sensor[]>([]),
    [stale, setStale] = useState(false),
    [selected, select] = useState<number>(),
    [version, reload] = useState(0),
    [message, setMessage] = useState("Carregando sensores…"),
    [pairMsg, pairMessage] = useState("");
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }
    const c = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const r = await api.get<Sensor[]>("/sensor", { signal: c.signal });
        if (!c.signal.aborted) {
          setStale(false);
          setSensors(r.data);
          setMessage(
            r.data.length
              ? ""
              : "Nenhum sensor vinculado. Informe o código mostrado pelo dispositivo.",
          );
        }
      } catch {
        if (!c.signal.aborted) {
          setStale(true);
          let reason = navigator.onLine
            ? "Não foi possível alcançar a API."
            : "Navegador sem rede.";
          if (navigator.onLine) {
            try {
              await api.get("/health", { signal: c.signal });
              reason = "A API responde, mas a consulta dos sensores falhou.";
            } catch (error) {
              if (
                isAxiosError(error) &&
                error.response?.data?.database === "unavailable"
              )
                reason = "A API responde, mas não conseguiu consultar o banco.";
            }
          }
          if (!c.signal.aborted)
            setMessage(
              reason + " Os dados exibidos são da última atualização.",
            );
        }
      }
      if (!c.signal.aborted) timer = setTimeout(poll, 5000);
    }
    void poll();
    return () => {
      c.abort();
      clearTimeout(timer);
    };
  }, [navigate, version]);
  useEffect(() => {
    const offline = () => {
      setStale(true);
      setMessage(
        "Navegador sem rede. Os dados exibidos são da última atualização.",
      );
    };
    const online = () => reload((v) => v + 1);
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    return () => {
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
    };
  }, []);
  const current = sensors.find((s) => s.id === selected) ?? sensors[0];
  async function pair(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    try {
      const r = await api.post("/sensor/config", {
        sensorCode: String(new FormData(form).get("code")).trim(),
      });
      form.reset();
      select(r.data.id);
      reload((v) => v + 1);
      pairMessage("Sensor vinculado.");
    } catch {
      pairMessage("Não foi possível vincular. Confira o código no ESP32.");
    }
  }
  return (
    <main className="dashboard">
      <header>
        <div>
          <small>MONITORAMENTO AMBIENTAL</small>
          <h1>Painel de sensores</h1>
        </div>
        <Link to="/perfil">Meu perfil</Link>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/login", { replace: true });
          }}
        >
          Sair
        </button>
      </header>
      {message && <p role="status">{message}</p>}
      {current && (
        <>
          <label>
            Sensor selecionado
            <select
              value={current.id}
              onChange={(e) => select(Number(e.target.value))}
            >
              {sensors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.location || "Local não informado"} · {s.id}
                </option>
              ))}
            </select>
          </label>
          {(stale || current.connection === "silent") && (
            <p role="alert">
              Sem atualização confirmada. Os valores abaixo são os últimos
              recebidos.
            </p>
          )}
          <Detail
            key={current.id}
            sensor={current}
            onSave={() => reload((v) => v + 1)}
          />
          <section aria-label="Estado dos sensores">
            <h2>Meus sensores</h2>
            <ul>
              {sensors.map((s) => (
                <li key={s.id}>
                  <strong>{s.name}</strong>
                  {s.alert_reading_id && !s.alert_ack_at
                    ? " · Alerta aguardando confirmação"
                    : ""}{" "}
                  · {s.location || "Local não informado"} · #{s.id} —{" "}
                  <b className="connection" data-state={stale ? "unknown" : s.connection}>
                    {stale
                      ? "Estado desconhecido"
                      : s.connection === "online"
                        ? "Conectado"
                        : s.connection === "silent"
                          ? "Sem sinal"
                          : "Aguardando primeira leitura"}
                  </b>
                  <br />
                  <small>
                    {s.last_seen
                      ? "Última leitura: " +
                        new Date(s.last_seen).toLocaleString("pt-BR")
                      : "Nenhuma leitura recebida"}
                  </small>
                </li>
              ))}
            </ul>
          </section>

        </>
      )}
      <section>
        <h2>Vincular dispositivo</h2>
        <form onSubmit={pair}>
          <label>
            Código de pareamento
            <input name="code" required autoComplete="off" />
          </label>
          <button>Vincular sensor</button>
        </form>
        <p role="status">{pairMsg}</p>
      </section>
    </main>
  );
}
