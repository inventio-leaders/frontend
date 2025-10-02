import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getSession } from "../utils/session";

const BASE_URL = "http://45.131.40.164:8080";

export const mlApi = createApi({
  reducerPath: "mlApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (h) => {
      const s = getSession();
      if (s?.accessToken) h.set("Authorization", `Bearer ${s.accessToken}`);
      return h;
    },
  }),
  endpoints: (b) => ({
    train: b.mutation({
      query: (body) => ({ url: "/ml/train", method: "POST", body }),
    }),
    runForecast: b.mutation({
      query: (body = { horizon_hours: 48 }) => ({
        url: "/ml/forecast/run",
        method: "POST",
        body,
      }),
    }),
    anomalyScan: b.mutation({
      query: (body) => ({ url: "/ml/anomaly/scan", method: "POST", body }),
    }),
    taskStatus: b.query({
      query: (task_id) => ({ url: `/ml/tasks/${task_id}` }),
    }),
  }),
});

export const {
  useTrainMutation,
  useRunForecastMutation,
  useAnomalyScanMutation,
  useLazyTaskStatusQuery,
} = mlApi;
