  import { Router } from "express";
  import { loginUser, registeruser,logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
  import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

  const router = Router();

  router.route("/register").post(
    upload.fields([
      {
        name:"avatar",
        maxCount:1
      },
      {
        name:"coverimage",
        maxCount:1
      }

    ]),
    
    registeruser);

        router.route("/login").post(loginUser)
        router.route("/logout").post(verifyJWT,logoutUser)
        router.route("/refresh-Token").post(refreshAccessToken)

  export default router;
