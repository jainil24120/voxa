import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="px-6">
      <section className="max-w-5xl mx-auto pt-24 pb-20 text-center">
        <p className="text-accent text-sm tracking-widest uppercase mb-4">English Communication, Reimagined</p>
        <h1 className="font-display text-5xl md:text-7xl leading-tight tracking-tight">
          Speak like the<br />
          <span className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">
            best in the world.
          </span>
        </h1>
        <p className="mt-6 text-white/70 text-lg max-w-2xl mx-auto">
          Upload any speaker. Voxa learns their voice <em>and</em> gestures.
          Then it karaoke-coaches you to deliver like them — pace, pitch, stress, hand movement, posture.
        </p>
        <div className="mt-10 flex gap-3 justify-center">
          <Link to="/auth" className="px-6 py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent/90">
            Try one session free
          </Link>
          <Link to="/pricing" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20">
            See pricing
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto grid md:grid-cols-3 gap-5 pb-24">
        <FeatureCard
          title="Karaoke practice"
          body="Text scrolls. You read aloud. Voxa highlights each word as you say it — green for nailed, red for missed."
        />
        <FeatureCard
          title="Voice + gesture analysis"
          body="Pace, pitch, fillers, pauses — plus hand gestures, posture, and openness, tracked live through your webcam."
        />
        <FeatureCard
          title="Mentor cloning"
          body="Upload a Steve Jobs clip or your favourite TED talk. Voxa extracts their style and coaches you to copy it."
        />
      </section>
    </div>
  );
}

function FeatureCard({ title, body }) {
  return (
    <div className="glass p-6">
      <h3 className="font-display text-2xl mb-2">{title}</h3>
      <p className="text-white/70 leading-relaxed">{body}</p>
    </div>
  );
}
