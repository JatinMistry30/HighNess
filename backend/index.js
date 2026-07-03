import express from "express";
import { createServer } from "http";
import sqlPool from "./src/DataBase/DB.js";
import dotenv from "dotenv";
import authRoutes from "./src/authRoutes/routes.js";
import cors from "cors";
import clientRoutes from "./src/clientRoutes/routes.js";
import freelancerRoutes from "./src/freelancerRoutes/routes.js";
import contractRoutes from "./src/contractRoutes/routes.js";
import workspaceRoutes from "./src/workspaceRoutes/routes.js";
import canvasRouter from "./src/canvasRoutes/routes.js";
import { createSocketServer } from "./src/socketServer/socketServer.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT;

//MiddleWare
app.use(express.json());

// Express setup
app.use(
  cors({
    origin: process.env.VITE_FRONTEND_URL,
    credentials: true,
  }),
);

//Basic route
app.get("/", (req, res) => {
  res.send("Express server is running");
});

// Auth Routes
app.use("/auth", authRoutes);


// Client Routes
app.use("/client", clientRoutes)


// Freelancers Route
app.use('/api-freelancer', freelancerRoutes)

// Contract Route
app.use('/contract' , contractRoutes)


// Wrokspace routes
app.use('/workspace', workspaceRoutes) 

//Canvas Routes
app.use('/canvas', canvasRouter)

const httpServer = createServer(app);
createSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server Running `, PORT);
});