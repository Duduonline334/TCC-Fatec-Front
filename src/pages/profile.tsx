import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/conection";
type Profile = { name: string; email: string; tellphone: string };
export default function ProfilePage() {
  const [p, set] = useState<Profile>(),
    [msg, status] = useState("Carregando perfil…"),
    navigate = useNavigate();
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    const c = new AbortController();
    api
      .get<Profile>("/perfil", { signal: c.signal })
      .then((r) => {
        set(r.data);
        status("");
      })
      .catch(() => {
        if (!c.signal.aborted) status("Não foi possível carregar o perfil.");
      });
    return () => c.abort();
  }, [navigate]);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await api.patch(
        "/perfil",
        Object.fromEntries(new FormData(e.currentTarget)),
      );
      status("Perfil atualizado.");
    } catch {
      status("Não foi possível salvar. Confira os dados.");
    }
  }
  return (
    <><header className="account-bar"><strong>Monitoramento ambiental</strong>
      <Link to="/sensor">Voltar ao painel</Link>
      </header><main className="auth"><span className="avatar" aria-hidden="true"/><h1>Meu perfil</h1>
      {p && (
        <form onSubmit={save}>
          <label>
            Nome
            <input name="name" required defaultValue={p.name} />
          </label>
          <label>
            E-mail para alertas
            <input name="email" type="email" required defaultValue={p.email} />
          </label>
          <label>
            Telefone com DDI
            <input
              name="tellphone"
              type="tel"
              required
              defaultValue={p.tellphone}
            />
          </label>
          <button>Salvar perfil</button>
        </form>
      )}
      <p role="status">{msg}</p>
    </main></>
  );
}
