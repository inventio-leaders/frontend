import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getSession } from "../utils/session";

const BASE_URL = "http://45.131.40.164:8080";

export const authApi = createApi({
  reducerPath: "authApi",
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
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
      }),
    }),

    login: builder.mutation({
      query: ({ username, password }) => ({
        url: "/auth/jwt/login",
        method: "POST",
        body: new URLSearchParams({
          grant_type: "password",
          username,
          password,
          scope: "",
        }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }),
    }),

    getMe: builder.query({
      query: () => ({ url: "/me", method: "GET" }),
      providesTags: ["Me"],
    }),
    logout: builder.mutation({
      query: () => ({ url: "/auth/jwt/logout", method: "POST" }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGetMeQuery,
  useLogoutMutation,
} = authApi;
