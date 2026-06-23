import { useState } from "react";
import "./App.css";
import { api } from "./services/conection";
import { useNavigate } from "react-router-dom"; 

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  
  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    const data = {
      email,
      password,
    };

    try {
      const resp = await api.post("/auth", data);

      localStorage.setItem("token", resp.data.access_token);
      
      navigate("/sensor");
    } catch (error) {
      alert("Usuário ou senha incorretos");
      console.error("Error occurred while submitting form:", error);
    }
    
    
    

  };

  return (
    <div>
      <form onSubmit={handleSubmit} action="">
        <input
          type="text"
          placeholder="Nome"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Senha"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default App;
