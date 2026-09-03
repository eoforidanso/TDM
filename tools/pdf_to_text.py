"""Step 0: Pipi.pdf -> norm.txt

Extracts the raw text and repairs the ligature glyphs the PDF encodes as
private-use characters (ti, fi, ff, ft, fl, ffi, tt, tti, tf).

    pip install pypdf && python3 tools/pdf_to_text.py ../Pipi.pdf
"""
import re
import sys

from pypdf import PdfReader

LIGATURES = {
    'Ɵ': 'ti', 'ﬁ': 'fi', 'ﬀ': 'ff', 'Ō': 'ft', 'ﬂ': 'fl',
    'Ʃ': 'tt', 'ﬃ': 'ffi', 'ƫ': 'tti', 'ƞ': 'tf',
    '’': "'", '“': '"', '”': '"',
}


def main(src: str, dst: str = 'norm.txt') -> None:
    reader = PdfReader(src)
    pages = []
    for i, page in enumerate(reader.pages):
        pages.append(f'===PAGE {i + 1}===')
        pages.append(page.extract_text() or '')
    text = '\n'.join(pages)
    for bad, good in LIGATURES.items():
        text = text.replace(bad, good)
    text = '\n'.join(line.rstrip() for line in text.split('\n'))
    with open(dst, 'w') as fh:
        fh.write(text)
    print(f'{len(reader.pages)} pages -> {dst}')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'Pipi.pdf')
