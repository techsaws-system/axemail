"use client";

export async function filesToAttachments(files: File[]) {
  return Promise.all(
    files.map(async (file) => ({
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      contentBase64: await fileToBase64(file),
    })),
  );
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Unable to encode attachment."));
        return;
      }

      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("Unable to encode attachment."));
    reader.readAsDataURL(file);
  });
}
