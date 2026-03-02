from app.config import get_settings
s = get_settings()
print(f"WHISPER_INSECURE_DOWNLOAD={s.whisper_insecure_download}")
print(f"MISTRAL_CA_BUNDLE={s.mistral_ca_bundle}")
