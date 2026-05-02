import ffmpeg from "fluent-ffmpeg";
import { existsSync } from "fs";
import path from "path";
import importedFfmpegPath from "ffmpeg-static";

function getLocalFfmpegStaticPath() {
    const binaryName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
    return path.join(process.cwd(), "node_modules", "ffmpeg-static", binaryName);
}

const candidates = [
    process.env.FFMPEG_PATH?.trim(),
    typeof importedFfmpegPath === "string" ? importedFfmpegPath : "",
    getLocalFfmpegStaticPath(),
].filter((candidate): candidate is string => Boolean(candidate));

const resolvedFfmpegPath = candidates.find((candidate) => existsSync(candidate));

if (!resolvedFfmpegPath) {
    throw new Error(
        `FFmpeg binary could not be resolved. Checked: ${candidates.join(", ") || "none"}. Install ffmpeg-static or set FFMPEG_PATH.`
    );
}

ffmpeg.setFfmpegPath(resolvedFfmpegPath);

export default ffmpeg;
