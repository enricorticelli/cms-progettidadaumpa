const express = require("express");
const http = require("http");
const logger = require("morgan");
const path = require("path");
const bodyParser = require("body-parser");
const { auth } = require("express-openid-connect");

const router = require("./routes/index_router");
const artistiRouter = require("./routes/artisti_router");
const immaginiRouter = require("./routes/immagini_router");

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = process.env.PORT || 8080;

const authConfig = {
  authRequired: true,
  auth0Logout: true,
  secret: process.env.SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
};


const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');

const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.PROJECT_ID,
  "private_key_id": process.env.PRIVATE_KEY_ID,
  "private_key": privateKey, // Use the processed private key
  "client_email": process.env.CLIENT_FB_EMAIL,
  "client_id": process.env.CLIENT_FB_ID,
  "auth_uri": process.env.AUTH_URI,
  "token_uri": process.env.TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_X509_CERT_URL,
  "client_x509_cert_url": process.env.CLIENT_X509_CERT_URL,
  "universe_domain": process.env.UNIVERSE_DOMAIN
};

var admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.BUCKET_URL,
});

var bucket = admin.storage().bucket();

// Set up Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Express API with Swagger",
      version: "1.0.0",
      description: "API documentation for your Express application",
    },
    servers: [
      {
        url: authConfig.baseURL,
        description: "Development server",
      },
    ],
  },
  apis: ["./routes/*.js"], // Specify the path to your route files
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Set up views and static files
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(logger("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/artisti", express.static(path.join(__dirname, "public")));
app.use("/immagini", express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Authentication middleware
app.use(auth(authConfig));

// Set user data in response locals
app.use(function (req, res, next) {
  res.locals.user = req.oidc.user;
  res.locals.bucket = bucket;
  next();
});

// Define routes
app.use("/", router);
app.use("/artisti", artistiRouter);
app.use("/immagini", immaginiRouter);

// Swagger endpoint
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error handling middleware
app.use(function (req, res, next) {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render("error", {
    message: err.message,
    error: process.env.NODE_ENV !== "production" ? err : {},
  });
});

// Start server
http.createServer(app).listen(port, () => {
  console.log(`Listening on ${authConfig.baseURL}`);
});
