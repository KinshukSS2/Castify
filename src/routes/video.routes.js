import { Router } from "express";
import { getAllVideos, getvideoById, publishVideo } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();


router.use(verifyJWT);


router.post(
  "/publish",
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishVideo
);

router.get("/getAll-videos",getAllVideos
);
router.get("/:id",getvideoById
);


export default router;
