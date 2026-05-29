import 'dotenv/config';
import mongoose from 'mongoose';
import Topic from '../models/Topic.js';

const TOPICS = [
  {
    title: 'Introduce Yourself in an Interview',
    category: 'interview',
    level: 'beginner',
    isFreePreview: true,
    text: `Hello, my name is Alex. I am a recent graduate in computer science, and I am passionate about building software that solves real problems. Over the last two years, I have led three projects where I delivered measurable impact for my team. I am excited about this opportunity because your company is building something I genuinely care about.`,
    targetStyle: { wpmMin: 120, wpmMax: 140, tone: 'confident', stressWords: ['passionate', 'measurable', 'excited', 'genuinely'] },
  },
  {
    title: 'Tell a Story About a Challenge',
    category: 'storytelling',
    level: 'intermediate',
    text: `Last summer, I faced the biggest challenge of my career. Our entire database crashed two hours before a major client demo. My heart was pounding. I had two choices — panic, or act. I chose to act. I rebuilt the demo from backups in ninety minutes, and the client signed a six-figure deal that afternoon.`,
    targetStyle: { wpmMin: 110, wpmMax: 135, tone: 'dramatic', stressWords: ['biggest', 'crashed', 'pounding', 'act', 'six-figure'] },
  },
  {
    title: 'Pitch Your Idea in 60 Seconds',
    category: 'presentation',
    level: 'advanced',
    text: `Imagine an app that teaches you English by letting you copy the world's best speakers. You upload any video — TED talks, leaders, your favourite mentor. Our AI extracts their voice and gesture style, then coaches you to deliver like them. We are building the first English coach that actually changes how you sound.`,
    targetStyle: { wpmMin: 130, wpmMax: 150, tone: 'energetic', stressWords: ['Imagine', 'copy', 'best', 'extracts', 'first', 'actually'] },
  },
  {
    title: 'Order Coffee at a Cafe',
    category: 'daily',
    level: 'beginner',
    text: `Good morning. Can I please have a large cappuccino with oat milk, and a chocolate croissant? Make it to go, please. Thank you so much.`,
    targetStyle: { wpmMin: 100, wpmMax: 130, tone: 'polite', stressWords: ['large', 'oat', 'chocolate', 'Thank you'] },
  },
  {
    title: 'Give a Toast at a Wedding',
    category: 'public-speaking',
    level: 'intermediate',
    text: `Family and friends, please raise your glasses. Today we celebrate two people who taught us what love really looks like. They are patient, they are kind, and they choose each other every single day. To the happy couple — may your story be long, beautiful, and full of laughter.`,
    targetStyle: { wpmMin: 110, wpmMax: 130, tone: 'warm', stressWords: ['celebrate', 'love', 'every single day', 'long', 'beautiful'] },
  },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/voxa');
  await Topic.deleteMany({});
  await Topic.insertMany(TOPICS);
  console.log(`[Voxa] seeded ${TOPICS.length} topics`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
