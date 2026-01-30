require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const initDB = require("./dbConnection/dbSync");

const PORT = process.env.PORT || 9191;
const app = express();

const allowedOrigins = [process.env.FRONTEND_URL,process.env.FRONTEND_URL_ADMIN];
//final testing url
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
const recommendationRoute = require("./route/recommendationRoute/gemniRoute");
const contactRoute = require("./route/contactRoute/contactRoute");
const chatRoute = require("./route/chatRoute/chatRoute");
const hospitalRoute = require("./route/hospitalRoute/hospitalRoute");

// Use routes
app.use("/api/patient", patientRoute);
app.use("/api/doctor", doctorRoute);
app.use("/api/admin", adminRoute);
app.use("/api/booking", bookingRoute);
app.use("/api/report", reportRoute);
app.use("/api/recommendation",recommendationRoute );
app.use("/api/contact", contactRoute);
app.use("/api/chat", chatRoute);
app.use("/api/hospital", hospitalRoute);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ message: "Healthcare API is running" });
});

initDB(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
