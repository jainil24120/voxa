import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['interview', 'storytelling', 'presentation', 'daily', 'public-speaking'],
      required: true,
    },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    text: { type: String, required: true },

    targetStyle: {
      wpmMin: { type: Number, default: 110 },
      wpmMax: { type: Number, default: 140 },
      tone: { type: String, default: 'conversational' },
      stressWords: { type: [String], default: [] },
    },

    isFreePreview: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Topic', topicSchema);
