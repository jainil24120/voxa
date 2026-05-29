import mongoose from 'mongoose';

const mentorClipSchema = new mongoose.Schema(
  {
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sourceUrl: { type: String, required: true },
    mediaType: { type: String, enum: ['audio', 'video'], required: true },
    label: { type: String, default: '' },

    voiceProfile: {
      avgWpm: Number,
      pitchRangeHz: { min: Number, max: Number },
      avgVolumeDb: Number,
      voiceCloneId: String,
    },

    gestureProfile: {
      avgGestureRate: Number,
      avgAmplitude: Number,
      openPalmRatio: Number,
      signaturePosture: String,
      keypointTimeline: [
        {
          ts: Number,
          keypoints: mongoose.Schema.Types.Mixed,
        },
      ],
    },

    transcript: { type: String, default: '' },
    wordTimings: {
      type: [{ word: String, start: Number, end: Number, stressLevel: Number }],
      default: [],
    },

    processingStatus: {
      type: String,
      enum: ['uploaded', 'processing', 'ready', 'failed'],
      default: 'uploaded',
    },
    processingError: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('MentorClip', mentorClipSchema);
