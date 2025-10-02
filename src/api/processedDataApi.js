import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getSession } from "../utils/session";

const BASE_URL = "http://localhost:8080";

export const processedDataApi = createApi({
  reducerPath: "processedDataApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const session = getSession();
      if (session?.accessToken) {
        headers.set("Authorization", `Bearer ${session.accessToken}`);
      }
      return headers;
    },
  }),
  tagTypes: ["ProcessedData"],
  endpoints: (builder) => ({
    listProcessed: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams();
        if (params.dt_from) qs.set("dt_from", params.dt_from);
        if (params.dt_to) qs.set("dt_to", params.dt_to);
        if (params.hour !== undefined && params.hour !== null)
          qs.set("hour", params.hour);
        if (params.day_of_week !== undefined && params.day_of_week !== null)
          qs.set("day_of_week", params.day_of_week);
        if (params.is_weekend !== undefined && params.is_weekend !== null)
          qs.set("is_weekend", params.is_weekend);
        if (params.limit) qs.set("limit", params.limit);
        if (params.offset) qs.set("offset", params.offset);
        if (params.order_desc !== undefined)
          qs.set("order_desc", params.order_desc);
        return { url: `/processed-data/?${qs.toString()}`, method: "GET" };
      },
      providesTags: (result) =>
        result
          ? [{ type: "ProcessedData", id: "LIST" }]
          : [{ type: "ProcessedData", id: "LIST" }],
    }),

    countProcessed: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams();
        if (params.dt_from) qs.set("dt_from", params.dt_from);
        if (params.dt_to) qs.set("dt_to", params.dt_to);
        if (params.hour !== undefined && params.hour !== null)
          qs.set("hour", params.hour);
        if (params.day_of_week !== undefined && params.day_of_week !== null)
          qs.set("day_of_week", params.day_of_week);
        if (params.is_weekend !== undefined && params.is_weekend !== null)
          qs.set("is_weekend", params.is_weekend);
        return { url: `/processed-data/count?${qs.toString()}`, method: "GET" };
      },
      providesTags: [{ type: "ProcessedData", id: "COUNT" }],
    }),

    importProcessedExcel: builder.mutation({
      query: ({ files, dedupe = true }) => {
        const form = new FormData();
        (Array.isArray(files) ? files : [files]).forEach((f) =>
          form.append("files", f)
        );
        const qs = new URLSearchParams({ dedupe: String(dedupe) });
        return {
          url: `/processed-data/import-excel?${qs.toString()}`,
          method: "POST",
          body: form,
        };
      },
      invalidatesTags: [
        { type: "ProcessedData", id: "LIST" },
        { type: "ProcessedData", id: "COUNT" },
      ],
    }),
    exportProcessedToXlsx: builder.query({
      query: ({
        dt_from,
        dt_to,
        threshold_pct = 10,
        save_to_db = true,
        filename = "processed_anomalies.xlsx",
      }) => ({
        url: "/processed-data/export-xlsx",
        params: { dt_from, dt_to, threshold_pct, save_to_db, filename },
        responseHandler: async (response) => {
          const ct = response.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            return await response.json();
          }
          return await response.blob();
        },
      }),
    }),
  }),
});

export const {
  useListProcessedQuery,
  useCountProcessedQuery,
  useImportProcessedExcelMutation,
  useLazyExportProcessedToXlsxQuery,
} = processedDataApi;
