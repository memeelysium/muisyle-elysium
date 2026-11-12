/* MUISYLE Cosmic Identity — local-only profile storage.
   No Supabase, SQL, authentication, or external account is required. */
(() => {
  const form = document.getElementById("community-profile-form");
  if (!form) return;

  const STORAGE_KEY = "muisyle.cosmicIdentity.v1";
  const grid = document.getElementById("community-profile-grid");
  const message = document.getElementById("profile-message");
  const saveButton = document.getElementById("profile-save");
  const clearButton = document.getElementById("profile-clear");
  const count = document.getElementById("profile-count");
  const fields = {
    display_name: document.getElementById("profile-display-name"),
    x_username: document.getElementById("profile-x-username"),
    bio: document.getElementById("profile-bio"),
    avatar_url: document.getElementById("profile-avatar")
  };

  function readProfile() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return value && typeof value === "object" ? value : null;
    } catch { return null; }
  }

  function setMessage(text, type = "") {
    message.textContent = text;
    message.className = "profile-message" + (type ? " is-" + type : "");
  }

  function safeAvatar(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch { return ""; }
  }

  function makeCard(profile) {
    const card = document.createElement("article");
    card.className = "profile-card";
    const avatar = document.createElement("div");
    avatar.className = "profile-avatar";
    const imageUrl = safeAvatar(profile.avatar_url || "");
    if (imageUrl) {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = "";
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.onerror = () => { avatar.textContent = profile.display_name.slice(0, 1).toUpperCase(); };
      avatar.appendChild(img);
    } else {
      avatar.textContent = (profile.display_name || "M").slice(0, 1).toUpperCase();
    }

    const content = document.createElement("div");
    content.className = "profile-card-content";
    const name = document.createElement("div");
    name.className = "profile-card-name";
    name.textContent = profile.display_name;
    content.appendChild(name);

    if (profile.x_username) {
      const link = document.createElement("a");
      link.className = "profile-card-x";
      link.href = "https://x.com/" + encodeURIComponent(profile.x_username);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "@" + profile.x_username;
      const badge = document.createElement("span");
      badge.className = "profile-unverified";
      badge.textContent = "· UNVERIFIED";
      content.append(link, badge);
    }

    const bio = document.createElement("p");
    bio.className = "profile-card-bio";
    bio.textContent = profile.bio || "Exploring the MUISYLE universe.";
    content.appendChild(bio);
    card.append(avatar, content);
    return card;
  }

  function render() {
    const profile = readProfile();
    grid.replaceChildren();
    if (!profile) {
      count.textContent = "0 MEMBERS";
      const empty = document.createElement("div");
      empty.className = "profile-empty";
      empty.textContent = "No identity on this device yet. Create yours to join the orbit.";
      grid.appendChild(empty);
      return;
    }
    count.textContent = "1 MEMBER";
    grid.appendChild(makeCard(profile));
    fields.display_name.value = profile.display_name || "";
    fields.x_username.value = profile.x_username || "";
    fields.bio.value = profile.bio || "";
    fields.avatar_url.value = profile.avatar_url || "";
    saveButton.innerHTML = 'Update my profile <i data-lucide="arrow-up-right" class="inline-icon" aria-hidden="true"></i>';
    clearButton.hidden = false;
    if (window.lucide) window.lucide.createIcons();
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    const displayName = fields.display_name.value.trim();
    const xUsername = fields.x_username.value.trim().replace(/^@/, "");
    const bio = fields.bio.value.trim();
    const avatarUrl = fields.avatar_url.value.trim();

    if (!displayName || displayName.length > 24) return setMessage("Display name must be 1–24 characters.", "error");
    if (xUsername && !/^[A-Za-z0-9_]{1,15}$/.test(xUsername)) return setMessage("Enter a valid X username (letters, numbers, underscore; max 15).", "error");
    if (bio.length > 160) return setMessage("Bio must be 160 characters or fewer.", "error");
    if (avatarUrl && !safeAvatar(avatarUrl)) return setMessage("Avatar URL must start with http:// or https://.", "error");

    const profile = { display_name: displayName, x_username: xUsername, bio, avatar_url: avatarUrl, updated_at: new Date().toISOString() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      render();
      setMessage("Cosmic Identity saved on this device.", "success");
    } catch {
      setMessage("Your browser could not save this profile. Check available site storage.", "error");
    }
  });

  clearButton.addEventListener("click", () => {
    if (!window.confirm("Remove your MUISYLE profile from this device?")) return;
    localStorage.removeItem(STORAGE_KEY);
    form.reset();
    saveButton.innerHTML = 'Create my profile <i data-lucide="arrow-up-right" class="inline-icon" aria-hidden="true"></i>';
    clearButton.hidden = true;
    render();
    setMessage("Your local profile has been removed.", "success");
    if (window.lucide) window.lucide.createIcons();
  });

  render();
  if (readProfile()) setMessage("Your Cosmic Identity is saved in this browser.", "success");
})();
