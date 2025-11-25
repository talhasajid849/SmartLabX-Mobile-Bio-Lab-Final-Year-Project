const initialState = {
  notifications: [],
  loading: false,
  error: null,
};

export const notificationReducer = (state = initialState, action) => {
  switch (action.type) {
    case "LoadNotificationRequest":
      return { ...state, loading: true };

    case "LoadNotificationSuccess":
      return { loading: false, notifications: action.payload };

    case "LoadNotificationFail":
      return { loading: false, error: action.payload };

    default:
      return state;
  }
};
