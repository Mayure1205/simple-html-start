import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const isAuth = sessionStorage.getItem("redact_auth");
    if (!isAuth) {
      navigate("/login");
    }
  }, [navigate]);

  return null;
};

export default Index;
