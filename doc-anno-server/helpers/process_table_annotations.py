#template for postprocessing GT table annotations that consist of row/column annotations + cell annotations for multi-row/column cells


def delete_structure_annotations_without_children(annotation_list):
    if annotation_list is None:
        return
    remaining_children_ids = dict() 
    children_per_ann = {ann['id']:[] for ann in annotation_list}
    anns_without_parents = 1
    while(anns_without_parents > 0):
        anns_without_parents = 0
        for ann in annotation_list:
            if ann['parent'] is not None:
                if ann['parent'] in children_per_ann:
                    children_per_ann[ann['parent']].append(ann['id'])
                else:
                    ann['delete'] = True
                    anns_without_parents += 1
        annotation_list = [ann for ann in annotation_list if ann.get('delete', False) != True]

    #find annotatinos without bbox child
    new_deletions = 0
    while_steps = 0
    for ann in annotation_list:
        if ann['category'] != 'box' and ann['parent'] is not None and len(children_per_ann[ann['id']]) == 0:
            ann['delete'] = True
            #print('deleting ann without bbox children: {}'.format(ann))
            new_deletions += 1
    while (new_deletions > 0):
        annotation_list = [ann for ann in annotation_list if ann.get('delete', False) != True]

        children_per_ann = {ann['id']:[] for ann in annotation_list}
        for ann in annotation_list:
            if ann['parent'] is not None:
                if ann['parent'] not in children_per_ann:
                    ann['delete'] = True
                else:
                    children_per_ann[ann['parent']].append(ann['id'])

        new_deletions = 0
        for ann in annotation_list:
            if ann['category'] != 'box' and ann['parent'] is not None and len(children_per_ann[ann['id']]) == 0:
                ann['delete'] = True
                new_deletions += 1

    #sanity check, TODO: Remove later
    children_per_ann = {ann['id']:[] for ann in annotation_list}
    children_without_parent = 1
    children_without_parent_total = 0
    while(children_without_parent > 0):
        annotation_list = [ann for ann in annotation_list if ann.get('delete', False) != True]
        children_without_parent = 0
        for ann in annotation_list:
            if ann['parent'] is not None:
                if ann['parent'] in children_per_ann:
                    children_per_ann[ann['parent']].append(ann['id'])
                else:
                    #annotation is 'dangling' without a remaining parent annotation
                    ann['delete'] = True
                    children_without_parent += 1
                    children_without_parent_total += 1

    return annotation_list


def clean_up_tabular_annotations(annotations):

    #NOTE: this shouldn't be necessary in principle, if the input are clean GT annoations. Could be used as a basis for some sanity checks 
    annotations = delete_structure_annotations_without_children(annotations)
    

    #create some helper dictionaries from annotation list
    ann_by_id = dict()
    anns_by_cat = defaultdict(list)
    ann_children_ids = defaultdict(list)
    for ann in annotations:
        if ann['id'] in ann_by_id:
            print('duplicates in list!')
        ann_by_id[ann['id']] =  ann 
        anns_by_cat[ann['category']].append(ann)
        ann_children_ids[ann['parent']].append(ann['id'])


    #helper function used when genrating new annotations
    def create_fn_get_new_ann_id(max_id):
        current_max_id = max_id
        def get_new_ann_id():
            nonlocal current_max_id
            current_max_id += 1
            return current_max_id
        return get_new_ann_id
    max_id = max(set(ann_by_id.keys()))
    get_new_ann_id = create_fn_get_new_ann_id(max_id)


   
    #gather all child row/col/cell annotations per tabular in annotation list
    for tabular_ann in anns_by_cat['tabular']:
        row_anns = []
        col_anns = []
        table_cell_anns = []
        col_x_centers = dict()
        row_y_centers = dict() 
        existing_grid_cells = set()
        new_cell_annotations = []
        tabular_child_ids = ann_children_ids[tabular_ann['id']]
        for child_id in tabular_child_ids:
            child_ann = ann_by_id[child_id]
            child_ann_bboxes = [ann_by_id[bbox_ann_id] for bbox_ann_id in ann_children_ids[child_ann['id']] if ann_by_id[bbox_ann_id]['category'] == 'box']
            if len(child_ann_bboxes) > 1:
                print('more than one bbox for table child of type {} unexpected: \n{}'.format(child_ann['category'], child_ann_bboxes))
            if len(child_ann_bboxes) == 0:
                print('table child of type {} has no bbox. unexpected: \n{}'.format(child_ann['category'], child_ann_bboxes))
                continue
            child_bbox_ann = child_ann_bboxes[0]

            x_center = child_bbox_ann['bbox'][0] + child_bbox_ann['bbox'][2] / 2
            y_center = child_bbox_ann['bbox'][1] + child_bbox_ann['bbox'][3] / 2

            if child_ann['category'] == 'table_cell':
                table_cell_anns.append(child_ann)
            elif child_ann['category'] == 'table_row':
                assert y_center not in row_y_centers
                row_y_centers[y_center] = tuple([child_ann, child_bbox_ann])
                row_anns.append(child_ann)

            elif child_ann['category'] == 'table_col':

                assert x_center not in col_x_centers
                col_anns.append(child_ann)
                col_x_centers[x_center] = tuple([child_ann, child_bbox_ann])

        #print('found and sorted {} rows and {} cols '.format(len(row_y_centers), len(col_x_centers)))

        #sort rows/columns
        x_center_values = sorted(list(col_x_centers.keys()))
        y_center_values = sorted(list(row_y_centers.keys()))
      

        #analyze table cells that were manually labeled and read out their row/col information. Reformat the col/row range info, if they were entered badly (e.g. 0,1 instead of 0-0,1-1)
        pre_labeled_multicells = [ann for ann in table_cell_anns if ann['category'] == 'table_cell']
        for ann in pre_labeled_multicells:
            row_range, col_range = ann['properties'].split(',')
            #print('row range raw: {}, col range raw: {}'.format(row_range, col_range))
            if '-' not in row_range:
                if len(row_range) > 0:
                    row_start = int(row_range)
                    row_end = int(row_range)
                else:
                    raise AttributeError('bad cell')
            else:
                row_start, row_end = row_range.split('-')

            if '-' not in col_range:
                if len(col_range) > 0:
                    col_start = int(col_range)
                    col_end = int(col_range)
                else:
                    raise AttributeError('bad cell')
            else:
                col_start, col_end = col_range.split('-')
            new_row_range = [int(row_start), int(row_end)]
            new_col_range = [int(col_start), int(col_end)]
            assert new_row_range[1] - new_row_range[0] >= 1 or new_col_range[1] - new_col_range[0] >= 1
            for grid_row_nr in range(new_row_range[0], new_row_range[1]+1):
                for grid_col_nr in range(new_col_range[0], new_col_range[1]+1):
                    print('adding ({}, {}) to grid for row range {} and col range {}'.format(grid_row_nr, grid_col_nr, new_row_range, new_col_range))
                    existing_grid_cells.add((grid_row_nr, grid_col_nr))

            ann['row_range'] = [row_start, row_end]
            ann['col_range'] = [col_start, col_end]
            ann['properties'] = "{}-{},{}-{}".format(row_start, row_end, col_start, col_end)

        #number the sorted rows/cols
        for col_nr, x_center_value in enumerate(x_center_values):
                col_ann, _ = col_x_centers[x_center_value]
                col_ann['col_nr'] = col_nr  
                col_ann['properties'] = col_nr  
        for row_nr, y_center_value in enumerate(y_center_values):
                row_ann, _ = row_y_centers[y_center_value]
                row_ann['row_nr'] = row_nr  
                row_ann['properties'] = row_nr  

        #generate regular table cells from row/col intersections
        for col_nr, x_center_value in enumerate(x_center_values):
            for row_nr, y_center_value in enumerate(y_center_values):
                col_ann, col_bbox = col_x_centers[x_center_value]
                row_ann, row_bbox = row_y_centers[y_center_value]
                intsct_x0 = col_bbox['bbox'][0] 
                intsct_x1 = col_bbox['bbox'][0] + col_bbox['bbox'][2]
                intsct_y0 = row_bbox['bbox'][1] 
                intsct_y1 = row_bbox['bbox'][1] + row_bbox['bbox'][3]
                page = row_bbox['page']
                bbox_from_intersection = [intsct_x0, intsct_y0, intsct_x1-intsct_x0, intsct_y1-intsct_y0]
                row_start = row_nr
                row_end = row_nr
                col_start = col_nr
                col_end = col_nr


                grid_coord = (row_nr, col_nr)
                if grid_coord not in existing_grid_cells:             
                    new_cell_id = get_new_ann_id()
                    new_cell_ann = {'category': 'table_cell', 'id': new_cell_id, 'parent':tabular_ann['id']}
                    new_cell_ann['row_range'] = [row_start, row_end]
                    new_cell_ann['col_range'] = [col_start, col_end]
                    new_cell_ann['properties'] = "{}-{},{}-{}".format(row_start, row_end, col_start, col_end)


                    new_bbox_ann = {'category': 'box', 'id': get_new_ann_id(), 'parent':new_cell_id, 'bbox':bbox_from_intersection, 'page':page}
                    new_cell_annotations.append(new_cell_ann)
                    new_cell_annotations.append(new_bbox_ann)


                    existing_grid_cells.add(grid_coord)
         
        #sanity check:
#        print('filled {} grid cells, expected: {}'.format(len(existing_grid_cells), len(row_anns) * len(col_anns)))
        expected_grid_cells = set()
        for row_nr in range(len(row_anns)):
           for col_nr in range(len(col_anns)):
                expected_grid_cells.add((row_nr,col_nr)) 
        print('{} rows, {} cols; expected cells {}, existing cells: {}'.format(len(row_anns), len(col_anns), len(expected_grid_cells), len(existing_grid_cells)))

        assert len(x_center_values) * len(y_center_values)  == len(row_anns) * len(col_anns)
        assert len(existing_grid_cells) == len(row_anns) * len(col_anns)
        annotations += new_cell_annotations

    return annotations


def find_and_clean_labeled_files_in_gui_folder(src_dir, annotation_gui_manual_labeling_dir, in_tag, out_tag):
    all_docs_in_folder = os.listdir(annotation_gui_manual_labeling_dir)
    all_labeled_docs = []
    #this would edit dataset in-place
    src_dir =     annotation_gui_manual_labeling_dir
    dest_dir =     annotation_gui_manual_labeling_dir

    for doc in all_docs_in_folder:
        subdir = os.path.join(src_dir, doc)
        gt_files = [x for x in os.listdir(subdir) if '-{}'.format(in_tag) in x]

    
    docs_with_manual_label = {x.split('-gt')[0] : x for x in gt_files}

    #cleanup steps:
    for doc, annotations_in_name in docs_with_manual_label.items():

        print('doing doc {}'.format(doc))
        src_annotations_file = os.path.join(src_dir, doc, annotations_in_name)
        with open(src_annotations_file) as f:
            annotations = json.load(f)
            

            annotations= clean_up_tabular_annotations(annotations)

            ann_by_id = dict()

            for ann in annotations:
                ann_by_id[ann['id']] = ann

            #TODO: consider doing additional sanity checks here
            for ann in annotations:
                if ann['category'] == 'table_cell':
                    if not 'col_range' in ann:
                        raise AttributeError('no col range in {}: {}'.format(doc, ann))
                    if not 'row_range' in ann:
                        raise AttributeError('no row range in {}: {}, parent: {}'.format(doc, ann, ann_by_id[ann['parent']]))

        dest_annotations_relpath = os.path.join(doc, doc + '-{}.json'.format(out_tag))
        dest_annotations_fullpath = os.path.join(dest_dir, dest_annotations_relpath)
        with open(dest_annotations_fullpath, 'w') as out_file:
            json.dump(annotations, out_file, indent=1, sort_keys=True)
    return docs_with_manual_label

if __name__ == '__main__':
    #gather annotation files:

    annotation_gui_manual_labeling_dir = 'insertpath/doc-anno-server/public/documents/nameofdataset'
    in_tag='gt_tables_v1'
    out_tag='gt_tables_v2'
    find_and_clean_labeled_files_in_gui_folder(annotation_gui_manual_labeling_dir, in_tag, out_tag)
