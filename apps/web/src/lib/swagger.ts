import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  failOnErrors: true,
  definition: {
    openapi: "3.0.0",
    info: {
      title: "EatAuthentically External Api",
      version: "1.0.0",
    },
  },
  apis: ["./src/app/api/external/v1/**/*.ts"],
};

export const openapiSpecification = swaggerJsdoc(options);
