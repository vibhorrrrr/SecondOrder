import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Floating Particle Component
const FloatingParticle = ({ delay, size, left, duration }) => (
    <div
        className="floating-particle"
        style={{
            '--delay': `${delay}s`,
            '--size': `${size}px`,
            '--left': `${left}%`,
            '--duration': `${duration}s`
        }}
    />
);

// Animated Node for Neural Network Visualization
const AnimatedNode = ({ x, y, delay, pulse }) => (
    <div
        className="neural-node"
        style={{
            left: `${x}%`,
            top: `${y}%`,
            animationDelay: `${delay}s`,
            '--pulse-color': pulse
        }}
    />
);

// Feature Card Component
const FeatureCard = ({ icon, title, description, delay }) => (
    <div
        className="feature-card"
        style={{ animationDelay: `${delay}s` }}
    >
        <div className="feature-icon">{icon}</div>
        <h3 className="feature-title">{title}</h3>
        <p className="feature-description">{description}</p>
    </div>
);

// Step Flow Component
const StepFlow = ({ number, title, description, isLast, delay }) => (
    <div className="step-flow" style={{ animationDelay: `${delay}s` }}>
        <div className="step-number">{number}</div>
        <div className="step-content">
            <h4 className="step-title">{title}</h4>
            <p className="step-description">{description}</p>
        </div>
        {!isLast && <div className="step-arrow">→</div>}
    </div>
);

// Tech Badge Component
const TechBadge = ({ name, color, delay }) => (
    <div
        className="tech-badge"
        style={{
            '--badge-color': color,
            animationDelay: `${delay}s`
        }}
    >
        {name}
    </div>
);

// Timeline Item Component
const TimelineItem = ({ title, description, icon, status, delay }) => (
    <div className="timeline-item" style={{ animationDelay: `${delay}s` }}>
        <div className="timeline-dot"><span className="timeline-icon">{icon}</span></div>
        <div className="timeline-content">
            <div className="timeline-header">
                <h4>{title}</h4>
                {status && (
                    <span className={`timeline-status status-${status.toLowerCase().replace(' ', '-')}`}>
                        {status}
                    </span>
                )}
            </div>
            <p>{description}</p>
        </div>
    </div>
);

function LandingPage() {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState({});

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
                    }
                });
            },
            { threshold: 0.1 }
        );

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const features = [
        {
            icon: '🎲',
            title: 'Monte Carlo Simulation',
            description: '50+ parallel simulation paths with P10/P50/P90 probability distributions for comprehensive risk analysis.'
        },
        {
            icon: '🌳',
            title: 'MCTS Decision Trees',
            description: 'Monte Carlo Tree Search with UCB1 exploration-exploitation balancing for optimal strategy discovery.'
        },
        {
            icon: '🤖',
            title: 'Gemini AI Integration',
            description: 'Powered by Google Gemini 2.0 for real-time 3rd-order effect generation and strategic recommendations.'
        },
        {
            icon: '📊',
            title: 'Interactive Dashboard',
            description: 'Real-time simulation visualization with decision tree explorer and trace viewer for deep analysis.'
        },
        {
            icon: '🛡️',
            title: 'Enterprise Reliability',
            description: 'Heuristic fallback engine, deterministic mode, and comprehensive logging for production-grade reliability.'
        },
        {
            icon: '💡',
            title: 'Kelly Criterion Sizing',
            description: 'Optimal capital allocation using Kelly Criterion bet sizing for maximizing long-term growth.'
        }
    ];

    const techStack = [
        { name: 'Gemini 2.0', color: '#4285F4' },
        { name: 'Python', color: '#3776AB' },
        { name: 'FastAPI', color: '#009688' },
        { name: 'React 18', color: '#61DAFB' },
        { name: 'Vite', color: '#646CFF' },
        { name: 'NumPy', color: '#4DABCF' },
        { name: 'Recharts', color: '#FF6B6B' },
        { name: 'TailwindCSS', color: '#38BDF8' }
    ];

    const timeline = [
        {
            icon: '⚙️',
            title: 'Simulation Engine Agent',
            description: 'Autonomous agent that runs Monte Carlo simulations, manages parallel futures, and optimizes simulation parameters in real-time.',
            status: 'Developed'
        },
        {
            icon: '🔍',
            title: 'Interpretation Agent',
            description: 'AI agent that analyzes simulation results, identifies patterns, and translates complex data into actionable business insights.',
            status: 'Developed'
        },
        {
            icon: '🎯',
            title: 'Strategy Agent',
            description: 'Recommends optimal business decisions by evaluating risk-reward tradeoffs across multiple strategic options.',
            status: 'Developed'
        },
        {
            icon: '📝',
            title: 'Scenario Builder Agent',
            description: 'Generates diverse "what-if" scenarios from natural language inputs, creating comprehensive test cases for strategic planning.',
            status: 'Planned'
        },
        {
            icon: '⚠️',
            title: 'Risk Assessment Agent',
            description: 'Continuously monitors simulation outcomes, identifies tail risks, and triggers alerts when survival probability drops below thresholds.',
            status: 'Planned'
        },
        {
            icon: '💰',
            title: 'Portfolio Optimization Agent',
            description: 'Applies Kelly Criterion and modern portfolio theory to allocate resources across multiple business initiatives.',
            status: 'Planned'
        },
        {
            icon: '🤖',
            title: 'Orchestrator Agent',
            description: 'Master agent that coordinates all other agents, manages workflows, and ensures coherent multi-agent collaboration.',
            status: 'Future'
        },
        {
            icon: '🌐',
            title: 'Causal Intelligence Agent',
            description: 'Leverages Directed Acyclic Graphs (DAGs) for causal inference, modeling cause-effect relationships beyond correlations for true counterfactual analysis.',
            status: 'Future'
        }
    ];

    return (
        <div className="landing-page">
            {/* Animated Background */}
            <div className="background-gradient" />
            <div className="particles-container">
                {[...Array(20)].map((_, i) => (
                    <FloatingParticle
                        key={i}
                        delay={i * 0.5}
                        size={Math.random() * 6 + 2}
                        left={Math.random() * 100}
                        duration={Math.random() * 10 + 15}
                    />
                ))}
            </div>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="neural-network">
                    <AnimatedNode x={20} y={30} delay={0} pulse="#7C3AED" />
                    <AnimatedNode x={35} y={50} delay={0.2} pulse="#22D3EE" />
                    <AnimatedNode x={50} y={25} delay={0.4} pulse="#EC4899" />
                    <AnimatedNode x={65} y={55} delay={0.6} pulse="#7C3AED" />
                    <AnimatedNode x={80} y={35} delay={0.8} pulse="#22D3EE" />
                    <AnimatedNode x={25} y={70} delay={1} pulse="#EC4899" />
                    <AnimatedNode x={75} y={65} delay={1.2} pulse="#7C3AED" />
                    <svg className="neural-connections">
                        <line x1="20%" y1="30%" x2="35%" y2="50%" />
                        <line x1="35%" y1="50%" x2="50%" y2="25%" />
                        <line x1="50%" y1="25%" x2="65%" y2="55%" />
                        <line x1="65%" y1="55%" x2="80%" y2="35%" />
                        <line x1="35%" y1="50%" x2="25%" y2="70%" />
                        <line x1="65%" y1="55%" x2="75%" y2="65%" />
                        <line x1="20%" y1="30%" x2="50%" y2="25%" />
                        <line x1="80%" y1="35%" x2="75%" y2="65%" />
                    </svg>
                </div>

                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="badge-glow" />
                        AI-Powered Strategic Simulation
                    </div>
                    <h1 className="hero-title">
                        <span className="gradient-text">Second Order</span>
                    </h1>
                    <p className="hero-tagline">
                        See beyond the obvious. Model the ripple effects of every decision.
                    </p>
                    <p className="hero-description">
                        Next-generation business simulation engine that models the true physics
                        of decision-making through first, second, and third-order effects.
                    </p>
                    <button
                        className="cta-button"
                        onClick={() => navigate('/dashboard')}
                    >
                        <span>Get Started</span>
                        <svg className="arrow-icon" viewBox="0 0 24 24" fill="none">
                            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                <div className="scroll-indicator">
                    <div className="scroll-mouse">
                        <div className="scroll-wheel" />
                    </div>
                    <span>Scroll to explore</span>
                </div>
            </section>

            {/* Problem Section */}
            <section id="problem" className="problem-section animate-on-scroll">
                <div className={`section-content ${isVisible['problem'] ? 'visible' : ''}`}>
                    <h2 className="section-title">
                        <span className="title-icon">❌</span>
                        The Problem
                    </h2>
                    <div className="problem-grid">
                        <div className="problem-card">
                            <p className="problem-quote">
                                "Traditional financial models are <strong>dangerously naive</strong>."
                            </p>
                            <ul className="problem-list">
                                <li>Linear cause and effect assumptions</li>
                                <li>Static market conditions</li>
                                <li>No competitor responses modeled</li>
                                <li>Missing systemic feedback loops</li>
                            </ul>
                        </div>
                        <div className="reality-check">
                            <h3>Reality Check</h3>
                            <p>
                                When you cut costs, you don't just "save money." Your best engineers leave.
                                Product quality drops. Customers churn. Competitors sense weakness and capture market share.
                            </p>
                            <blockquote>
                                "In complex systems, first-order thinking is how you lose."
                            </blockquote>
                        </div>
                    </div>
                </div>
            </section>

            {/* Solution Section */}
            <section id="solution" className="solution-section animate-on-scroll">
                <div className={`section-content ${isVisible['solution'] ? 'visible' : ''}`}>
                    <h2 className="section-title">
                        <span className="title-icon">✅</span>
                        The Solution
                    </h2>
                    <div className="orders-grid">
                        <div className="order-card order-first">
                            <div className="order-badge">1st Order</div>
                            <h3>Direct Effects</h3>
                            <p className="order-example">"Cut costs" → Burn decreases</p>
                        </div>
                        <div className="order-card order-second">
                            <div className="order-badge">2nd Order</div>
                            <h3>Systemic Feedback</h3>
                            <p className="order-example">"Cut costs" → Product quality drops → Churn increases</p>
                        </div>
                        <div className="order-card order-third">
                            <div className="order-badge">3rd Order</div>
                            <h3>Strategic Emergence</h3>
                            <p className="order-example">"Cut costs" → Competitors sense weakness → Market share erodes</p>
                        </div>
                    </div>
                    <div className="monte-carlo-highlight">
                        <div className="highlight-icon">🎲</div>
                        <p>
                            Powered by <strong>Google Gemini 2.0</strong>, SecondOrder runs
                            <strong> Monte Carlo simulations across 50+ parallel futures</strong> to give you
                            probability-weighted outcomes, not just one guess.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section animate-on-scroll">
                <div className={`section-content ${isVisible['features'] ? 'visible' : ''}`}>
                    <h2 className="section-title">
                        <span className="title-icon">✨</span>
                        Features
                    </h2>
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <FeatureCard
                                key={index}
                                {...feature}
                                delay={index * 0.1}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="how-it-works-section animate-on-scroll">
                <div className={`section-content ${isVisible['how-it-works'] ? 'visible' : ''}`}>
                    <h2 className="section-title">
                        <span className="title-icon">🧠</span>
                        How It Works
                    </h2>
                    <div className="flow-container">
                        <StepFlow
                            number="1️⃣"
                            title="Your Decision"
                            description="Input a strategic business decision"
                            delay={0}
                        />
                        <StepFlow
                            number="2️⃣"
                            title="First Order"
                            description="Calculate direct financial impact"
                            delay={0.1}
                        />
                        <StepFlow
                            number="3️⃣"
                            title="Second Order"
                            description="Model systemic feedback loops"
                            delay={0.2}
                        />
                        <StepFlow
                            number="4️⃣"
                            title="Third Order (AI)"
                            description="Gemini predicts emergent effects"
                            delay={0.3}
                        />
                        <StepFlow
                            number="5️⃣"
                            title="Monte Carlo"
                            description="50 parallel futures simulated"
                            delay={0.4}
                            isLast
                        />
                    </div>
                    <div className="results-preview">
                        <div className="result-card">
                            <span className="result-label">P10 (Downside)</span>
                            <span className="result-value downside">$120K</span>
                        </div>
                        <div className="result-card">
                            <span className="result-label">P50 (Median)</span>
                            <span className="result-value median">$340K</span>
                        </div>
                        <div className="result-card">
                            <span className="result-label">P90 (Upside)</span>
                            <span className="result-value upside">$580K</span>
                        </div>
                        <div className="result-card survival">
                            <span className="result-label">Survival Rate</span>
                            <span className="result-value">73%</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tech Stack Section */}
            <section id="tech-stack" className="tech-stack-section animate-on-scroll">
                <div className={`section-content ${isVisible['tech-stack'] ? 'visible' : ''}`}>
                    <h2 className="section-title">
                        <span className="title-icon">🛠</span>
                        Tech Stack
                    </h2>
                    <div className="tech-badges-container">
                        {techStack.map((tech, index) => (
                            <TechBadge
                                key={index}
                                {...tech}
                                delay={index * 0.1}
                            />
                        ))}
                    </div>
                    <div className="architecture-layers">
                        <div className="layer">
                            <span className="layer-label">AI Engine</span>
                            <span className="layer-tech">Google Gemini 2.0 Flash/Pro</span>
                        </div>
                        <div className="layer">
                            <span className="layer-label">Backend</span>
                            <span className="layer-tech">Python, FastAPI, NumPy, Pydantic</span>
                        </div>
                        <div className="layer">
                            <span className="layer-label">Simulation</span>
                            <span className="layer-tech">Monte Carlo, MCTS, Kelly Criterion</span>
                        </div>
                        <div className="layer">
                            <span className="layer-label">Frontend</span>
                            <span className="layer-tech">React 18, Vite, Recharts, TailwindCSS</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Future Scope Section */}
            <section id="future" className="future-section animate-on-scroll">
                <div className={`section-content ${isVisible['future'] ? 'visible' : ''}`}>
                    <h2 className="section-title">
                        <span className="title-icon">🚀</span>
                        Road to Agentic AI
                    </h2>
                    <p className="future-intro">
                        We're transforming SecondOrder into an agentic AI platform. Each component
                        becomes an autonomous agent. Working together to simulate, analyze, and
                        recommend strategic decisions with minimal human intervention.
                    </p>
                    <div className="timeline">
                        {timeline.map((item, index) => (
                            <TimelineItem
                                key={index}
                                {...item}
                                delay={index * 0.15}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to think in systems?</h2>
                    <p>Start simulating the true impact of your business decisions today.</p>
                    <button
                        className="cta-button cta-large"
                        onClick={() => navigate('/dashboard')}
                    >
                        <span>Launch Simulation Dashboard</span>
                        <svg className="arrow-icon" viewBox="0 0 24 24" fill="none">
                            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <h3>SecondOrder</h3>
                        <p>Built for founders who think in systems, not spreadsheets.</p>
                    </div>
                    <div className="footer-links">
                        <a href="https://github.com/vibhorrrrr/SecondOrder" target="_blank" rel="noopener noreferrer">
                            GitHub
                        </a>
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How It Works</a>
                        <a href="#tech-stack">Tech Stack</a>
                    </div>
                    <div className="footer-authors">
                        <p className="authors-label">Designed & Developed by</p>
                        <div className="authors-links">
                            <a href="https://www.linkedin.com/in/vibhorjoshi/" target="_blank" rel="noopener noreferrer" className="author-link">
                                <span className="linkedin-icon">in</span>
                                Vibhor Joshi
                            </a>
                            <span className="author-separator">&</span>
                            <a href="https://www.linkedin.com/in/amit-uttam-das/" target="_blank" rel="noopener noreferrer" className="author-link">
                                <span className="linkedin-icon">in</span>
                                Amit Das
                            </a>
                        </div>
                    </div>
                    <div className="footer-credits">
                        <p>Made with ❤️ and a lot of Monte Carlo simulations</p>
                        <p>Powered by Google Gemini 2.0</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
