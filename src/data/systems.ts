export const systems = [
  {
    id: "linux",
    name: "Linux",
    caption: "The foundation",
    level: "Production experience",
    description:
      "Provisioning, maintaining and troubleshooting enterprise Linux systems. From service failures and package dependencies to SELinux policies and performance analysis.",
    technologies: [
      "AlmaLinux",
      "CentOS",
      "RHEL-based systems",
      "Ubuntu",
      "systemd",
      "LVM",
    ],
    position: [-1.7, 1.2, 0.1],
  },
  {
    id: "web",
    name: "Web infrastructure",
    caption: "Every request matters",
    level: "Production experience",
    description:
      "Operating customer-facing web platforms, reverse proxies and high-traffic WordPress environments. Diagnosing PHP-FPM, TLS and application performance issues.",
    technologies: [
      "Nginx",
      "Apache",
      "LiteSpeed",
      "PHP-FPM",
      "SSL / TLS",
      "WordPress",
    ],
    position: [0.1, 1.9, -0.5],
  },
  {
    id: "data",
    name: "Databases",
    caption: "State, stored carefully",
    level: "Production experience",
    description:
      "Database service administration, query and connectivity troubleshooting. Redis and OPcache caching within the SCB hosting architecture.",
    technologies: ["MariaDB", "MySQL", "MSSQL", "Redis", "OPcache"],
    position: [1.7, 0.9, 0.2],
  },
  {
    id: "security",
    name: "Security",
    caption: "Trust has an architecture",
    level: "Production experience",
    description:
      "Linux hardening, least-privilege access, vulnerability remediation and security incident investigation across production services.",
    technologies: [
      "SELinux",
      "SSH hardening",
      "Firewalls",
      "Fortigate",
      "TLS",
      "Patch management",
    ],
    position: [1.5, -1.0, 0.0],
  },
  {
    id: "automation",
    name: "Automation",
    caption: "Less repetition. More reliability.",
    level: "Applied automation",
    description:
      "Scripts and container workflows that turn operational work into repeatable systems. Automated provisioning, deployment and WordPress management.",
    technologies: [
      "Bash",
      "Python",
      "PowerShell",
      "Docker",
      "Docker Compose",
      "wp-cli",
    ],
    position: [-0.2, -1.6, 0.7],
  },
  {
    id: "cloud",
    name: "Cloud & virtualization",
    caption: "Infrastructure that can evolve",
    level: "Virtualization experience · Cloud fundamentals",
    description:
      "Hands-on VMware, Proxmox and SolusVM operations. Developing AWS, Azure, Kubernetes, Terraform and Ansible expertise at a fundamentals level.",
    technologies: [
      "VMware ESXi / vCenter",
      "Proxmox VE",
      "SolusVM",
      "AWS fundamentals",
      "Terraform fundamentals",
      "Ansible fundamentals",
      "Kubernetes fundamentals",
    ],
    position: [-1.8, -0.5, -0.5],
  },
  {
    id: "monitoring",
    name: "Monitoring",
    caption: "Understand before you intervene",
    level: "Production experience",
    description:
      "Infrastructure health, capacity monitoring and alert response. Following incidents through investigation, root cause analysis and preventive improvements.",
    technologies: [
      "Grafana",
      "Metrics & logs",
      "RCA",
      "Incident response",
      "SLA operations",
    ],
    position: [0, 0.1, 1.1],
  },
] as const;
