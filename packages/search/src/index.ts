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
  summary?: string;
  type: string;
  labels: string[];
  verified: boolean;
  subscriptionRank: number;
  avgRating: number;
  bayesAvg: number;
  reviewCount: number;
  country?: string;
  adminArea?: string;
  city?: string;
  locality?: string;
  organic: boolean;
  location?: [number, number];
  certifications: string[];
  coverUrl?: string;
  commodities: string[];
  createdAt: number;
  updatedAt: number;
  userId?: string;
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
