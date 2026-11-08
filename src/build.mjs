// Reads content/*.json, checks it, and writes the finished site to dist/.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderFavicon, renderNotFound, renderPage, renderRobots, renderSitemap } from "./template.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const problems = [];

function readJson(name) {
  const file = `content/${name}.json`;
  // Windows Notepad can add an invisible BOM, which JSON.parse rejects.
  const text = readFileSync(join(root, file), "utf8").replace(/^﻿/, "");
  try {
    return JSON.parse(text);
  } catch (error) {
    const position = error.message.match(/position (\d+)/);
    const line = position ? text.slice(0, Number(position[1])).split("\n").length : null;
    const reason = error.message.replace(/ in JSON.*$/, "").replace(/ \(line.*$/, "");
    // JSON only notices a missing comma at the next item, so the mistake can be on the line before.
    problems.push(`${file}${line ? ` near line ${line}` : " near the end"}: ${reason}. Check for a missing comma, quote or bracket.`);
    return null;
  }
}

function loadIcons() {
  const dir = join(root, "public/icons");
  const icons = new Map();
  for (const file of readdirSync(dir).filter((name) => name.endsWith(".svg"))) {
    icons.set(file.slice(0, -4), readFileSync(join(dir, file), "utf8").trim());
  }
  return icons;
}

// `fields` lists what must be filled in. `where` tells you which entry is wrong.
function requireFields(entry, fields, where) {
  for (const field of fields) {
    const value = entry?.[field];
    if (value === undefined || value === null || value === "") problems.push(`${where}: missing "${field}"`);
  }
}

function validate(content, icons) {
  const { site, projects, skills, publications, honors, education } = content;

  // Everything below assumes these are lists, so check that first.
  for (const name of ["projects", "skills", "publications", "honors"]) {
    if (!Array.isArray(content[name])) problems.push(`content/${name}.json: should be a list starting with [ and ending with ]`);
  }
  if (problems.length > 0) return;

  const checkIcon = (name, where) => {
    if (name && !icons.has(name)) {
      problems.push(`${where}: no icon called "${name}". Add public/icons/${name}.svg or use one of: ${[...icons.keys()].sort().join(", ")}`);
    }
  };

  requireFields(site, ["url", "name", "initials", "status", "role", "bio", "accent", "email", "github", "linkedin"], "content/site.json");
  requireFields(site?.contact, ["heading", "text"], 'content/site.json "contact"');
  if (site?.accent && !/^#[0-9a-f]{6}$/i.test(site.accent)) {
    problems.push(`content/site.json: "accent" should look like #1f4e8c, got "${site.accent}"`);
  }
  if (site?.photo && !existsSync(join(root, "public", site.photo))) {
    problems.push(`content/site.json: photo not found at public/${site.photo}`);
  }
  for (const [i, stat] of (site?.stats ?? []).entries()) {
    const where = `content/site.json stat ${i + 1}`;
    requireFields(stat, ["label"], where);
    if (stat.value === undefined && stat.count === undefined) problems.push(`${where}: needs "value" or "count"`);
    if (stat.count !== undefined && !(stat.count in counts(content))) {
      problems.push(`${where}: "count" must be one of ${Object.keys(counts(content)).join(", ")}`);
    }
  }

  for (const [i, project] of projects.entries()) {
    const where = `content/projects.json project ${i + 1}${project?.title ? ` "${project.title}"` : ""}`;
    requireFields(project, ["title", "kind", "icon", "description"], where);
    checkIcon(project?.icon, where);
    if (project?.github && !/^https:\/\/github\.com\/[^\s"]+$/.test(project.github)) {
      problems.push(`${where}: "github" should look like https://github.com/r2sakib/repo-name`);
    }
    if (project?.link) problems.push(`${where}: "link" was renamed, use "github" instead`);
    for (const tag of project?.tech ?? []) {
      if (typeof tag === "string") continue;
      requireFields(tag, ["label"], `${where} tech`);
      checkIcon(tag?.icon, where);
    }
  }

  for (const [i, group] of skills.entries()) {
    const where = `content/skills.json group ${i + 1}${group?.group ? ` "${group.group}"` : ""}`;
    requireFields(group, ["group", "items"], where);
    for (const skill of group?.items ?? []) {
      requireFields(skill, ["name"], where);
      checkIcon(skill?.icon, where);
    }
  }

  for (const [i, paper] of publications.entries()) {
    requireFields(paper, ["venue", "date", "title"], `content/publications.json entry ${i + 1}`);
  }

  for (const [i, honor] of honors.entries()) {
    requireFields(honor, ["year", "title", "detail"], `content/honors.json entry ${i + 1}`);
  }

  if (education?.education) requireFields(education.education, ["dates", "title", "place"], 'content/education.json "education"');
  if (education?.volunteering) requireFields(education.volunteering, ["dates", "title", "text"], 'content/education.json "volunteering"');
}

// What a stat can count with { "count": "projects" }.
function counts({ projects, publications, honors, skills }) {
  return {
    projects: projects.length,
    publications: publications.length,
    honors: honors.length,
    skills: skills.reduce((total, group) => total + (group.items?.length ?? 0), 0),
  };
}

function stopIfProblems() {
  if (problems.length === 0) return;
  console.error(`\nThe site was not built. Fix ${problems.length === 1 ? "this" : "these"} first:\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error("");
  process.exit(1);
}

const content = Object.fromEntries(
  ["site", "projects", "skills", "publications", "honors", "education"].map((name) => [name, readJson(name)])
);
stopIfProblems();

const icons = loadIcons();
validate(content, icons);
stopIfProblems();

// Only touch dist/ once the content is known to be good.
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);
cpSync(join(root, "public"), dist, { recursive: true });
cpSync(join(root, "src/style.css"), join(dist, "style.css"));
writeFileSync(join(dist, "index.html"), renderPage(content, { icons, counts: counts(content), year: new Date().getFullYear() }));
writeFileSync(join(dist, "404.html"), renderNotFound(content.site));
writeFileSync(join(dist, "favicon.svg"), renderFavicon(content.site));
writeFileSync(join(dist, "robots.txt"), renderRobots(content.site));
writeFileSync(join(dist, "sitemap.xml"), renderSitemap(content.site));

console.log(`Built dist/: ${content.projects.length} projects, ${content.publications.length} publications, ${content.honors.length} honors.`);
