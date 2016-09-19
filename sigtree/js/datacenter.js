/**
 * [dataCenter description]
 *  统一定义histogram元素的class为tree-signalTree的名字
 */
/*dataCenter:
 *stats: 从本地文件中加载数据进行展示，这是展示的第一层次
 *datasets: [   //各个数据集
 *id: 文件编号
 *processor: 文本处理      
 *]
 */
var dataCenter = {
	view_collection:{
		'all_view_controller': new Object(),
		'tree_select_view': new Object(),
		'radial_view': new Object(),
		'tree_compare_view': new Object(),
		'parallel_set_view': new Object(),
		'toolbar_all_view': new Object(),
		'toolbar_comparison_view': new Object(),
		'toolbar_tree_view': new Object(),
		'projection_view': new Object(),
		'multitree_comparison_view': new Object()
	},
	global_variable: {
		'all_selection_object_array':[],
		'selection_object_array':[],
		'all_object_array':[],
		'file_array_path': [],
		'local_file': 'sample1',
		'hover_tree_name': null,
		'current_operation_tree_name':null,
		'similarity_object_matrix':[],
		'show_arc': true,
		'hover_show_arc': false,
		'operation_similar_array':[],
		'multitree_display_mode': 'WHOLE_TREE',
		'standard_level_height': 0,
		'real_level_height': 0, 
		'add_tree_count': 0,
		'current_mouseover_signaltree': null,
		'sum_height': 0,
		'display_mode_object':{
			'whole_tree': 'WHOLE_TREE',
			'last_level_flow':'LAST_LEVEL_FLOW',
			'flow':'FLOW'
		},
		'comparison_view_current_depth': 4,
		'level_node_num_obj':[],
		'delete_tree_index': null,
		'level_node_num_obj': null,
		'comparison_show_similiar': false,
		'sort_mode': 'time', //delete
		'click_thisNode_shrink': true,
		'compare_same_node': false, //delete
		'radialexpandmarkA': [], //delete
		'radialexpandmarkB': [], //delete
		'marknodesdepth': false, //delete
		'nodesIddepthA': [], //delete
		'nodesIddepthB': [], //delete
		'activeA': 4, //delete
		'activeB': 4, //delete
		'tree_node_list': [],    //delete
		'selection_object_array': [], //delete
		'selection_array':[],
		'current_id': null,
		'current_nodeid_before':[], //delete
		'hover_arc_link_num': 0,
		'sunburst_or_radial': 'radial',
		'treeview_or_projection':'treeview',
		'current_bg_color':'white',
		'current_bg_language':'Chinese',
		'projection_method': 'original_projection',
		'similar_id_array':[], //delete
		'numoftreecompare':0, //delete
		'time_sort_array':[],
		'propotion_array':[],
		'max_value': 0,
		'min_value': 0,
		'radial_highlight_id_list':[], //delete
		'mouse_over_signal_tree':null,
		'mouse_over_signal_node':null,
		'remove_signal_tree_index':[], //delete
		'current_signal_tree_index_array':[], //delete
		'enable_tooltip': true,
		'multi_tree_smaller':null
	},
	initial_global_variable: {
		'all_selection_object_array':[],
		'selection_object_array':[],
		'file_array_path': [],
		'hover_tree_name': null,
		'current_operation_tree_name':null,
		'similarity_object_matrix':[],
		'show_arc': true,
		'hover_show_arc': false,
		'operation_similar_array':[],
		'multitree_display_mode': 'WHOLE_TREE',
		'standard_level_height': 0,
		'sort_mode': 'time', //delete
		'click_thisNode_shrink': true,
		'compare_same_node': false, //delete
		'radialexpandmarkA': [], //delete
		'radialexpandmarkB': [], //delete
		'marknodesdepth': false, //delete
		'nodesIddepthA': [], //delete
		'nodesIddepthB': [], //delete
		'activeA': 4, //delete
		'activeB': 4, //delete
		'tree_node_list': [],    //delete
		'selection_object_array': [], //delete
		'selection_array':[],
		'current_id': null,
		'current_nodeid_before':[], //delete
		'hover_arc_link_num': 0,
		'sunburst_or_radial': 'radial',
		'treeview_or_projection':'treeview',
		'current_bg_color':'white',
		'current_bg_language':'Chinese',
		'projection_method': 'original_projection',
		'similar_id_array':[], //delete
		'numoftreecompare':0, //delete
		'time_sort_array':[],
		'propotion_array':[],
		'max_value': 0,
		'min_value': 0,
		'radial_highlight_id_list':[], //delete
		'mouse_over_signal_tree':null,
		'mouse_over_signal_node':null,
		'remove_signal_tree_index':[], //delete
		'current_signal_tree_index_array':[], //delete
		'enable_tooltip': true,
		'multi_tree_smaller':null
	},
	GLOBAL_STATIC: {
		'radius': 4,
		'DEFAULT_ARC_LINK_NUM': 2,
		'MAX_DEPTH': 4,
		'MAX_LEVEL': 10,
		'MIN_LEVEL': 5, 
		'DISPLAY_MODE':{
			'WHOLE_TREE' : 5,
			'LAST_LEVEL_FLOW': 2,
			'FLOW': 1
		},
		'DISPLAY_MODE_NAME':[
			'WHOLE_TREE', 'LAST_LEVEL_FLOW', 'FLOW'
		],
		'NODE_RADIUS':{
			'4': 1,
			'3': 2.5,
			'2': 5,
			'1': 7,
			'0': 9
		}
	},
	set_global_variable: function(variable_name, value, setter){
		this.global_variable[variable_name] = value;
		ObserverManager.post('set:' + variable_name, value, setter);
	},
	add_remove_index_array: function(remove_index){
		this.global_variable.remove_signal_tree_array.push(remove_index);
		this.global_variable.remove_signal_tree_array = this.global_variable.remove_signal_tree_array.sort(function(a,b){
			return a - b;
		});
		console.log(this.global_variable.remove_signal_tree_array);
	},
	get_current_tree_index: function(){
		var removeIndexArray = this.global_variable.remove_signal_tree_array
		if(removeIndexArray.length != 0){
			removeIndexArray.splice(0,1);
			return removeIndexArray[0];
		}else{
			//var maxNum = current_signal_tree_index_array.
		}
	}
}