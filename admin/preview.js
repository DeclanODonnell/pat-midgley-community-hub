(function () {
  const CMS = window.CMS;
  if (!CMS) {
    return;
  }

  const h = window.h || CMS.h;
  const createClass = window.createClass || CMS.createClass;

  const formatDate = (value) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const mapItems = (items) => {
    if (!items) return [];
    if (items.toJS) return items.toJS();
    if (Array.isArray(items)) return items;
    return [];
  };

  const resolveImage = (image, getAsset) => {
    if (!image) return "";
    const asset = getAsset ? getAsset(image) : image;
    if (!asset) return "";
    const url = asset.toString ? asset.toString() : String(asset);
    if (!url) return "";
    // Relative paths fail in the preview iframe (/admin/ context) — make them absolute
    if (!url.startsWith("/") && !url.startsWith("http") && !url.startsWith("blob:")) {
      return "/" + url;
    }
    return url;
  };

  const buildPreviewCard = (item, label, getAsset, index) => {
    const title = item.title || "Untitled event";
    const time = item.time || "";
    const description = item.description || "";
    const image = resolveImage(item.image, getAsset);

    return h(
      "article",
      { className: "preview-card", key: `${title}-${index}` },
      image ? h("div", { className: "preview-media" }, h("img", { src: image, alt: title })) : null,
      label ? h("span", { className: "preview-pill" }, label) : null,
      h("strong", null, title),
      time ? h("span", { className: "preview-time" }, time) : null,
      description ? h("p", { className: "preview-muted" }, description) : null
    );
  };

  const buildPreviewSection = (title, description, items) =>
    h(
      "section",
      { className: "preview-section" },
      h(
        "div",
        { className: "preview-header" },
        h("h3", null, title),
        h("p", null, description)
      ),
      h("div", { className: "preview-grid" }, items.length ? items : h("p", null, "Nothing added yet."))
    );

  const buildNewsPreviewItem = (post, getAsset, index) => {
    const title = post.title || "Untitled update";
    const dateLabel = post.date_label || "";
    const image = resolveImage(post.image, getAsset);
    const bodyText = post.summary || post.body || "";
    const paragraphs = bodyText
      ? bodyText
          .split(/\n\s*\n/)
          .map((text) => text.trim())
          .filter(Boolean)
      : mapItems(post.paragraphs)
          .map((entry) =>
            typeof entry === "string" ? entry : entry && entry.text ? entry.text : ""
          )
          .map((text) => text.trim())
          .filter(Boolean);
    const previewText = paragraphs.slice(0, 2);

    return h(
      "article",
      { className: "preview-news-item", key: `${title}-${index}` },
      image
        ? h(
            "div",
            { className: "preview-news-media" },
            h("img", { src: image, alt: title })
          )
        : null,
      h(
        "div",
        { className: "preview-news-body" },
        dateLabel ? h("span", { className: "preview-pill" }, dateLabel) : null,
        h("strong", null, title),
        previewText.map((text, idx) => h("p", { className: "preview-muted", key: idx }, text))
      )
    );
  };

  const WhatsOnPreview = createClass({
    render: function () {
      const entry = this.props.entry;
      const getAsset = this.props.getAsset;
      const itemsList = mapItems(entry.getIn(["data", "items"]));
      const weeklySchedule = mapItems(entry.getIn(["data", "weekly_schedule"]));
      const oneOffEvents = mapItems(entry.getIn(["data", "one_off_events"]));
      const weekly = mapItems(entry.getIn(["data", "weekly"]));
      const oneTime = mapItems(entry.getIn(["data", "one_time"]));

      const fallbackWeekly = itemsList.filter((item) => (item.type || item.kind) !== "one_time");
      const fallbackOneOff = itemsList.filter((item) => (item.type || item.kind) === "one_time");
      const weeklyItems = weeklySchedule.length ? weeklySchedule : weekly.length ? weekly : fallbackWeekly;
      const oneOffItems = oneOffEvents.length ? oneOffEvents : oneTime.length ? oneTime : fallbackOneOff;

      const oneOffCards = oneOffItems.map((item, index) =>
        buildPreviewCard(item, formatDate(item.date), getAsset, index)
      );
      const weeklyCards = weeklyItems.map((item, index) =>
        buildPreviewCard(item, item.day || "", getAsset, index)
      );

      return h(
        "div",
        { className: "preview-wrap" },
        h(
          "div",
          { className: "preview-header" },
          h("h2", null, "What's On page preview"),
          h("p", null, "This preview shows how your updates will look on the website before you save them.")
        ),
        buildPreviewSection("One-off events", "These are the special one-off events people will see.", oneOffCards),
        buildPreviewSection("Weekly schedule", "This is the regular weekly timetable people will see.", weeklyCards)
      );
    },
  });

  const NewsPreview = createClass({
    render: function () {
      const entry = this.props.entry;
      const getAsset = this.props.getAsset;
      const posts = mapItems(entry.getIn(["data", "posts"]));
      const items = posts.map((post, index) => buildNewsPreviewItem(post, getAsset, index));

      return h(
        "div",
        { className: "preview-wrap" },
        h(
          "div",
          { className: "preview-header" },
          h("h2", null, "News & Updates page preview"),
          h("p", null, "This preview shows how your news story will look on the website before you save it.")
        ),
        h("div", { className: "preview-news-list" }, items.length ? items : h("p", null, "No updates yet."))
      );
    },
  });

  CMS.registerPreviewStyle("/admin/preview.css");
  // File collections use the file name for preview registration.
  CMS.registerPreviewTemplate("events", WhatsOnPreview);
  CMS.registerPreviewTemplate("posts", NewsPreview);
  // Keep collection registration for backwards compatibility.
  CMS.registerPreviewTemplate("whats_on", WhatsOnPreview);
  CMS.registerPreviewTemplate("news", NewsPreview);
})();
