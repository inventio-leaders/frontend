import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getSession } from "../utils/session";

const BASE_URL = "http://localhost:8080";

export const modelsApi = createApi({
  reducerPath: "modelsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (h) => {
      const s = getSession();
      if (s?.accessToken) h.set("Authorization", `Bearer ${s.accessToken}`);
      return h;
    },
  }),
  tagTypes: ["Models"],
  endpoints: (b) => ({
    listModels: b.query({
      query: (params = {}) => ({ url: "/models/", params }),
      providesTags: ["Models"],
    }),
    countModels: b.query({
      query: (params = {}) => ({ url: "/models/count", params }),
    }),
    getModel: b.query({
      query: (model_id) => ({ url: `/models/${model_id}` }),
    }),
  }),
});

export const { useListModelsQuery, useCountModelsQuery, useGetModelQuery } =
  modelsApi;
