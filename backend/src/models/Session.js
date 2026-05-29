import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
    mentorClipId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorClip', default: null },

    transcript: { type: String, default: '' },
    wordTimings: {
      type: [{ word: String, start: Number, end: Number }],
      default: [],
    },

    voiceMetrics: {
      wpm: Number,
      avgPitchHz: Number,
      pitchVariance: Number,
      avgVolumeDb: Number,
      pauseCount: Number,
      fillerCount: Number,
      fillerWords: [String],
      clarityScore: Number,
    },

    gestureMetrics: {
      gestureRate: Number,
      avgAmplitude: Number,
      openPalmRatio: Number,
      closedPostureSeconds: Number,
      handsInPocketsSeconds: Number,
      headTiltVariance: Number,
      score: Number,
    },

    feedback: {
      voiceTips: [String],
      gestureTips: [String],
      vocabularyTips: [String],
      overallScore: Number,
    },

    audioUrl: String,
    videoUrl: String,
  },
  { timestamps: true }
);

export default mongoose.model('Session', sessionSchema);
