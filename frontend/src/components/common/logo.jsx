// Logo.jsx
'use client';

import React from "react";

export default function Logo() {
  return (
    <>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&display=swap');

        .logoContainer {
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          user-select: none;
        }

        .iconWrapper {
          position: relative;
          width: 55px;
          height: 55px;
          border-radius: 50%;
          background-color: #1e3ea0;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: visible;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .iconWrapper:hover {
          transform: scale(1.1);
          box-shadow: 0 0 20px rgba(14, 165, 233, 0.6);
        }

        .icon {
          font-size: 28px;
          color: #fff;
          z-index: 2;
        }

        .ripple {
          position: absolute;
          width: 55px;
          height: 55px;
          border: 2px solid #1e3ea0;
          border-radius: 50%;
          top: 0;
          left: 0;
          animation: ripple 2s infinite;
          z-index: 1;
        }

        .logoText {
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: 21px;
          color: #0f172a;
          letter-spacing: 1px;
          transition: color 0.3s ease;
        }

        .logoText:hover {
          color: #1e3ea0;
        }

        @keyframes ripple {
          0% {
            transform: scale(0.6);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.3;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
      `}</style>

      <div className="logoContainer">
        <div className="iconWrapper">
          <span className="icon">🔬</span>
          <div className="ripple"></div>
        </div>
        <span className="logoText">Mobile Bio Lab</span>
      </div>
    </>
  );
}
