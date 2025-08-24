import { COUNTRIES } from "@/utils/contries";
import { type } from "arktype";
import z from "zod";

export const alpha3CountryCodeValidator = type.enumerated(
  COUNTRIES.map((c) => c.alpha3)
);

export const alpha2CountryCodeValidator = type.enumerated(
  COUNTRIES.map((c) => c.alpha2)
);

export const countryNameValidator = type.enumerated(
  COUNTRIES.map((c) => c.name)
);
