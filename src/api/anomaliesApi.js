import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getSession } from "../utils/session";

const BASE_URL = "http://45.131.40.164:8080";

export const anomaliesApi = createApi({
  reducerPath: "anomaliesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const s = getSession();
      if (s?.accessToken)
        headers.set("Authorization", `Bearer ${s.accessToken}`);
      return headers;
    },
  }),
  tagTypes: ["Anomalies"],
  endpoints: (builder) => ({
    listAnomalies: builder.query({
      query: (params = {}) => ({ url: "/anomalies/", params }),
      providesTags: ["Anomalies"],
    }),
    countAnomalies: builder.query({
      query: (params = {}) => ({ url: "/anomalies/count", params }),
    }),
  }),
});

export const { useListAnomaliesQuery, useCountAnomaliesQuery } = anomaliesApi;
