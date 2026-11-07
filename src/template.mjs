// Turns the content into HTML. No text lives here: it all comes from content/.

export const esc = (text) =>
  String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

// Escapes text, then turns [label](https://...) into a link.
const inline = (text) =>
  esc(text).replace(/\[([^\]]+)\]\(((?:https?:|mailto:)[^)\s]+)\)/g, '<a href="$2">$1</a>');

const pad = (number) => String(number).padStart(2, "0");
const shortUrl = (url) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

function iconRenderer(icons) {
  return (name, size) => {
    if (!name) return "";
    const svg = icons.get(name);
    // Line icons are inlined so they can take the text or accent colour.
    if (svg.includes("currentColor")) {
      return svg.replace("<svg ", `<svg width="${size}" height="${size}" aria-hidden="true" `);
    }
    return `<img src="icons/${esc(name)}.svg" alt="" width="${size}" height="${size}">`;
  };
}

const heading = (text, count) => `
<div class="section-head">
<h2><span class="hash">## </span>${esc(text)}</h2>
<span class="rule"></span>
${count === undefined ? "" : `<span class="count">${pad(count)}</span>`}
</div>`;

const titled = (entry) => (entry.link ? `<a href="${esc(entry.link)}">${esc(entry.title)}</a>` : esc(entry.title));

function projectCard(project, index, icon) {
  const tech = (project.tech ?? [])
    .map((tag) => (typeof tag === "string" ? { label: tag } : tag))
    .map((tag) => `<span class="tag">${icon(tag.icon, 13)}${esc(tag.label)}</span>`)
    .join("\n");
  const number = pad(index + 1);

  if (project.featured) {
    return `
<article class="project project-featured">
<div class="project-main">
<span class="project-icon">${icon(project.icon, 22)}</span>
<h3>${titled(project)}</h3>
<p>${esc(project.description)}</p>
</div>
<div class="project-side">
<span class="label">${number} · featured · ${esc(project.kind)}</span>
<span class="built-with">built with</span>
<div class="tags">
${tech}
</div>
</div>
</article>`;
  }

  return `
<article class="project">
<div class="project-top">
<span class="project-icon">${icon(project.icon, 20)}</span>
<span class="label">${number} · ${esc(project.kind)}</span>
</div>
<h3>${titled(project)}</h3>
<p>${esc(project.description)}</p>
<div class="tags tags-divided">
${tech}
</div>
</article>`;
}

const projectsSection = (projects, icon) => `
<section id="projects" class="section">
${heading("projects", projects.length)}
<div class="card-grid">
${projects.map((project, index) => projectCard(project, index, icon)).join("\n")}
</div>
</section>`;

const skillsSection = (skills, icon) => `
<section id="skills" class="section">
${heading("stack")}
<div class="skill-groups">
${skills
  .map(
    (group) => `
<div class="skill-group">
<span class="skill-name">${esc(group.group)}</span>
<div class="skill-items">
${group.items.map((skill) => `<span class="chip">${icon(skill.icon, 16)}${esc(skill.name)}</span>`).join("\n")}
</div>
</div>`
  )
  .join("\n")}
</div>
</section>`;

const publicationsSection = (publications, icon) => `
<section id="publications" class="section">
${heading("publications", publications.length)}
<div class="card-grid">
${publications
  .map(
    (paper) => `
<article class="paper">
<div class="paper-top">
<span class="paper-venue">${icon("paper", 16)}${esc(paper.venue)}</span>
<span class="paper-date">${esc(paper.date)}</span>
</div>
<h3>${titled(paper)}</h3>
</article>`
  )
  .join("\n")}
</div>
</section>`;

const honorsSection = (honors) => `
<section id="honors" class="section">
${heading("honors")}
<div class="honors">
${honors
  .map(
    (honor) => `
<div class="honor">
<span class="honor-year">${esc(honor.year)}</span>
<div class="honor-body"><strong>${esc(honor.title)}</strong><span>${inline(honor.detail)}</span></div>
</div>`
  )
  .join("\n")}
</div>
</section>`;

function educationSection({ education, volunteering }) {
  const card = (name, entry, body) => `
<article class="info">
<div class="info-top">
<span class="info-name"><span class="hash">## </span>${name}</span>
<span class="info-dates">${esc(entry.dates)}</span>
</div>
<h3>${esc(entry.title)}</h3>
${body}
</article>`;

  return `
<section id="education" class="card-grid">
${education ? card("education", education, `<p>${esc(education.place)}</p>${education.note ? `\n<p class="info-note">${esc(education.note)}</p>` : ""}`) : ""}
${volunteering ? card("volunteering", volunteering, `<p>${esc(volunteering.text)}</p>`) : ""}
</section>`;
}

function hero(site, statLine, icon) {
  const photo = site.photo
    ? `<img class="photo" src="${esc(site.photo)}" alt="${esc(site.name)}" width="98" height="98">`
    : `<span class="initials" role="img" aria-label="${esc(site.name)}">${esc(site.initials)}</span>`;

  return `
<div class="hero">
<div class="hero-id">
<div class="portrait">${photo}</div>
<div class="hero-name">
<span class="status"><span class="status-dot"></span>${esc(site.status)}</span>
<h1>${esc(site.name)}</h1>
<p class="role">${esc(site.role)}</p>
</div>
</div>
<p class="bio">${inline(site.bio)}</p>
<div class="actions">
<a class="button button-primary" href="mailto:${esc(site.email)}">${icon("mail", 16)}email me</a>
<a class="button" href="${esc(site.github)}">${icon("github", 16)}github</a>
<a class="button" href="${esc(site.linkedin)}">${icon("linkedin", 16)}linkedin</a>
</div>
</div>
${statLine}`;
}

function stats(site, counts) {
  if (!site.stats?.length) return "";
  const items = site.stats.map((stat) => {
    const value = stat.count === undefined ? stat.value : counts[stat.count];
    return `<div class="stat"><span class="stat-value">${esc(value)}</span><span class="stat-label">${esc(stat.label)}</span></div>`;
  });
  return `<div class="stats">\n${items.join("\n")}\n</div>`;
}

const contactSection = (site, icon) => `
<section id="contact" class="contact">
<div class="contact-text">
<span class="contact-prompt">$ ./contact.sh</span>
<h2>${esc(site.contact.heading)}</h2>
<p>${esc(site.contact.text)}</p>
</div>
<div class="contact-links">
<a class="contact-link contact-link-primary" href="mailto:${esc(site.email)}"><span class="contact-email">${esc(site.email)}</span><span aria-hidden="true">→</span></a>
<a class="contact-link" href="${esc(site.github)}"><span class="contact-label">${icon("github", 15)}${esc(shortUrl(site.github))}</span><span aria-hidden="true">↗</span></a>
<a class="contact-link" href="${esc(site.linkedin)}"><span>${esc(shortUrl(site.linkedin))}</span><span aria-hidden="true">↗</span></a>
</div>
</section>`;

// Served for any missing path, so its links start from the site root.
export const renderNotFound = (site) => `<!doctype html>
<html lang="en" style="--accent: ${esc(site.accent)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found — ${esc(site.name)}</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&amp;family=Geist+Mono:wght@400;500;700&amp;display=swap">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<div class="page">
<div class="topbar"><a class="brand" href="/">${esc(site.name)}</a></div>
<main>
<section class="contact">
<div class="contact-text">
<span class="contact-prompt">$ cd ./this-page</span>
<h1 class="not-found">404: page not found.</h1>
<p>This page doesn’t exist or has moved.</p>
</div>
<div class="contact-links">
<a class="contact-link contact-link-primary" href="/"><span>back to home</span><span aria-hidden="true">→</span></a>
</div>
</section>
</main>
</div>
</body>
</html>
`;

export const renderFavicon = (site) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${esc(site.accent)}"/><text x="16" y="22" fill="#f4f3ee" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="15" font-weight="700" text-anchor="middle">${esc(site.initials)}</text></svg>\n`;

export const renderRobots = (site) => `User-agent: *\nAllow: /\nSitemap: ${new URL("sitemap.xml", site.url).href}\n`;

export const renderSitemap = (site) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${esc(site.url)}</loc></url>
</urlset>
`;

export function renderPage(content, { icons, counts, year }) {
  const { site, projects, skills, publications, honors, education } = content;
  const icon = iconRenderer(icons);
  const description = site.bio.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  const imageUrl = site.photo ? new URL(site.photo, site.url).href : null;

  const nav = [
    ["#projects", "projects", projects.length],
    ["#skills", "stack", skills.length],
    ["#publications", "papers", publications.length],
    ["#honors", "honors", honors.length],
    ["#contact", "contact", 1],
  ]
    .filter(([, , size]) => size > 0)
    .map(([href, label]) => `<a href="${href}">${label}</a>`)
    .join("\n");

  return `<!doctype html>
<html lang="en" style="--accent: ${esc(site.accent)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(site.name)} — Portfolio</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(site.url)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(site.name)} — Portfolio">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(site.url)}">
${imageUrl ? `<meta property="og:image" content="${esc(imageUrl)}">` : ""}
<meta name="theme-color" content="#f3f1ea">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&amp;family=Geist+Mono:wght@400;500;700&amp;display=swap">
<link rel="stylesheet" href="style.css">
</head>
<body id="top">
<div class="page">

<div class="topbar">
<a class="brand" href="#top">${esc(site.name)}</a>
<nav aria-label="Sections">
${nav}
</nav>
</div>

<main>
${hero(site, stats(site, counts), icon)}
${projects.length ? projectsSection(projects, icon) : ""}
${skills.length ? skillsSection(skills, icon) : ""}
${publications.length ? publicationsSection(publications, icon) : ""}
${honors.length ? honorsSection(honors) : ""}
${education?.education || education?.volunteering ? educationSection(education) : ""}
${contactSection(site, icon)}
</main>

<footer>
<span>© ${year} ${esc(site.name)} · set in Geist &amp; Geist Mono</span>
<a href="#top">back to top ↑</a>
</footer>

</div>
</body>
</html>
`;
}
