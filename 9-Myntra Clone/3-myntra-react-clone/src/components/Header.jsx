import { BsFillPersonFill } from "react-icons/bs";
import { FaFaceGrinHearts, FaBagShopping } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState } from "react";
import AuthForm from "./AuthForm";

const Header = () => {
  const bag = useSelector((store) => store.bag);
  const [showAuth, setShowAuth] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  const user = JSON.parse(localStorage.getItem("user")) || {};

  return (
    <>
      <header>
        <div className="logo_container">
          <Link to="/">
            <img
              className="myntra_home"
              src="images/myntra_logo.webp"
              alt="Myntra Home"
            />
          </Link>
        </div>

        <nav className="nav_bar">
          <a href="#">Men</a>
          <a href="#">Women</a>
          <a href="#">Kids</a>
          <a href="#">Home & Living</a>
          <a href="#">Beauty</a>
          <a href="#">
            Studio <sup>New</sup>
          </a>
        </nav>

        <div className="search_bar">
          <span className="material-symbols-outlined search_icon">search</span>
          <input
            className="search_input"
            placeholder="Search for products, brands and more"
          />
        </div>

        <div className="action_bar">
          {/* Profile */}
          <div
            className="action_container"
            onClick={() => {
              if (!isLoggedIn) {
                setShowAuth(true);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <BsFillPersonFill />
            <span className="action_name">
              {isLoggedIn ? user.username : "Profile"}
            </span>
          </div>

          {/* Logout */}
          {isLoggedIn && (
            <div
              className="action_container"
              onClick={() => {
                localStorage.removeItem("isLoggedIn");
                setIsLoggedIn(false);
                alert("Logged out");
              }}
              style={{ cursor: "pointer" }}
            >
              <BsFillPersonFill />
              <span className="action_name">Logout</span>
            </div>
          )}

          {/* Wishlist */}
          <div className="action_container">
            <FaFaceGrinHearts />
            <span className="action_name">Wishlist</span>
          </div>

          {/* Bag */}
          <Link className="action_container" to="/bag">
            <FaBagShopping />
            <span className="action_name">Bag</span>
            <span className="bag-item-count">{bag.length}</span>
          </Link>
        </div>
      </header>

      {/* Auth Modal */}
      {showAuth && (
        <div className="auth-overlay">
          <div className="auth-modal-content">
            <AuthForm
              onClose={() => {
                setShowAuth(false);
                setIsLoggedIn(true);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Header;