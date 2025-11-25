"use client";
import React, { useState } from "react";
import SamplesTab from "@/components/admin/sampleTab/SamplesTab";
import dynamic from "next/dynamic";
import SampleAnalyticsTab from "@/components/admin/sampleTab/SampleAnalyticsTab";

// const SampleAnalyticsTab = dynamic(
//   () => import("@/components/admin/sampleTab/SampleAnalyticsTab.jsx"),
//   { ssr: false }
// );

export default function AdminDashboardSamples() {
  const [active, setActive] = useState(1);

  return (
    <>
      <div className="toggle-switch">
        <div
          className={`switch-indicator ${active === 2 ? "right" : "left"}`}
        />

        <button
          onClick={() => setActive(1)}
          className={`switch-btn ${active === 1 ? "active" : ""}`}
        >
          Sample Page
        </button>

        <button
          onClick={() => setActive(2)}
          className={`switch-btn ${active === 2 ? "active" : ""}`}
        >
          Sample Analytics
        </button>
      </div>

      {active === 1 && <SamplesTab />}
      {active === 2 && <SampleAnalyticsTab />}

      <style jsx>{`
        .toggle-switch {
          position: relative;
          display: flex;
          width: 320px;
          margin: 10px auto;
          background: #e5e7eb;
          border-radius: 9999px;
          padding: 4px;
        }

        .switch-btn {
          flex: 1;
          padding: 10px 0;
          border: none;
          background: transparent;
          z-index: 2;
          font-size: 15px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: color 0.2s;
        }

        .switch-btn.active {
          color: #fff;
        }

        .switch-indicator {
          position: absolute;
          top: 4px;
          left: 4px;
          width: 50%;
          height: calc(100% - 8px);
          background: #2563eb;
          border-radius: 9999px;
          transition: 0.3s;
          z-index: 1;
        }

        .switch-indicator.right {
          left: 50%;
        }
      `}</style>
    </>
  );
}
