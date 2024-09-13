import React, { useState } from "react";
import filterIcon from "../../Assets/Images/Display.svg";
import downIcon from "../../Assets/Images/down.svg";
import "./Navbar.css";

export default function Navbar({
  groupValue,
  orderValue,
  handleGroupValue,
  handleOrderValue,
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const toggleGrouping = (e) => {
    setIsFilterOpen(!isFilterOpen);
    if (e.target.value) {
      handleGroupValue(e.target.value);
    }
  };

  const toggleOrdering = (e) => {
    setIsFilterOpen(!isFilterOpen);
    if (e.target.value) {
      handleOrderValue(e.target.value);
    }
  };

  return (
    <>
      <section className="nav">
        <div className="nav-container">
          <div>
            <div className="nav-disp-btn" onClick={toggleGrouping}>
              <div className="nav-disp-icon nav-disp-filter">
                <img src={filterIcon} alt="icon" />
              </div>
              <div className="nav-disp-heading">Display</div>
              <div className="nav-disp-icon nav-disp-drop">
                <img src={downIcon} alt="icon" />
              </div>
            </div>
            <div
              className={
                isFilterOpen
                  ? "nav-disp-dropdown nav-disp-dropdown-show"
                  : "nav-disp-dropdown"
              }
            >
              <div className="nav-disp-filters">
                <div className="nav-dropdown-category">Grouping</div>
                <div className="nav-dropdown-selector">
                  <select
                    value={groupValue}
                    onChange={toggleGrouping}
                    className="nav-selector"
                    name="grouping"
                  >
                    <option value="status">Status</option>
                    <option value="user">User</option>
                    <option value="priority">Priority</option>
                  </select>
                </div>
              </div>
              <div className="nav-disp-filters">
                <div className="nav-dropdown-category">Ordering</div>
                <div className="nav-dropdown-selector">
                  <select
                    value={orderValue}
                    onChange={toggleOrdering}
                    className="nav-selector"
                    name="ordering"
                  >
                    <option value="priority">Priority</option>
                    <option value="title">Title</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
