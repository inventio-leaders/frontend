import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getSession } from "../utils/session";

const BASE_URL = "http://localhost:8080";

export const forecastsApi = createApi({
  reducerPath: "forecastsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (h) => {
      const s = getSession();
      if (s?.accessToken) h.set("Authorization", `Bearer ${s.accessToken}`);
      return h;
    },
  }),
  tagTypes: ["Forecasts"],
  endpoints: (b) => ({
    listForecasts: b.query({
      query: (params = {}) => ({ url: "/forecasts/", params }),
      providesTags: ["Forecasts"],
    }),
    countForecasts: b.query({
      query: (params = {}) => ({ url: "/forecasts/count", params }),
    }),
  }),
});

export const { useListForecastsQuery, useCountForecastsQuery } = forecastsApi;
