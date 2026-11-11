import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./supabase-config.js";

const form = document.getElementById("community-profile-form");
if (form) {
  const grid = document.getElementById("community-profile-grid");
  const message = document.getElementById("profile-message");
  const saveButton = document.getElementById("profile-save");
  const count = document.getElementById("profile-count");
  const fields = {
    display_name: document.getElementById("profile-display-name"),
    x_username: document.getElementById("profile-x-username"),
    bio: document.getElementById("profile-bio"),
    avatar_url: document.getElementById("profile-avatar")
  };
  let supabase = null;
  let currentUser = null;

  function setMessage(text, type = "") {
    message.textContent = text;
    message.className = "profile-message" + (type ? " is-" + type : "");
  }
  function safeAvatar(value) {
    if (!value) return "";
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
    const imageUrl = safeAvatar(profile.avatar_url);
    if (imageUrl) {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = "";
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.onerror = () => { avatar.textContent = (profile.display_name || "M").slice(0,1).toUpperCase(); };
      avatar.appendChild(img);
    } else {
      avatar.textContent = (profile.display_name || "M").slice(0,1).toUpperCase();
    }
    const content = document.createElement("div");
    content.className = "profile-card-content";
    const name = document.createElement("div");
    name.className = "profile-card-name";
    name.textContent = profile.display_name;
    const bio = document.createElement("p");
    bio.className = "profile-card-bio";
    bio.textContent = profile.bio || "Exploring the MUISYLE universe.";
    content.append(name);
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
    content.appendChild(bio);
    card.append(avatar, content);
    return card;
  }
  async function loadProfiles() {
    const { data, error } = await supabase
      .from("community_profiles")
      .select("id,display_name,x_username,bio,avatar_url,points,created_at")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) {
      grid.innerHTML = "";
      const note = document.createElement("div");
      note.className = "profile-empty";
      note.textContent = "Community profiles are not ready yet. Please check the Supabase setup.";
      grid.appendChild(note);
      count.textContent = "— MEMBERS";
      return;
    }
    grid.innerHTML = "";
    count.textContent = data.length + (data.length === 1 ? " MEMBER" : " MEMBERS");
    if (!data.length) {
      const empty = document.createElement("div");
      empty.className = "profile-empty";
      empty.textContent = "No profiles yet. Be the first to join the MUISYLE universe.";
      grid.appendChild(empty);
      return;
    }
    data.forEach(profile => grid.appendChild(makeCard(profile)));
  }

  async function initialize() {
    if (!SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY.includes("PASTE_")) {
      setMessage("Setup needed: add your Supabase publishable key in supabase-config.js.", "error");
      grid.innerHTML = '<div class="profile-empty">The community directory will appear after Supabase is connected.</div>';
      return;
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    let { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const result = await supabase.auth.signInAnonymously();
      if (result.error) {
        setMessage("Enable Anonymous Sign-ins in Supabase Authentication settings, then reload.", "error");
        grid.innerHTML = '<div class="profile-empty">Anonymous profile access is not enabled yet.</div>';
        return;
      }
      session = result.data.session;
    }
    currentUser = session.user;
    const { data: ownProfile } = await supabase
      .from("community_profiles")
      .select("display_name,x_username,bio,avatar_url")
      .eq("id", currentUser.id)
      .maybeSingle();
    if (ownProfile) {
      fields.display_name.value = ownProfile.display_name || "";
      fields.x_username.value = ownProfile.x_username || "";
      fields.bio.value = ownProfile.bio || "";
      fields.avatar_url.value = ownProfile.avatar_url || "";
      saveButton.innerHTML = 'Update my profile <i data-lucide="arrow-up-right" class="inline-icon" aria-hidden="true"></i>';
      if (window.lucide) window.lucide.createIcons();
      setMessage("Your profile is saved and visible to the community.", "success");
    }
    await loadProfiles();
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!supabase || !currentUser) return;
    const displayName = fields.display_name.value.trim();
    const xUsername = fields.x_username.value.trim().replace(/^@/, "");
    const bio = fields.bio.value.trim();
    const avatarUrl = fields.avatar_url.value.trim();
    if (!displayName || displayName.length > 24) return setMessage("Display name must be 1–24 characters.", "error");
    if (xUsername && !/^[A-Za-z0-9_]{1,15}$/.test(xUsername)) return setMessage("Please enter a valid X username (letters, numbers, underscore; max 15).", "error");
    if (bio.length > 160) return setMessage("Bio must be 160 characters or fewer.", "error");
    if (avatarUrl && !safeAvatar(avatarUrl)) return setMessage("Avatar URL must start with http:// or https://.", "error");
    saveButton.disabled = true;
    setMessage("Saving your cosmic profile...");
    const { error } = await supabase.from("community_profiles").upsert({
      id: currentUser.id,
      display_name: displayName,
      x_username: xUsername || null,
      bio,
      avatar_url: avatarUrl || null
    }, { onConflict: "id" });
    saveButton.disabled = false;
    if (error) {
      setMessage(error.message.includes("community_profiles")
        ? "The profile table is not ready. Run the SQL setup in Supabase first."
        : "Could not save your profile. Please try again.", "error");
      return;
    }
    saveButton.innerHTML = 'Update my profile <i data-lucide="arrow-up-right" class="inline-icon" aria-hidden="true"></i>';
    if (window.lucide) window.lucide.createIcons();
    setMessage("Profile saved! It is now visible to the MUISYLE community.", "success");
    await loadProfiles();
  });

  initialize().catch(() => {
    setMessage("Could not connect to Supabase. Check your project configuration.", "error");
  });
}
