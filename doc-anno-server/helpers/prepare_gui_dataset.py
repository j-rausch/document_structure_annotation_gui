from pathlib import Path
from pdf2image import convert_from_path
import os
from shutil import copyfile
import json
from create_missing_files import create_empty_annotation_file_for_doc

DPI = 72
def create_dir_if_not_exists(dirpath):
    if not os.path.exists(dirpath):
        os.mkdir(dirpath)



def main():
    pdfs_root_dir = 'insertrootdir'

    doc_paths_by_id = {os.path.basename(x).split('.pdf')[0] : x for x in  Path(pdfs_root_dir).glob('**/*.pdf')}
    #print(doc_paths_by_id)
    all_keys = list(doc_paths_by_id.keys())
    rel_path_mappings = dict()

    all_doc_ids = list(doc_paths_by_id)
    assert len(all_doc_ids) == len(set(all_doc_ids))

    output_dir = 'insertoutputdir'
    create_dir_if_not_exists(output_dir)
    for doc_id, pdf_path in doc_paths_by_id.items():
        relpath = os.path.relpath(pdf_path, pdfs_root_dir)
#        reldir = os.path.dirname(relpath)
#        reldir_string = reldir.replace(' ','_').replace('/', '_')
        rel_path_mappings[doc_id] = relpath
        #input('doc id: {}, relpath: {}'.format(doc_id, reldir_string))
        new_output_dir = os.path.join(output_dir, doc_id)
        create_dir_if_not_exists(new_output_dir)
        pdf_dest_path = os.path.join(new_output_dir, doc_id + '.pdf')
        print('copy from {} to {}'.format(pdf_path, new_output_dir))
        copyfile(pdf_path, pdf_dest_path)
        images_dpi = convert_from_path(pdf_dest_path, dpi=DPI, fmt='png')

        for i, image in enumerate(images_dpi):
            image.save(os.path.join(new_output_dir, doc_id + '-' + str(i)) + '.png') 
        num_pages = len(images_dpi)
        spec = {
                'id': doc_id,
                'title': doc_id,
                'pages': num_pages,
        }
    
        spec_file = os.path.join(new_output_dir, doc_id + '.json')
        with open(spec_file, 'w') as out_file:
            json.dump(spec, out_file, indent=1, sort_keys=True)

        create_empty_annotation_file_for_doc(new_output_dir, doc_id)
    #save mapping
    file_id_mapping_file = os.path.join(output_dir, 'file_id_mappings.json')
    with open(file_id_mapping_file, 'w') as out_file:
        json.dump(rel_path_mappings, out_file, indent=1, sort_keys=True)

if __name__ == "__main__":
    main()
