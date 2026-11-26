// Create (or reset) an account from the server's terminal — used for the very
// first CEO / Project Manager account, before anyone can sign in.
//
//   node scripts/create-user.mjs                 (asks the questions)
//   node scripts/create-user.mjs --role PROJECT_MANAGER
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { Writable } from "node:stream";

const PALETTE = ["#EAB877", "#60A5FA", "#A78BFA", "#34D399", "#F87171", "#F472B6", "#FBBF24", "#22D3EE"];
const ROLES = ["CEO", "PROJECT_MANAGER", "ADMIN", "CREATIVE_DIRECTOR", "STAFF"];
const db = new PrismaClient();
// Everything readline prints goes through here, so it can be silenced while
// the password is typed (including readline's own line redraws).
let muted = false;
const output = new Writable({ write(chunk, _enc, cb) { if (!muted) stdout.write(chunk); cb(); } });
const rl = createInterface({ input: stdin, output, terminal: !!stdin.isTTY });
const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : undefined; };

async function askHidden(question) {
  stdout.write(question);
  muted = true;
  const value = await rl.question("");
  muted = false;
  stdout.write("\n");
  return value;
}

try {
  const name = arg("name") || (await rl.question("Full name: ")).trim();
  const email = (arg("email") || (await rl.question("Email: "))).trim().toLowerCase();
  let role = arg("role") || (await rl.question(`Role [${ROLES.join(" / ")}] (PROJECT_MANAGER): `)).trim().toUpperCase() || "PROJECT_MANAGER";
  if (!ROLES.includes(role)) throw new Error(`Unknown role ${role}`);
  const password = await askHidden("Password (min 10 characters, hidden): ");
  if (password.length < 10) throw new Error("Password too short.");
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.upsert({
    where: { email },
    create: { name, email, role, passwordHash, color: PALETTE[(await db.user.count()) % PALETTE.length] },
    update: { name, role, passwordHash, active: true },
  });
  await db.session.deleteMany({ where: { userId: user.id } });
  console.log(`✓ ${user.name} <${user.email}> is ${role}. Sign in at the team site.`);
} catch (e) {
  console.error(`✗ ${e.message}`);
  process.exitCode = 1;
} finally {
  rl.close();
  await db.$disconnect();
}
