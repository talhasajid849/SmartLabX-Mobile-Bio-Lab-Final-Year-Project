"use client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "@/styles/user/analytics.module.css";

const COLORS = [
  "#667eea",
  "#764ba2",
  "#f093fb",
  "#4facfe",
  "#43e97b",
  "#fa709a",
];

export default function Charts({
  sampleTypeData,
  phData,
  temperatureData,
  salinityData,
  combinedData,
}) {
  return (
    <div className={styles.chartsGrid}>

      {sampleTypeData.length > 0 && (
        <div className={styles.chartCard}>
          <h3>Sample Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sampleTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {sampleTypeData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {phData.length > 0 && (
        <div className={styles.chartCard}>
          <h3>pH Levels Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={phData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 14]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="pH"
                stroke="#667eea"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {temperatureData.length > 0 && (
        <div className={styles.chartCard}>
          <h3>Temperature Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={temperatureData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#f093fb"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {salinityData.length > 0 && (
        <div className={styles.chartCard}>
          <h3>Salinity Measurements</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salinityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="salinity" fill="#4facfe" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {combinedData.length > 0 && (
        <div className={`${styles.chartCard} ${styles.fullWidth}`}>
          <h3>All Environmental Conditions</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              {phData.length > 0 && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="pH"
                  stroke="#667eea"
                  strokeWidth={2}
                />
              )}
              {temperatureData.length > 0 && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="temperature"
                  stroke="#f093fb"
                  strokeWidth={2}
                />
              )}
              {salinityData.length > 0 && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="salinity"
                  stroke="#4facfe"
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
