/* eslint-disable react-hooks/exhaustive-deps */
import { useNavigate } from "react-router-dom";
import { api } from "../services/conection";
import { useEffect, useState } from "react";

function Sensor() {
  const navigate = useNavigate();
  const [temp, setTemp] = useState(0);
  const [umid, setUmid] = useState(0);
  const token = localStorage.getItem("token");

  const feachData = async () => {
    const resp = await api.get("/sensor", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return resp;
  };

  useEffect(() => {
    const validarToken = async () => {
      if (!token) navigate("/login");

      try {
        const resp = await feachData();

        if (resp.status === 403) {
          navigate("/login");
        } else {
          setTemp(resp.data[0].last_value_temp);
          setUmid(resp.data[0].last_value_umid);
        }
      } catch (error) {
        navigate("/login");
        console.log({ error });
      }
    };
    validarToken();

    const interval = setInterval(async () => {
      const resp = await feachData();

      setTemp(resp.data[0].last_value_temp);
      setUmid(resp.data[0].last_value_umid);
      console.log({ resp });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1>{temp}</h1>
      <h1>{umid}</h1>
    </div>
  );
}

export default Sensor;
