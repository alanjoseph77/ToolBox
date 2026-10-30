"use client";
import { useEffect } from "react";
import { addRecent } from "@/lib/recent";

export default function RecordVisit({ slug }: { slug: string }) {
  useEffect(() => addRecent(slug), [slug]);
  return null;
}
