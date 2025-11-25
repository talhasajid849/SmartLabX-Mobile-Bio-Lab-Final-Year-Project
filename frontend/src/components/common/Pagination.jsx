import React from 'react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const buttonStyle = {
    padding: "10px 18px",
    background: "linear-gradient(135deg, #4e9eff, #3577ff)",
    color: "white",
    border: "none",
    borderRadius: "30px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    boxShadow: "0 4px 12px rgba(53, 119, 255, 0.25)",
    transition: "all 0.2s ease",
  };

  const disabledStyle = {
    background: "linear-gradient(135deg, #c6d9ff, #aac4ff)",
    opacity: 0.6,
    cursor: "not-allowed",
    boxShadow: "none",
  };

  const containerStyle = {
    display: "flex",
    gap: "14px",
    marginTop: "25px",
    alignItems: "center",
    justifyContent: "center",
  };

  const textStyle = {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #eaf1ff, #dce7ff)",
    borderRadius: "25px",
    fontSize: "14px",
    border: "1px solid #bfd2ff",
    color: "#2f54a3",
    fontWeight: 500,
    boxShadow: "0 2px 8px rgba(53, 119, 255, 0.15)",
  };

  return (
    <div style={containerStyle}>
      
      {/* Previous Button */}
      <button
        onClick={handlePrev}
        disabled={currentPage === 1}
        style={{
          ...buttonStyle,
          ...(currentPage === 1 ? disabledStyle : {}),
        }}
        onMouseEnter={(e) => {
          if (currentPage !== 1)
            e.target.style.boxShadow = "0 6px 18px rgba(53, 119, 255, 0.35)";
        }}
        onMouseLeave={(e) => {
          if (currentPage !== 1)
            e.target.style.boxShadow = "0 4px 12px rgba(53, 119, 255, 0.25)";
        }}
      >
        ⬅ Previous
      </button>

      {/* Page Display */}
      <span style={textStyle}>
        Page <b>{currentPage}</b> of <b>{totalPages}</b>
      </span>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        style={{
          ...buttonStyle,
          ...(currentPage === totalPages ? disabledStyle : {}),
        }}
        onMouseEnter={(e) => {
          if (currentPage !== totalPages)
            e.target.style.boxShadow = "0 6px 18px rgba(53, 119, 255, 0.35)";
        }}
        onMouseLeave={(e) => {
          if (currentPage !== totalPages)
            e.target.style.boxShadow = "0 4px 12px rgba(53, 119, 255, 0.25)";
        }}
      >
        Next ➡
      </button>

    </div>
  );
}
