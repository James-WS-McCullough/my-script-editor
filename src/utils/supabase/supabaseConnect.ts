import { createClient } from "@supabase/supabase-js";
import { characterNote } from "../general/types";
import { v4 } from "uuid";
import React from "react";
import { appLoadExtension } from "../general/constants";
import { copyToClipboard } from "../electron/electronUtils";

const supabaseUrl = "https://buakfixqycjbbjeljnqn.supabase.co";
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

if (!supabaseKey) {
  throw new Error("No Supabase Key defined");
}
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("supabase", supabase);

type shareScriptProps = {
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
  title: string;
  scriptUUID: string;
  notes?: string;
  characterNotes?: characterNote[];
  setScriptShareLink: (link: string) => void;
};

export const shareScript = async ({
  contentRef,
  title,
  scriptUUID,
  notes,
  characterNotes,
  setScriptShareLink,
}: shareScriptProps) => {
  // Insert or update the script if

  const { data, error } = await supabase.from("shared_scripts").upsert([
    {
      id: scriptUUID,
      title,
      html: contentRef.current?.innerHTML,
      notes,
      character_notes: JSON.stringify(characterNotes),
    },
  ]);

  if (error) {
    console.log("error", error);
    throw error;
  }
  console.log("ID: ", scriptUUID);
  const linkUrl = appLoadExtension + scriptUUID;
  // prompt the user, and put link in clipboard
  await copyToClipboard(linkUrl);
  setScriptShareLink(linkUrl);
  return;
};

export const getSharedScript = async (id: string) => {
  const { data, error } = await supabase
    .from("shared_scripts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.log("error", error);
    throw error;
  }
  console.log("data", data);
  return data;
};
