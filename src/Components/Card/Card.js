import React from "react";
import "./Card.css";
import Urgent from "../../Assets/Images/SVG - Urgent Priority colour.svg";
import High from "../../Assets/Images/Img - High Priority.svg";
import Medium from "../../Assets/Images/Img - Medium Priority.svg";
import Low from "../../Assets/Images/Img - Low Priority.svg";
import NoPriority from "../../Assets/Images/No-priority.svg";

export default function Card({ cardDetails }) {
  const { id, title, userObj, priority, tag } = cardDetails;
  const { name, available } = userObj;
  return (
    <>
      <div className="card-container">
        <div className="card-id-wrapper">
          <div className="card-id">{id}</div>
          <div className="card-profile">
            <div className="card-profile-initial">
              {name[0]}
              {name[1]}
            </div>
            <div
              className={
                available
                  ? "card-profile-initial-available card-profile-initial-available-true"
                  : "card-profile-initial-available"
              }
            ></div>
          </div>
        </div>
        <div className="card-title">{title}</div>
        <div className="card-tag">
          {
            {
              0: (
                <div className="card-tag-icon">
                  <img src={NoPriority} alt="icon" />
                </div>
              ),
              1: (
                <div className="card-tag-icon">
                  <img src={Low} alt="icon" />
                </div>
              ),
              2: (
                <div className="card-tag-icon">
                  <img src={Medium} alt="icon" />
                </div>
              ),
              3: (
                <div className="card-tag-icon">
                  <img src={High} alt="icon" />
                </div>
              ),
              4: (
                <div className="card-tag-icon">
                  <img src={Urgent} alt="icon" />
                </div>
              ),
            }[priority]
          }

          {tag.map((tagItem) => {
            return (
              <div className="card-tag-box">
                <div className="card-tag-title">{tagItem}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
