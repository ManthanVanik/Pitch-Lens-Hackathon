from google.cloud import speech
import subprocess
import tempfile
import os
from typing import Dict
import logging
from utils.gcs_utils import GCSManager
from utils.summarizer import GeminiSummarizer

logger = logging.getLogger(__name__)

class AudioProcessor:
    def __init__(self):
        self.speech_client = speech.SpeechClient()
        self.gcs_manager = GCSManager()
        self.summarizer = GeminiSummarizer()

    async def process_audio(self, gcs_path: str) -> Dict:
        """Process audio file using Speech-to-Text"""
        try:
            # Use long-running recognition for large files
            transcript = await self._transcribe_long_audio(gcs_path)

            # Generate summary
            summary = await self.summarizer.summarize_audio_transcript(transcript)

            return {
                "raw": transcript,
                "concise": {"summary": summary}
            }

        except Exception as e:
            logger.error(f"Audio processing error: {str(e)}")
            raise

    async def process_video(self, gcs_path: str) -> Dict:
        """Process video file by extracting audio first"""
        try:
            # Download video temporarily
            with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_video:
                await self.gcs_manager.download_file(gcs_path, temp_video.name)
                temp_video_path = temp_video.name

            # Extract audio using FFmpeg
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_audio:
                temp_audio_path = temp_audio.name

            try:
                # Use FFmpeg to extract audio
                cmd = [
                    'ffmpeg', '-i', temp_video_path,
                    '-acodec', 'pcm_s16le',
                    '-ar', '16000',
                    '-ac', '1',
                    temp_audio_path, '-y'
                ]

                subprocess.run(cmd, check=True, capture_output=True)

                # Upload extracted audio to GCS
                audio_gcs_path = gcs_path.replace('.mp4', '_audio.wav')
                with open(temp_audio_path, 'rb') as audio_file:
                    # Upload audio file
                    blob = self.gcs_manager.bucket.blob(
                        audio_gcs_path.replace(f"gs://{self.gcs_manager.bucket.name}/", "")
                    )
                    blob.upload_from_file(audio_file, content_type='audio/wav')

                # Process the extracted audio
                return await self.process_audio(audio_gcs_path)

            finally:
                # Clean up temp files
                os.unlink(temp_video_path)
                os.unlink(temp_audio_path)

        except Exception as e:
            logger.error(f"Video processing error: {str(e)}")
            raise

    async def _transcribe_long_audio(self, gcs_path: str) -> str:
        """Transcribe long audio using long-running operation"""
        try:
            # Configure recognition
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,
                language_code="en-US",
                enable_automatic_punctuation=True,
                enable_word_time_offsets=True,
                model="latest_long"
            )

            audio = speech.RecognitionAudio(uri=gcs_path)

            # Start long-running operation
            operation = self.speech_client.long_running_recognize(
                config=config, audio=audio
            )

            logger.info("Waiting for speech recognition to complete...")
            response = operation.result(timeout=900)  # 15 minutes timeout

            # Combine all alternatives
            transcript = ""
            for result in response.results:
                transcript += result.alternatives[0].transcript + " "

            return transcript.strip()

        except Exception as e:
            logger.error(f"Speech-to-Text error: {str(e)}")
            raise
