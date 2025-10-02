import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../api/authApi";
import { processedDataApi } from "../api/processedDataApi";
import { anomaliesApi } from "../api/anomaliesApi";
import { forecastsApi } from "../api/forecastsApi";
import { modelsApi } from "../api/modelsApi";
import { mlApi } from "../api/mlApi";

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [processedDataApi.reducerPath]: processedDataApi.reducer,
    [anomaliesApi.reducerPath]: anomaliesApi.reducer,
    [forecastsApi.reducerPath]: forecastsApi.reducer,
    [modelsApi.reducerPath]: modelsApi.reducer,
    [mlApi.reducerPath]: mlApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault()
      .concat(authApi.middleware)
      .concat(processedDataApi.middleware)
      .concat(modelsApi.middleware)
      .concat(forecastsApi.middleware)
      .concat(anomaliesApi.middleware)
      .concat(mlApi.middleware),
});
