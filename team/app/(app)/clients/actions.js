"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCan, str } from "@/lib/guard";

const fields = (fd) => ({
  name: str(fd, "name"),
  company: str(fd, "company"),
  email: str(fd, "email"),
  phone: str(fd, "phone"),
  notes: str(fd, "notes"),
});

export async function saveClient(fd) {
  await requireCan("manageClients");
  const data = fields(fd);
  if (!data.name) throw new Error("Client name is required.");
  const id = str(fd, "id");
  if (id) await db.client.update({ where: { id }, data });
  else await db.client.create({ data });
  revalidatePath("/clients");
}

export async function deleteClient(fd) {
  await requireCan("manageClients");
  await db.client.delete({ where: { id: String(fd.get("id")) } });
  revalidatePath("/clients");
}
