export default function Pricing() {
  return (
    <div className="px-6 py-16 max-w-5xl mx-auto">
      <h1 className="font-display text-5xl text-center mb-12">Simple pricing</h1>
      <div className="grid md:grid-cols-3 gap-5">
        <Plan name="Free" price="₹0" tagline="Try once">
          <li>1 practice session</li>
          <li>Voice + gesture analysis</li>
          <li>AI coaching tips</li>
        </Plan>
        <Plan name="Monthly" price="₹199" period="/mo" tagline="For learners" featured>
          <li>Unlimited sessions</li>
          <li>Upload mentor clips</li>
          <li>AI voice playback</li>
          <li>Personal progress dashboard</li>
        </Plan>
        <Plan name="Yearly" price="₹1,999" period="/yr" tagline="Save 17%">
          <li>Everything in Monthly</li>
          <li>Save ₹389/year</li>
          <li>Priority feature requests</li>
        </Plan>
      </div>
    </div>
  );
}

function Plan({ name, price, period, tagline, children, featured }) {
  return (
    <div className={`glass p-6 ${featured ? 'border-accent/40 ring-1 ring-accent/30' : ''}`}>
      <div className="text-xs uppercase tracking-wider text-accent">{tagline}</div>
      <div className="font-display text-2xl mt-1">{name}</div>
      <div className="mt-3 flex items-baseline">
        <div className="font-display text-5xl">{price}</div>
        {period && <div className="text-white/50 ml-1">{period}</div>}
      </div>
      <ul className="mt-5 space-y-2 text-white/80 text-sm">
        {Array.isArray(children) ? children.map((c, i) => <li key={i}>• {c.props.children}</li>) : <li>{children}</li>}
      </ul>
    </div>
  );
}
