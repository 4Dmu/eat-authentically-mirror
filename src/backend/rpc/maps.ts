"use server";
import { GeocodeRegionProps, ReverseGeocodeResponse } from "../validators/maps";
import { env } from "@/env";
import { type } from "arktype";
import { authenticatedActionClient } from "./helpers/middleware";
import {
  TOTAL_GEOCODE_REQUESTS_KV,
  USER_COUNT_KV,
  USER_TOTAL_GEOCODE_REQUESTS_KV,
} from "../kv";
import { getMonth, getYear } from "date-fns";

export const geocodeRegion = authenticatedActionClient
  .input(GeocodeRegionProps)
  .name("geocodeRegion")
  .action(async ({ input: { center }, ctx: { userId } }) => {
    const date = new Date();
    const month = getMonth(date);
    const year = getYear(date);
    const totalRequests =
      (await TOTAL_GEOCODE_REQUESTS_KV.get(year, month)) ?? 0;
    const perUserRequests =
      (await USER_TOTAL_GEOCODE_REQUESTS_KV.get(userId, year, month)) ?? 0;
    const usersCount = (await USER_COUNT_KV.get()) ?? 0;

    const allowedRequestsPerUser =
      usersCount == 0
        ? env.TOTAL_GEOCODE_REQUESTS_ALLOWED
        : env.TOTAL_GEOCODE_REQUESTS_ALLOWED / usersCount;

    const userLimitReached = perUserRequests >= allowedRequestsPerUser;
    const globalLimitReached =
      totalRequests >= env.TOTAL_GEOCODE_REQUESTS_ALLOWED;

    if (userLimitReached || globalLimitReached) {
      throw new Error("Your free map limit has been reached");
    }

    await USER_TOTAL_GEOCODE_REQUESTS_KV.set(
      userId,
      year,
      month,
      perUserRequests + 1,
    );
    await TOTAL_GEOCODE_REQUESTS_KV.increment(year, month);

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${center.lat},${center.lng}&result_type=country|administrative_area_level_1&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
    });

    const result = ReverseGeocodeResponse(await response.json());

    if (result instanceof type.errors) {
      throw new Error("Error geocoding");
    }

    return result.results[0];
  });
