"use client";
import { useState } from "react";
import { ArrowRight, Sparkles, Plus, Check } from "lucide-react";
import { templates } from "@/lib/templates";
import { useWorkspace } from "@/components/layout/workspace-context";
export function TemplateGallery() {
  const { openPage } = useWorkspace();
  const [category, setCategory] = useState("All templates");
  const filtered = templates.filter(
    (template) =>
      category === "All templates" || template.category === category,
  );
  return (
    <div className="content-wrap templates-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="accent-dot" />A THOUGHTFUL HEAD START
          </div>
          <h1>A little structure. Endless possibility.</h1>
          <p>
            Make it yours. Every template becomes a real, editable page in your
            workspace.
          </p>
        </div>
        <span className="template-heading-icon">
          <Sparkles size={28} />
        </span>
      </div>
      <div className="template-filters" aria-label="Filter templates">
        {["All templates", "Essentials", "Planning", "Work", "Learning"].map(
          (value) => (
            <button
              key={value}
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
            >
              {value}
            </button>
          ),
        )}
      </div>
      <div className="template-grid">
        {filtered.map((template) => (
          <button
            key={template.id}
            className="template-card"
            onClick={() => openPage(null, template.id)}
          >
            <div className={`template-preview cover-${template.color}`}>
              <div className="template-mini-page">
                <span>{template.icon}</span>
                <strong>{template.name}</strong>
                {template.sections.slice(0, 3).map((section) => (
                  <div key={section}>
                    <span>
                      <Check size={9} />
                    </span>
                    {section}
                  </div>
                ))}
                {!template.sections.length && (
                  <div className="blank-template-line">
                    <Plus size={15} />
                    Your ideas go here
                  </div>
                )}
              </div>
            </div>
            <div className="template-card-content">
              <span className="template-category">{template.category}</span>
              <h2>
                {template.icon} {template.name}
              </h2>
              <p>{template.description}</p>
              <span className="template-use">
                Use template
                <ArrowRight size={15} />
              </span>
            </div>
          </button>
        ))}
      </div>
      <p className="template-footnote">
        A starting point, never a constraint. Add, remove, and rearrange any
        block.
      </p>
    </div>
  );
}
