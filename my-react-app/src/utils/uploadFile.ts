// src/utils/uploadFile.ts
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

export async function uploadFile(file: File, userId: string) {
  // Use userId or orgId to organize uploads
  const storageRef = ref(storage, `uploads/${userId}/${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url; // return download link
}
