import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "./services/conection";

export default function App() {
  const signup = useLocation().pathname === "/cadastro",
    navigate = useNavigate();
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fields = Object.fromEntries(new FormData(e.currentTarget));
    setMessage("");
    setBusy(true);
    try {
      if (signup) {
        await api.post("/cadastro", fields);
        navigate("/login");
        setMessage("Conta criada. Entre para vincular seu sensor.");
      } else {
        const { data } = await api.post("/auth", fields);
        localStorage.setItem("token", data.access_token);
        navigate("/sensor");
      }
    } catch {
      setMessage(
        signup
          ? "Não foi possível cadastrar. Confira os dados, o telefone com DDI e se já existe uma conta."
          : "Não foi possível entrar. Confira seus dados e a conexão.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <><header className="account-bar"><strong>Monitoramento ambiental</strong><Link onClick={() => setMessage("")} to={signup ? "/login" : "/cadastro"}>{signup ? "Entrar" : "Cadastrar"}</Link></header><main className="auth">
      <span className="avatar" aria-hidden="true" />
      <h1>{signup ? "Criar conta" : "Entrar no painel"}</h1>
      <form key={String(signup)} onSubmit={submit}>
        {signup && (
          <label>
            Nome
            <input
              name="name"
              minLength={2}
              maxLength={100}
              autoComplete="name"
              required
            />
          </label>
        )}
        <label>
          E-mail
          <input name="email" type="email" autoComplete="email" required />
        </label>
        {signup && (
          <label>
            Telefone com DDI
            <input
              name="tellphone"
              type="tel"
              placeholder="+55 11 99999-9999"
              required
            />
          </label>
        )}
        <label>
          Senha
          <input
            name="password"
            type="password"
            minLength={signup ? 8 : 1}
            autoComplete={signup ? "new-password" : "current-password"}
            required
          />
        </label>
        <button disabled={busy}>{signup ? "Cadastrar" : "Entrar"}</button>
      </form>
      <p role="status">{message}</p>
    </main></>
  );
}
