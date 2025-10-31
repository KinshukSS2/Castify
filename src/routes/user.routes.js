  import { Router } from "express";
  import { loginUser, registeruser,logoutUser, refreshAccessToken, changePassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
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
        router.route("/change-password").post(verifyJWT,changePassword)
        router.route("/current-user").get(verifyJWT,getCurrentUser)
        router.route("/update_account").patch(verifyJWT,updateAccountDetails)
        router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
        router.route("/cover-image").patch(verifyJWT,upload.single("coverimage"),updateUserCoverImage)
     



  export default router;
