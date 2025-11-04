/// <reference types="google.maps" />
export {};

declare global {
  interface CustomJwtSessionClaims {
    imageUrl?: string;
    firstName?: string;
  }
}
