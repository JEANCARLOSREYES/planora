import type { EditorNode } from "./types";
const text = (value: string): EditorNode => ({ type: "text", text: value });
const paragraph = (value = ""): EditorNode => ({
  type: "paragraph",
  ...(value ? { content: [text(value)] } : {}),
});
const heading = (value: string): EditorNode => ({
  type: "heading",
  attrs: { level: 2 },
  content: [text(value)],
});
export const templates = [
  {
    id: "blank",
    name: "Blank page",
    icon: "📄",
    color: "indigo",
    category: "Essentials",
    description: "A little space for your next big idea.",
    sections: [],
  },
  {
    id: "weekly",
    name: "Weekly Planner",
    icon: "🗓️",
    color: "ocean",
    category: "Planning",
    description: "Make room for what matters, one week at a time.",
    sections: [
      "Weekly Goals",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Weekend",
      "Notes",
    ],
  },
  {
    id: "meeting",
    name: "Meeting Notes",
    icon: "💬",
    color: "rose",
    category: "Work",
    description: "Turn good conversations into clear next steps.",
    sections: [
      "Date",
      "Attendees",
      "Agenda",
      "Notes",
      "Decisions",
      "Action Items",
    ],
  },
  {
    id: "project",
    name: "Project Planner",
    icon: "🚀",
    color: "indigo",
    category: "Work",
    description: "Bring the big picture and the small details together.",
    sections: [
      "Project Overview",
      "Goals",
      "Timeline",
      "Tasks",
      "Risks",
      "Notes",
    ],
  },
  {
    id: "study",
    name: "Study Planner",
    icon: "🎓",
    color: "forest",
    category: "Learning",
    description: "A calmer semester starts with a clear plan.",
    sections: [
      "Courses",
      "Assignments",
      "Exams",
      "Study Goals",
      "Weekly Tasks",
    ],
  },
] as const;
export function templateContent(templateId: string): EditorNode {
  const template =
    templates.find((item) => item.id === templateId) ?? templates[0];
  return {
    type: "doc",
    content: template.sections.length
      ? template.sections.flatMap((section) => [heading(section), paragraph()])
      : [paragraph()],
  };
}
export const welcomeContent: EditorNode = {
  type: "doc",
  content: [
    paragraph(
      "A clear space for a full life. Planora brings your ideas, plans, and everyday tasks into one place.",
    ),
    heading("Make yourself at home"),
    {
      type: "bulletList",
      content: [
        "Create a page for anything on your mind.",
        "Type / in your notes to explore blocks and formatting.",
        "Keep your next steps in Tasks. Switch between table, board, and calendar.",
        "Press ⌘K or Ctrl+K to find anything and jump between views.",
      ].map((value) => ({ type: "listItem", content: [paragraph(value)] })),
    },
    heading("Your space, your rhythm"),
    paragraph(
      "Start with a template, favorite the pages you return to, and make room for the work that matters. Everything is saved in your local workspace.",
    ),
    {
      type: "blockquote",
      content: [paragraph("Progress begins with a little clarity.")],
    },
  ],
};
