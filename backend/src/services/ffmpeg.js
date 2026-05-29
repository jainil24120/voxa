import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import path from 'node:path';
import fs from 'node:fs';

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Extract a mono 16kHz audio track (best for Whisper) from any audio/video file.
 * Returns the output path.
 */
export function extractAudio(inputPath, outputDir = './uploads') {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const base = path.basename(inputPath, path.extname(inputPath));
    const outPath = path.join(outputDir, `${base}.audio.mp3`);

    ffmpeg(inputPath)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec('libmp3lame')
      .audioBitrate('64k')
      .save(outPath)
      .on('end', () => resolve(outPath))
      .on('error', (err) => reject(err));
  });
}

/**
 * Probe duration and stream info.
 */
export function probe(inputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}
