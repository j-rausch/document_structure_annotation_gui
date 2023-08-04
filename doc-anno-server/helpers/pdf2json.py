#!/usr/bin/env python3
"""
PDFMiner XML to Annotation JSON Converter
"""

import argparse
from bs4 import BeautifulSoup
import json
import sys

id = 0


def get_id():
    global id
    id += 1
    return id


def new_structure(id, category, parent):
    return {
        'id': id,
        'category': category,
        'parent': parent
    }


def new_box(id, category, page, bbox, parent, text=None):
    return {
        'id': id,
        'category': category,
        'page': page,
        'bbox': bbox,
        'parent': parent,
        'text': text
    }


def parse_bbox(bbox):
    coords = [float(f) for f in bbox.split(',')]
    return coords


def cover_bbox(bboxes):
    return [
        min([b[0] for b in bboxes]),
        min([b[1] for b in bboxes]),
        max([b[2] for b in bboxes]),
        max([b[3] for b in bboxes])
    ]


def convert_bbox(bbox, page_bbox):
    coords = bbox.copy()
    coords[1] = page_bbox[3] - bbox[3]
    coords[3] = page_bbox[3] - bbox[1]
    coords[2] -= coords[0]
    coords[3] -= coords[1]
    return [round(c, 3) for c in coords]


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('-p', '--paragraph', action='store_true',
                    help='create paragraph structure node for annotations')
parser.add_argument('-f', '--figure', action='store_true',
                    help='create figure structure/annotation nodes')
parser.add_argument('-l', '--line', action='store_true',
                    help='create line structure/annotation nodes')
parser.add_argument('-w', '--word', action='store_true',
                    help='create annotations for words')
parser.add_argument('-c', '--character', action='store_true',
                    help='create annotations for characters')
args = parser.parse_args()

output = []

soup = BeautifulSoup(sys.stdin.read(), 'xml')
pages = soup.pages.find_all('page')
root = new_structure(get_id(), 'unk', None)
output.append(root)
meta = new_structure(get_id(), 'meta', None)
output.append(meta)
document = new_structure(get_id(), 'document', None)
output.append(document)
for page in pages:
    page_id = int(page['id']) - 1
    page_bbox = parse_bbox(page['bbox'])
    textboxes = page.find_all('textbox')
    for textbox in textboxes:
        textlines = textbox.find_all('textline')
        parent = root['id']
        if args.paragraph and len(textlines) > 0:
            paragraph = new_structure(get_id(), 'paragraph', root['id'])
            output.append(paragraph)
            parent = paragraph['id']
        for textline in textlines:
            if args.word:
                content_line = new_structure(get_id(), 'content_line', root['id'])
                output.append(content_line)
                texts = textline.find_all('text')
                bboxes = []
                word = ''
                for text in texts:
                    if text.has_attr('bbox'):
                        bboxes.append(parse_bbox(text['bbox']))
                        word += text.string
                    else:
                        box = new_box(get_id(), 'box', page_id, convert_bbox(
                            cover_bbox(bboxes), page_bbox), content_line['id'], word)
                        output.append(box)
                        bboxes = []
                        word = ''
            elif args.character:
                content_line = new_structure(get_id(), 'content_line', root['id'])
                output.append(content_line)
                texts = textline.find_all('text')
                word = new_structure(get_id(), 'word', content_line['id'])
                output.append(word)
                for text in texts:
                    if text.has_attr('bbox'):
                        box = new_box(get_id(), 'box', page_id, convert_bbox(parse_bbox(text['bbox']), page_bbox), word['id'], text.string)
                        output.append(box)
                    else:
                        word = new_structure(get_id(), 'word', content_line['id'])
                        output.append(word)
            else:
                box = new_box(get_id(), 'box', page_id, convert_bbox(parse_bbox(textline['bbox']), page_bbox), parent)
                output.append(box)
    if args.figure:
        for figure in page.find_all('figure'):
            f = new_structure(get_id(), 'image', root['id'])
            output.append(f)
            output.append(new_box(get_id(), 'box', page_id, convert_bbox(parse_bbox(figure['bbox']), page_bbox), f['id']))
    if args.line:
        for line in page.find_all('line'):
            l = new_structure(get_id(), 'line', root['id'])
            output.append(l)
            output.append(new_box(get_id(), 'box', page_id, convert_bbox(parse_bbox(line['bbox']), page_bbox), l['id']))

print(json.dumps(output))
