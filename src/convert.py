"""Conversion automatique WAV -> MP3 (pour que le scan, l'éditeur et le player les prennent en compte).

Utilisé par le scan (CLI + bouton Rescan de l'éditeur) et par le build.
Le .wav original reste à côté (il est ignoré par git), le .mp3 est créé ou mis à jour.
Dépendance : lameenc (pip install lameenc) — installée automatiquement par runme.bat.
"""
from __future__ import annotations
import os
import struct
import wave

BITRATE = 192  # kb/s


def _to_pcm16(frames: bytes, width: int) -> bytes:
    if width == 2:
        return frames
    out = bytearray()
    if width == 1:                      # 8 bits non signés
        for b in frames:
            out += struct.pack("<h", (b - 128) << 8)
    elif width == 3:                    # 24 bits -> on garde les 2 octets de poids fort
        for i in range(0, len(frames), 3):
            out += frames[i + 1:i + 3]
    elif width == 4:                    # 32 bits entier
        for i in range(0, len(frames), 4):
            out += frames[i + 2:i + 4]
    else:
        raise ValueError(f"{width * 8} bits non supporté")
    return bytes(out)


def wav_to_mp3(src: str, dst: str) -> None:
    import lameenc
    with wave.open(src, "rb") as w:
        ch, width, rate, n = w.getnchannels(), w.getsampwidth(), w.getframerate(), w.getnframes()
        pcm = _to_pcm16(w.readframes(n), width)
    if ch > 2:
        raise ValueError(f"{ch} canaux non supporté (mono/stéréo seulement)")
    enc = lameenc.Encoder()
    enc.set_bit_rate(BITRATE)
    enc.set_in_sample_rate(rate)
    enc.set_channels(ch)
    enc.set_quality(2)
    data = enc.encode(pcm) + enc.flush()
    with open(dst, "wb") as f:
        f.write(data)


def convert_folder(folder: str, verbose: bool = True) -> list[str]:
    """Convertit chaque .wav du dossier en .mp3 (si le mp3 manque ou est plus ancien). Retourne les mp3 créés."""
    done = []
    if not os.path.isdir(folder):
        return done
    wavs = [f for f in sorted(os.listdir(folder)) if f.lower().endswith(".wav")]
    if not wavs:
        return done
    try:
        import lameenc  # noqa: F401
    except ImportError:
        print(f"  WARN: {len(wavs)} fichier(s) .wav dans {folder}/ non convertis : installe lameenc "
              "(pip install lameenc, ou relance runme.bat).")
        return done
    for f in wavs:
        src = os.path.join(folder, f)
        dst = os.path.splitext(src)[0] + ".mp3"
        if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
            continue
        try:
            wav_to_mp3(src, dst)
            done.append(os.path.basename(dst))
            if verbose:
                print(f"  WAV -> MP3 : {folder}/{f} -> {os.path.basename(dst)}")
        except Exception as e:  # format exotique (float, ADPCM…)
            print(f"  WARN: {folder}/{f} non converti ({e}). Exporte-le en WAV PCM 16 bits ou en MP3.")
    return done
