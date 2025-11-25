import { configureStore } from "@reduxjs/toolkit";
import { userReducer } from "./reducer/auth.reducer";
import { notificationReducer } from "./reducer/notification.reducer";
import { reservationReducer } from "./reducer/reservation.reducer";
import { protocolsReducer } from "./reducer/protocols.reducer";
import { samplesReducer } from "./reducer/sample.reducer";
import { reportsReducer } from "./reducer/reports.reducer";
import { activityLogsReducer } from "./reducer/activitiesLogs.reducer";

export const store = configureStore({
  reducer: {
    user: userReducer,
    notification: notificationReducer,
    reservations: reservationReducer,
    protocols: protocolsReducer,
    samples: samplesReducer,
    reports: reportsReducer,
    activityLogs: activityLogsReducer,
  },
});

export default store;
