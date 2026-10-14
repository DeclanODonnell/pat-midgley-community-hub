# 🏘️ Pat Midgley Community Hub

**Live site → [patmidgleyfoundation.com](https://patmidgleyfoundation.com)**

A 9-page website for the **Pat Midgley Foundation**, a community charity in Wybourn, Sheffield. I designed and built it through my studio, [DOD Web Studio](https://dodwebstudio.com). It's live, the client has signed it off, and I support it on an ongoing basis.

> This is a public showcase copy of the client project. The live site deploys from a separate private repository.

---

## ✨ What I delivered

- **Full rebrand**: logo, colour palette and typography applied across the whole site
- **9 pages**: Home, About, What's On, Room Hire, Book Online, News, Meet the Team, Wybourn Works and Contact, plus an FAQ
- **Self-service content management**: a [Decap CMS](https://decapcms.org) admin panel so non-technical staff can publish news, events and room-hire details without touching code
- **Content-driven pages**: page content lives in JSON files (`/data`) that the CMS edits, so the HTML stays clean
- **Production support**: diagnosed and fixed a live bug where CMS image uploads weren't appearing, then audited every image across all 9 pages

## 🛠️ Tech

| Area | Tools |
|---|---|
| Front end | HTML5, CSS3, vanilla JavaScript |
| Content | Decap CMS with JSON data files |
| Auth | Netlify Identity + Git Gateway (CMS login) |
| Hosting | Netlify with continuous deployment and a custom domain |

## 📁 Structure

```
├── index.html, about.html, …   # Site pages
├── styles.css / script.js      # Shared styling and behaviour
├── data/                       # JSON content edited through the CMS
├── images/                     # Site imagery and CMS uploads
└── admin/                      # Decap CMS config and custom admin styling
```

---

Built by **Declan O'Donnell**: [dodwebstudio.com](https://dodwebstudio.com) · [LinkedIn](https://www.linkedin.com/in/declan-o-donnell-592832357/) · [GitHub](https://github.com/DeclanODonnell)
