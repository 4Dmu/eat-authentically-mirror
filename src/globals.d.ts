export {};

declare global {
  interface CustomJwtSessionClaims {
    imageUrl?: string;
    firstName?: string;
  }
}
