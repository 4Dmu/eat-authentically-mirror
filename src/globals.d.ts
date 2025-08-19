export {};

declare global {
  interface CustomJwtSessionClaims {
    imageUrl?: string;
  }
}
