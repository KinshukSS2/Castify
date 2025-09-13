import mongoose,{Schema} from "mongoose";

const storySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  rootVideo: {
    type: Schema.Types.ObjectId,
    ref: "Video",
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  collaborators: [
    {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      likedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  shares: {
    type: Number,
    default: 0
  },
  savedBy: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      savedAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, { timestamps: true });

export const Story = mongoose.model("Story", storySchema);


