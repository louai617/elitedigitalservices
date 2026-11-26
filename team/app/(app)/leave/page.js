import { Palmtree } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { LEAVE_STATUS, LEAVE_TYPES, dohaDay, fmtDate } from "@/lib/format";
import { Avatar, Card, Empty, PageHeader, StatusBadge } from "@/components/ui";
import { ConfirmButton, SubmitButton } from "@/components/client-ui";
import { cancelLeave, requestLeave, reviewLeave } from "./actions";

export const metadata = { title: "Leave" };

const days = (r) => Math.round((r.end - r.start) / 864e5) + 1;
const range = (r) => (+r.start === +r.end ? fmtDate(r.start) : `${fmtDate(r.start)} – ${fmtDate(r.end)}`);
const userSel = { select: { id: true, name: true, color: true } };

export default async function LeavePage() {
  const me = await requireUser();
  const approver = can(me, "approveLeave");
  const today = new Date(`${dohaDay(new Date())}T00:00:00Z`);
  const year = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));

  const [mine, pending, upcoming] = await Promise.all([
    db.leaveRequest.findMany({ where: { userId: me.id }, orderBy: { start: "desc" }, take: 20, include: { reviewedBy: userSel } }),
    approver ? db.leaveRequest.findMany({ where: { status: "PENDING", NOT: { userId: me.id } }, orderBy: { start: "asc" }, include: { user: userSel } }) : [],
    db.leaveRequest.findMany({ where: { status: "APPROVED", end: { gte: today } }, orderBy: { start: "asc" }, take: 15, include: { user: userSel } }),
  ]);
  const usedThisYear = mine.filter((r) => r.status === "APPROVED" && r.type === "ANNUAL" && r.start >= year).reduce((s, r) => s + days(r), 0);

  return (
    <>
      <PageHeader title="Leave" subtitle={`${usedThisYear} day${usedThisYear === 1 ? "" : "s"} of annual leave taken this year`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {approver && (
            <Card title={`Waiting for approval · ${pending.length}`} bodyClass="">
              {pending.length === 0 ? <p className="px-5 py-5 text-sm text-mute">Nothing to approve.</p> : (
                <ul className="divide-y divide-line">
                  {pending.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                      <Avatar user={r.user} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{r.user.name} · {LEAVE_TYPES[r.type]}</p>
                        <p className="text-xs text-mute">{range(r)} · {days(r)} day{days(r) > 1 ? "s" : ""}{r.reason && ` · ${r.reason}`}</p>
                      </div>
                      <form className="flex gap-2">
                        <input type="hidden" name="id" value={r.id} />
                        <button formAction={reviewLeave.bind(null, "APPROVED")} className="btn btn-sm bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25">Approve</button>
                        <button formAction={reviewLeave.bind(null, "REJECTED")} className="btn btn-sm bg-red-500/10 text-red-300 hover:bg-red-500/20">Decline</button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <Card title="Who's off" bodyClass="">
            {upcoming.length === 0 ? <Empty icon={Palmtree} title="Everyone's in">Approved leave shows here and on the calendar.</Empty> : (
              <ul className="divide-y divide-line">
                {upcoming.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar user={r.user} size={28} />
                    <span className="flex-1 text-sm">{r.user.name} <span className="text-mute">· {LEAVE_TYPES[r.type]}</span></span>
                    <span className="text-xs text-mute">{range(r)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="My requests" bodyClass="">
            {mine.length === 0 ? <p className="px-5 py-5 text-sm text-mute">No requests yet.</p> : (
              <ul className="divide-y divide-line">
                {mine.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <span className="flex-1 text-sm">{LEAVE_TYPES[r.type]} <span className="text-mute">· {range(r)} · {days(r)}d</span></span>
                    <StatusBadge map={LEAVE_STATUS} value={r.status} />
                    {r.reviewedBy && <span className="text-xs text-mute">by {r.reviewedBy.name}</span>}
                    {r.status === "PENDING" && (
                      <form action={cancelLeave}><input type="hidden" name="id" value={r.id} /><ConfirmButton message="Cancel this request?">Cancel</ConfirmButton></form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card title="Request time off" className="h-fit">
          <form action={requestLeave} className="space-y-3">
            <select name="type" className="input">{Object.entries(LEAVE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1 block text-xs text-mute">From</span><input type="date" name="start" required className="input" /></label>
              <label className="block"><span className="mb-1 block text-xs text-mute">To</span><input type="date" name="end" required className="input" /></label>
            </div>
            <textarea name="reason" rows={2} placeholder="Note (optional)" className="input" />
            <SubmitButton>Send request</SubmitButton>
            <p className="text-xs text-mute">The CEO, project manager or an admin approves it. Pending requests show dashed on the calendar.</p>
          </form>
        </Card>
      </div>
    </>
  );
}
