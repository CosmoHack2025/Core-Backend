require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const initDB = require("./dbConnection/dbSync");

const PORT = process.env.PORT || 9191;
const app = express();

const allowedOrigins = [process.env.FRONTEND_URL];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

// Import routes
const patientRoute = require("./route/patientRoute/patientRoute");
const doctorRoute = require("./route/doctorRoute/doctorRoute");
const adminRoute = require("./route/adminRoute/adminRoute");
const bookingRoute = require("./route/bookingRoute/bookingRoute");
const reportRoute = require("./route/reportRoute/reportRoute");

// Use routes
app.use("/api/patient", patientRoute);
app.use("/api/doctor", doctorRoute);
app.use("/api/admin", adminRoute);
app.use("/api/booking", bookingRoute);
app.use("/api/report", reportRoute);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ message: "Healthcare API is running" });
});

initDB(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
