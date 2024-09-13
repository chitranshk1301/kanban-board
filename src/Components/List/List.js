import React, { useState, useEffect } from "react";
import "./List.css";
import Card from "../Card/Card";
import Backlog from "../../Assets/Images/Backlog.svg";
import Todo from "../../Assets/Images/To-do.svg";
import inProgressIcon from "../../Assets/Images/in-progress.svg";
import Done from "../../Assets/Images/Done.svg";
import Urgent from "../../Assets/Images/SVG - Urgent Priority colour.svg";
import Cancelled from "../../Assets/Images/Cancelled.svg";
import Add from "../../Assets/Images/add.svg";
import High from "../../Assets/Images/Img - High Priority.svg";
import Medium from "../../Assets/Images/Img - Medium Priority.svg";
import Low from "../../Assets/Images/Img - Low Priority.svg";
import NoPriority from "../../Assets/Images/No-priority.svg";
import threeDotMenu from "../../Assets/Images/3 dot menu.svg";

export default function List({
  groupValue,
  listTitle,
  priorityList,
  ticketDetails,
}) {
  const [countCards, setCountCards] = useState(0);

  const renderListIcon = () => {
    switch (listTitle) {
      case "Backlog":
        return <img src={Backlog} alt="icon" />;
      case "Todo":
        return <img src={Todo} alt="icon" />;
      case "In progress":
        return <img src={inProgressIcon} alt="icon" />;
      case "Done":
        return <img src={Done} alt="icon" />;
      case "Cancelled":
        return <img src={Cancelled} alt="icon" />;
      default:
        return null;
    }
  };

  const renderPriorityIcon = () => {
    switch (listTitle) {
      case 0:
        return <img src={NoPriority} alt="icon" />;
      case 1:
        return <img src={Low} alt="icon" />;
      case 2:
        return <img src={Medium} alt="icon" />;
      case 3:
        return <img src={High} alt="icon" />;
      case 4:
        return <img src={Urgent} alt="icon" />;
      default:
        return null;
    }
  };

  const getListTitle = () => {
    if (groupValue === "priority" && priorityList) {
      const priorityItem = priorityList.find(
        (priorityProperty) => priorityProperty.priority === listTitle
      );
      return priorityItem ? priorityItem.name : null;
    }
    return listTitle;
  };

  useEffect(() => {
    // Calculate the number of cards each time ticketDetails or listTitle changes
    let cardCount = 0;
    ticketDetails.forEach((ticket) => {
      let shouldRenderCard = false;
      switch (groupValue) {
        case "status":
          shouldRenderCard = ticket.status === listTitle;
          break;
        case "priority":
          shouldRenderCard = ticket.priority === listTitle;
          break;
        case "user":
          shouldRenderCard = ticket.userObj.name === listTitle;
          break;
        default:
          break;
      }

      if (shouldRenderCard) {
        cardCount++;
      }
    });
    setCountCards(cardCount);
  }, [groupValue, listTitle, ticketDetails]);

  return (
    <>
      <div className="list-container">
        <div className="list-header">
          <div className="list-header-left">
            {groupValue === "status" && (
              <div className="list-icon">{renderListIcon()}</div>
            )}
            {groupValue === "priority" && (
              <div className="card-tag-icon">{renderPriorityIcon()}</div>
            )}
            <div className="list-title">{getListTitle()}</div>
            <div className="list-sum">{countCards}</div>
          </div>
          <div className="list-header-right">
            <div className="list-add-item">
              <img src={Add} alt="icon" />
            </div>
            <div className="list-option-item">
              <img src={threeDotMenu} alt="icon" />
            </div>
          </div>
        </div>

        <div className="list-card-items">
          {ticketDetails.map((ticket) => {
            let shouldRenderCard = false;
            switch (groupValue) {
              case "status":
                shouldRenderCard = ticket.status === listTitle;
                break;
              case "priority":
                shouldRenderCard = ticket.priority === listTitle;
                break;
              case "user":
                shouldRenderCard = ticket.userObj.name === listTitle;
                break;
              default:
                break;
            }

            if (shouldRenderCard) {
              return <Card key={ticket.id} cardDetails={ticket} />;
            }
            return null;
          })}
        </div>
      </div>
    </>
  );
}