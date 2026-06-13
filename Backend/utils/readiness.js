import mongoose from "mongoose";

export const MONGOOSE_READY_STATES = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export const getConnectionStateName = (readyState) =>
  MONGOOSE_READY_STATES[readyState] || "unknown";

export const getReadinessStatus = (connection = mongoose.connection) => {
  const mongoState = getConnectionStateName(connection?.readyState);
  const mongoReady = mongoState === "connected";

  return {
    status: mongoReady ? "ready" : "not_ready",
    ready: mongoReady,
    dependencies: {
      mongodb: {
        status: mongoReady ? "ready" : "not_ready",
        state: mongoState,
      },
    },
  };
};
