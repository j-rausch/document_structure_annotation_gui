import os
import json
import re


def create_empty_annotation_file_for_doc(doc_folder, doc_id):
    empty_dictionary = [
        {"id": 1, "category": "unk", "parent": None}, 
        {"id": 2, "category": "meta", "parent": None},
        {"id": 3, "category": "document", "parent": None}
        ]

    json_output_path = os.path.join(doc_folder, doc_id + '-default.json')  
    
    with open(json_output_path, 'w') as out_file:
        print('creating meta json file at {}'.format(json_output_path))
        json.dump(empty_dictionary, out_file, indent=1, sort_keys=True)




def create_meta_files_from_images(img_files, doc_folder, doc_id):
    meta_dict = {'id' : doc_id, 'title': doc_id, 'pages': len(img_files)}
    json_output_path = os.path.join(doc_folder, doc_id + '.json')  
    
    with open(json_output_path, 'w') as out_file:
        print('creating meta json file at {}'.format(json_output_path))
        json.dump(meta_dict, out_file, indent=1, sort_keys=True)


def process_dataset(dataset_dir):
    all_doc_folders_in_dataset_dir = [os.path.join(dataset_dir, o) for o in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir,o))]

    for doc_folder in all_doc_folders_in_dataset_dir:
        doc_id = os.path.basename(doc_folder)
        folder_contents = os.listdir(doc_folder)
        annotation_files = [f for f in folder_contents if re.match(doc_id + '-([A-Za-z0-9\\.-]+)\\.json', f)]
        #print('found annotation files for {}: {}'.format(doc_folder, annotation_files))
        pdf_files = [f for f in folder_contents if f.endswith('.pdf')]
        img_files = [f for f in folder_contents if f.endswith('.png')]
        meta_files = [f for f in folder_contents if f == doc_id + '.json']

        if len(pdf_files) == 0 and len(img_files) == 0:
            print('no pdf file or img files in {}. Skipping folder..'.format(doc_folder))
            continue
        if len(pdf_files) == 0 and len(img_files) > 0:
            if len(meta_files) == 0:
                create_meta_files_from_images(img_files, doc_folder, doc_id)
        if len(pdf_files) > 0:
            #print("PDF file to img conversion not yet implemented, skipping {}..".format(doc_folder))
            continue
        if len(annotation_files) == 0:
            create_empty_annotation_file_for_doc(doc_folder, doc_id)


def main():

    document_root_dir = 'public/documents'
    all_dataset_dirs = [os.path.join(document_root_dir, o) for o in os.listdir(document_root_dir) if os.path.isdir(os.path.join(document_root_dir,o))]

    for dataset_dir in all_dataset_dirs:
        process_dataset(dataset_dir)

if __name__ == "__main__":
    main()

