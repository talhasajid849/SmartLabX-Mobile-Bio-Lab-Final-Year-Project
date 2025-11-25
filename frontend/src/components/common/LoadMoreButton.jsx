export default function LoadMoreButton({ children = "Load More", onClick }) {
  return (
    <>
      <div className="buttonWrapper">
        <button className="magicBtn" onClick={onClick}>
          {children}
        </button>
      </div>

      <style jsx>{`
        /* Wrapper to center the button & add top border */
        .buttonWrapper {
          width: 100%;
          display: flex;
          justify-content: center;
          margin-top: 30px;
          padding-top: 25px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .magicBtn {
          padding: 14px 32px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          color: white;

          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);

          border: 1px solid rgba(255, 255, 255, 0.2);

          transition: all 0.25s ease;
          letter-spacing: 0.5px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          box-shadow: 0 0 10px rgba(30, 61, 159, 0.6);
        }

        .magicBtn:hover {
          background: rgba(0, 0, 0, 0.2);
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 12px 25px rgba(30, 61, 159, 0.4);
          border-color: rgba(30, 61, 159, 0.4);
        }

        .magicBtn:active {
          transform: scale(0.98);
          box-shadow: 0 6px 14px rgba(30, 61, 159, 0.2);
        }
      `}</style>
    </>
  );
}
