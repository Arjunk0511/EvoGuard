import React, { useState } from "react";

const AuthForm = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: "", password: "" });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isLogin) {
      // 🔐 Fake Login Logic
      const storedUser = JSON.parse(localStorage.getItem("user"));

      if (
        storedUser &&
        storedUser.username === formData.username &&
        storedUser.password === formData.password
      ) {
        localStorage.setItem("isLoggedIn", "true");
        alert("Login Successful ✅");
        onClose();
      } else {
        alert("Invalid Credentials ❌");
      }
    } else {
      // 📝 Fake Signup Logic
      localStorage.setItem("user", JSON.stringify(formData));
      alert("Signup Successful ✅ Please Login");
      setIsLogin(true);
    }
  };

  return (
    <div className="myntra-auth-container">
      <div className="myntra-auth-box">
        {/* ❌ Close Button */}
        <span className="auth-close" onClick={onClose}>
          ×
        </span>

        <h2 className="auth-title">{isLogin ? "Login" : "Sign Up"}</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            className="auth-input"
            onChange={handleInputChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="auth-input"
            onChange={handleInputChange}
            required
          />

          <button type="submit" className="auth-btn">
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "New here?" : "Already have an account?"}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? " Sign Up" : " Login"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
