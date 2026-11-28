"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Film, ImagePlus, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { savePortfolioItem, uploadPortfolioMedia } from "./actions";

/**
 * Where to load a preview from: our uploads are served by this app too;
 * other site paths (/projects/…, /media/medical/…) live on the website.
 */
const makePreview = (siteUrl) => (u) =>
  !u || u.startsWith("/media/portfolio/") || !u.startsWith("/") ? u : `${siteUrl}${u}`;

function useUploader() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const upload = async (fileList) => {
    if (!fileList?.length) return [];
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      for (const f of fileList) fd.append("files", f);
      const res = await uploadPortfolioMedia(fd);
      if (res?.error) { setError(res.error); return []; }
      return res.files;
    } catch (e) {
      setError(e.message || "Upload failed.");
      return [];
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, upload };
}

function UploadButton({ accept, multiple, onFiles, busy, children }) {
  const ref = useRef(null);
  return (
    <>
      <input ref={ref} type="file" accept={accept} multiple={multiple} hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
      <button type="button" disabled={busy} onClick={() => ref.current?.click()} className="btn btn-ghost btn-sm">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} {children}
      </button>
    </>
  );
}

const move = (list, i, d) => {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

export default function PortfolioEditor({ item, categories, projects, siteUrl, saved }) {
  const [state, action, pending] = useActionState(savePortfolioItem, null);
  const preview = makePreview(siteUrl);
  const [banner, setBanner] = useState(item?.banner || "");
  const [images, setImages] = useState(item?.images || []);
  const [groups, setGroups] = useState(item?.videoGroups || []);
  const [urlDraft, setUrlDraft] = useState("");
  const coverUp = useUploader(), galleryUp = useUploader(), videoUp = useUploader();
  const [videoTarget, setVideoTarget] = useState(null);

  const setGroup = (gi, patch) => setGroups((gs) => gs.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  const setVideo = (gi, vi, patch) => setGroup(gi, { videos: groups[gi].videos.map((v, i) => (i === vi ? { ...v, ...patch } : v)) });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("banner", banner);
        fd.set("images", JSON.stringify(images));
        fd.set("videoGroups", JSON.stringify(groups));
        startTransition(() => action(fd));
      }}
      className="space-y-6"
    >
      {item?.id && <input type="hidden" name="id" value={item.id} />}
      {saved && !state && <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">Saved. {item?.published ? "The website updates within a minute." : "It's hidden — tick “Show on website” to publish."}</p>}

      {/* Basics */}
      <section className="card grid gap-4 p-5 md:grid-cols-2">
        <h2 className="text-sm font-semibold md:col-span-2">Basics</h2>
        <label className="block md:col-span-2"><span className="mb-1.5 block text-xs text-mute">Title *</span>
          <input name="title" required defaultValue={item?.title} className="input" placeholder="e.g. Clinica Joelle — Doctor films" /></label>
        <label className="block"><span className="mb-1.5 block text-xs text-mute">Category (website filter) *</span>
          <select name="category" required defaultValue={item?.category || ""} className="input">
            <option value="" disabled>Choose…</option>
            {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select></label>
        <label className="block"><span className="mb-1.5 block text-xs text-mute">Web address</span>
          <div className="flex items-center rounded-[0.6rem] border border-line bg-ink pl-3 text-sm text-mute focus-within:border-gold">
            <span className="whitespace-nowrap">/projects/</span>
            <input name="slug" defaultValue={item?.slug} placeholder="from the title" className="w-full bg-transparent px-1 py-2.5 text-bone outline-none" />
          </div></label>
        <label className="block"><span className="mb-1.5 block text-xs text-mute">Service label</span>
          <input name="service" defaultValue={item?.service} className="input" placeholder="e.g. video-production" /></label>
        <label className="block"><span className="mb-1.5 block text-xs text-mute">Year</span>
          <input name="year" defaultValue={item?.year || String(new Date().getFullYear())} className="input" /></label>
        <label className="block md:col-span-2"><span className="mb-1.5 block text-xs text-mute">Short description (cards, Google)</span>
          <textarea name="description" rows={2} defaultValue={item?.description} className="input" /></label>
        <label className="block md:col-span-2"><span className="mb-1.5 block text-xs text-mute">Tagline (optional, video pages)</span>
          <input name="tagline" defaultValue={item?.tagline || ""} className="input" /></label>
        <label className="block md:col-span-2"><span className="mb-1.5 block text-xs text-mute">Overview (optional)</span>
          <textarea name="content" rows={4} defaultValue={item?.content || ""} className="input" /></label>
        <label className="block md:col-span-2"><span className="mb-1.5 block text-xs text-mute">Result (optional)</span>
          <textarea name="result" rows={2} defaultValue={item?.result || ""} className="input" /></label>
        <label className="block"><span className="mb-1.5 block text-xs text-mute">Live link</span>
          <input name="link" defaultValue={item?.link || ""} className="input" placeholder="https://…" /></label>
        <label className="block"><span className="mb-1.5 block text-xs text-mute">GitHub</span>
          <input name="github" defaultValue={item?.github || ""} className="input" placeholder="https://github.com/…" /></label>
        <label className="block md:col-span-2"><span className="mb-1.5 block text-xs text-mute">Tools / tech (comma separated)</span>
          <input name="tech" defaultValue={(item?.tech || []).join(", ")} className="input" placeholder="Next.js, Figma, Adobe Premiere" /></label>
        <label className="block md:col-span-2"><span className="mb-1.5 block text-xs text-mute">Linked CRM project</span>
          <select name="projectId" defaultValue={item?.projectId || ""} className="input">
            <option value="">— Not linked —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}{p.client ? ` · ${p.client}` : ""}</option>)}
          </select></label>
      </section>

      {/* Cover */}
      <section className="card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Cover image <span className="font-normal text-mute">— shown on the portfolio card</span></h2>
          <UploadButton accept="image/*" busy={coverUp.busy} onFiles={async (f) => { const [u] = await coverUp.upload(f); if (u) setBanner(u.src); }}>Upload cover</UploadButton>
        </div>
        {coverUp.error && <p className="mb-2 text-sm text-red-300">{coverUp.error}</p>}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-ink ring-1 ring-line sm:w-80">
            {banner ? <img src={preview(banner)} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-mute">No cover — the first video's frame is used</div>}
          </div>
          <div className="flex-1 space-y-2">
            <input value={banner} onChange={(e) => setBanner(e.target.value)} placeholder="…or paste an image URL" className="input text-sm" />
            {banner && <button type="button" onClick={() => setBanner("")} className="text-xs text-mute hover:text-red-300">Remove cover</button>}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Gallery <span className="font-normal text-mute">— {images.length} image{images.length === 1 ? "" : "s"}</span></h2>
          <UploadButton accept="image/*" multiple busy={galleryUp.busy} onFiles={async (f) => { const up = await galleryUp.upload(f); setImages((xs) => [...xs, ...up.map((u) => u.src)]); }}>Upload images</UploadButton>
        </div>
        {galleryUp.error && <p className="mb-2 text-sm text-red-300">{galleryUp.error}</p>}
        {images.length > 0 && (
          <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {images.map((src, i) => (
              <li key={`${src}-${i}`} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-ink ring-1 ring-line">
                <img src={preview(src)} alt="" loading="lazy" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/70 p-1 opacity-0 transition group-hover:opacity-100">
                  <span className="flex gap-1">
                    <button type="button" onClick={() => setImages(move(images, i, -1))} className="rounded p-1 hover:bg-white/10" aria-label="Move left"><ArrowUp size={13} className="-rotate-90" /></button>
                    <button type="button" onClick={() => setImages(move(images, i, 1))} className="rounded p-1 hover:bg-white/10" aria-label="Move right"><ArrowDown size={13} className="-rotate-90" /></button>
                  </span>
                  <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))} className="rounded p-1 text-red-300 hover:bg-white/10" aria-label="Remove"><X size={14} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} placeholder="Add an image by URL" className="input text-sm" />
          <button type="button" onClick={() => { if (urlDraft.trim()) { setImages([...images, urlDraft.trim()]); setUrlDraft(""); } }} className="btn btn-ghost btn-sm"><ImagePlus size={14} />Add</button>
        </div>
      </section>

      {/* Videos */}
      <section className="card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Videos <span className="font-normal text-mute">— grouped by client, each group is a titled player on the page</span></h2>
          <button type="button" onClick={() => setGroups([...groups, { title: "", videos: [] }])} className="btn btn-ghost btn-sm"><Plus size={14} />Add group</button>
        </div>
        {videoUp.error && <p className="mb-2 text-sm text-red-300">{videoUp.error}</p>}
        {groups.length === 0 && <p className="text-sm text-mute">No videos. Add a group to show a video player on this project's page.</p>}
        <div className="space-y-4">
          {groups.map((g, gi) => (
            <div key={gi} className="rounded-xl border border-line bg-panel-2 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <input value={g.title} onChange={(e) => setGroup(gi, { title: e.target.value })} placeholder="Group title, e.g. Clinica Joelle" className="input max-w-sm text-sm" />
                <span className="text-xs text-mute">{g.videos.length} video{g.videos.length === 1 ? "" : "s"}</span>
                <span className="ml-auto flex gap-2">
                  <UploadButton accept="video/mp4,video/quicktime,video/webm" multiple busy={videoUp.busy && videoTarget === gi} onFiles={async (f) => {
                    setVideoTarget(gi);
                    const up = await videoUp.upload(f);
                    setGroups((gs) => gs.map((x, i) => (i === gi ? { ...x, videos: [...x.videos, ...up.map((u) => ({ title: u.name.replace(/\.[^.]+$/, ""), src: u.src, poster: u.poster, fallbacks: [] }))] } : x)));
                  }}>Upload videos</UploadButton>
                  <button type="button" onClick={() => confirm("Remove this group and its videos?") && setGroups(groups.filter((_, i) => i !== gi))} className="btn btn-danger btn-sm"><Trash2 size={13} /></button>
                </span>
              </div>
              {videoUp.busy && videoTarget === gi && <p className="mb-2 text-xs text-gold">Uploading and preparing for fast playback… large files take a minute.</p>}
              <ul className="space-y-2">
                {g.videos.map((v, vi) => (
                  <li key={`${v.src}-${vi}`} className="flex flex-wrap items-center gap-3 rounded-lg bg-ink/60 p-2">
                    <div className="h-12 w-20 shrink-0 overflow-hidden rounded bg-ink ring-1 ring-line">
                      {v.poster ? <img src={preview(v.poster)} alt="" className="h-full w-full object-cover" /> : <Film size={18} className="m-auto mt-3 text-mute" />}
                    </div>
                    <input value={v.title} onChange={(e) => setVideo(gi, vi, { title: e.target.value })} className="input min-w-40 flex-1 py-1.5 text-sm" aria-label="Video title" />
                    <a href={preview(v.src)} target="_blank" className="text-xs text-mute hover:text-gold">Play</a>
                    <span className="flex gap-1">
                      <button type="button" onClick={() => setGroup(gi, { videos: move(g.videos, vi, -1) })} className="rounded p-1.5 text-mute hover:bg-white/5" aria-label="Move up"><ArrowUp size={14} /></button>
                      <button type="button" onClick={() => setGroup(gi, { videos: move(g.videos, vi, 1) })} className="rounded p-1.5 text-mute hover:bg-white/5" aria-label="Move down"><ArrowDown size={14} /></button>
                      <button type="button" onClick={() => setGroup(gi, { videos: g.videos.filter((_, j) => j !== vi) })} className="rounded p-1.5 text-red-300 hover:bg-white/5" aria-label="Remove video"><X size={14} /></button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Publish */}
      <section className="card flex flex-wrap items-center gap-4 p-5">
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="published" defaultChecked={item?.published} className="h-4 w-4 accent-[#EAB877]" />
          <span><span className="font-semibold">Show on website</span><span className="block text-xs text-mute">Hidden items stay here as drafts.</span></span>
        </label>
        <div className="ml-auto flex items-center gap-3">
          {item?.id && item.published && <a href={`${siteUrl}/projects/${item.slug}`} target="_blank" className="btn btn-ghost">View on website</a>}
          <button type="submit" disabled={pending || coverUp.busy || galleryUp.busy || videoUp.busy} className="btn btn-primary">
            {pending && <Loader2 size={15} className="animate-spin" />}{item?.id ? "Save" : "Create"}
          </button>
        </div>
        {state?.error && <p className="w-full text-sm text-red-300">{state.error}</p>}
      </section>
    </form>
  );
}
