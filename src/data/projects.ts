export const projects = [
  {
    id: "scb",
    number: "01",
    name: "Hosting, engineered.",
    fullName: "Hosting Infrastructure Platform",
    organization: "SCB Network LTD",
    category: "Infrastructure / Platform",
    form: "planet",
    summary:
      "An independent Linux hosting platform. Isolated by design. Automated from provisioning to deployment.",
    role: "Founder & Infrastructure Engineer",
    challenge:
      "Bring application isolation, performance and repeatable operations together in a WordPress-focused hosting platform.",
    architecture:
      "Linux hosts run isolated Docker environments behind Nginx reverse proxies. wp-cli automates content operations; Redis and OPcache provide caching layers. Restricted access controls are part of the hosting architecture.",
    result:
      "Built and operated an independent hosting platform with container-based isolation and automated provisioning workflows.",
    stack: ["Linux", "Docker", "Nginx", "wp-cli", "Redis", "OPcache"],
  },
  {
    id: "assistant",
    number: "02",
    name: "Intelligence, self-hosted.",
    fullName: "Self-Hosted AI Assistant",
    organization: "Independent project",
    category: "AI / Infrastructure",
    form: "neural",
    summary:
      "A private Linux server. A self-hosted AI assistant. A custom interface connecting the two.",
    role: "Infrastructure & Interface Developer",
    challenge:
      "Expose a self-hosted AI assistant through a working web interface on privately managed Linux infrastructure.",
    architecture:
      "A custom HTML and JavaScript chat interface connects to the assistant, published through an Nginx reverse proxy with SSL and domain configuration.",
    result:
      "Deployed the assistant on a private Linux server and published a custom web chat interface.",
    stack: [
      "Linux",
      "Nginx",
      "Self-hosted AI",
      "HTML / JavaScript",
      "SSL / TLS",
    ],
  },
  {
    id: "wordpress-ai",
    number: "03",
    name: "A prompt. A possibility.",
    fullName: "AI-Driven WordPress Generation",
    organization: "Independent project",
    category: "AI / Automation",
    form: "rings",
    summary:
      "Natural language becomes website structure, design concepts and visual assets through a connected AI workflow.",
    role: "Platform Designer & Developer",
    challenge:
      "Connect natural-language prompts to repeatable WordPress website creation workflows.",
    architecture:
      "Prompt-driven generation produces structures, concepts and visual assets. Self-hosted AI models connect with automation workflows for WordPress implementation.",
    result:
      "Developed an AI-powered generation platform with an architecture designed for future model and infrastructure expansion.",
    stack: ["WordPress", "Self-hosted AI", "Prompt workflows", "Automation"],
  },
  {
    id: "needtowatch",
    number: "04",
    name: "Stories worth sharing.",
    fullName: "Needtowatch.net",
    organization: "Independent project",
    category: "Full-stack / Social",
    form: "satellites",
    summary:
      "A social platform for movies and TV shows. From the application architecture to the systems beneath it.",
    role: "Founder & Full-Stack Developer",
    challenge:
      "Build both a social application and the infrastructure needed to run it.",
    architecture:
      "Frontend and backend components, database systems and deployment workflows supported by a configured Linux hosting environment.",
    result:
      "Founded and developed the platform, owning application architecture, frontend, backend and infrastructure.",
    stack: ["Linux", "Frontend", "Backend", "Databases", "Deployment"],
  },
] as const;
