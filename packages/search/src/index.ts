import Typesense from "typesense";
import { env } from "./env";
import { FieldType } from "typesense/lib/Typesense/Collection";
import { SearchResponse } from "typesense/lib/Typesense/Documents";

export type CollectionSchema = {
  name: string;
  fields: {
    name: string;
    type: FieldType;
    facet?: boolean;
    index?: boolean;
    optional?: boolean;
  }[];
};

export type ProducersCollectionDocument = {
  id: string;
  name: string;
  summary: string | undefined;
  type: string;
  labels: string[];
  verified: boolean;
  subscriptionRank: number;
  avgRating: number;
  bayesAvg: number;
  reviewCount: number;
  country: string | undefined;
  adminArea: string | undefined;
  city: string | undefined;
  locality: string | undefined;
  organic: boolean;
  location: [number, number] | undefined;
  certifications: string[];
  coverUrl: string | undefined;
  commodities: string[];
  createdAt: number;
  updatedAt: number;
  userId?: string | undefined;
};

export function typesense() {
  return new Typesense.Client({
    nodes: [
      {
        host: env.TYPESENSE_HOST,
        port: env.TYPESENSE_PORT,
        protocol: env.TYPESENSE_PROTOCOL,
      },
    ],
    apiKey: env.TYPESENSE_APIKEY,
    connectionTimeoutSeconds: 30, // 30 second timeout for all requests
  });
}

export type { SearchResponse };
