export const profile = {
  name: "Samet Kabakci",
  fullName: "Samet Kabakçı",
  title: "System Engineer",
  specialization: "Senior Linux Infrastructure Engineer · Cloud & DevOps",
  location: "İzmir, Türkiye",
  email: "info@sametkabakci.com",
  linkedin: "https://www.linkedin.com/in/sametkabakci/",
  github: "https://github.com/xsmtx",
  website: "https://sametkabakci.com",
  introduction: "I build the systems behind the experience.",
  summary:
    "Linux infrastructure, cloud platforms and automation. Built with care. Engineered to keep running.",
  about:
    "Senior Linux Infrastructure Engineer and Systems Administration Team Lead with 8+ years of hands-on experience managing production infrastructure, large-scale hosting platforms and customer-facing services.",
  education: [
    {
      school: "Celal Bayar University",
      subject: "Computer Software Engineering",
      period: "2012–2016",
    },
    {
      school: "Konak Atatürk Anatolian Vocational High School of Commerce",
      subject: "Information Technologies",
      period: "2006–2010",
    },
  ],
} as const;

export const scenes = [
  { id: "home", label: "Home", subtitle: "The point of origin" },
  { id: "systems", label: "Systems", subtitle: "Connected by design" },
  { id: "experience", label: "Experience", subtitle: "An evolving trajectory" },
  {
    id: "projects",
    label: "Projects",
    subtitle: "From architecture to reality",
  },
  { id: "lab", label: "Lab", subtitle: "Room for the unexpected" },
  { id: "contact", label: "Contact", subtitle: "The next connection" },
] as const;

export type SceneId = (typeof scenes)[number]["id"];
