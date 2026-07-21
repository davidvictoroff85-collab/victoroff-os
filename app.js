document.getElementById("year").textContent = String(new Date().getFullYear());

const links = [...document.querySelectorAll("nav a[href^='#']")];
const sections = links
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const observer = new IntersectionObserver(
  (entries) => {
    const current = entries.find((entry) => entry.isIntersecting);
    if (!current) return;

    links.forEach((link) => {
      const active = link.getAttribute("href") === `#${current.target.id}`;
      link.toggleAttribute("aria-current", active);
    });
  },
  { rootMargin: "-30% 0px -60%", threshold: 0 }
);

sections.forEach((section) => observer.observe(section));
