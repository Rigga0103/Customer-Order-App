import { supabase } from "../supabaseClient";
import { convertToWebp } from "./imageConvert";

export const uploadAvatar = async (file, userId) => {
  try {
    const webpFile = await convertToWebp(file);
    const filePath = `${userId}/avatar_${Date.now()}.webp`; // Adding timestamp to avoid cache issues

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, webpFile, {
        upsert: true,
        contentType: "image/webp"
      });

    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err) {
    console.error("Failed to upload avatar:", err);
    return null;
  }
};

export const saveAvatarUrl = async (userId, url) => {
  const { error } = await supabase
    .from("users")
    .update({
      avatar_url: url
    })
    .eq("id", userId);

  if (error) {
    console.error("Database update error:", error);
    return false;
  }
  return true;
};
