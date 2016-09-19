
/**
 * [set_initial_data description] 
 *  设置初始情况下的数据
 *  1. 对于原始设置的数据进行重置
 *  2. 读取的文件统计的数据，按照时间排序或者按照流量大小排序
 */
var viewsController = {
    name: 'viewsController',
    initialize: function(){
        var self = this;
        self._add_to_listeners();
        self._initial_toolbar();
        self._main_controller();
    },
    _add_to_listeners: function(){
        var self = this;
        ObserverManager.addListener(self);
    },
    _set_initial_data: function(){
        //reset the initial variable
        var globalVariable = dataCenter.global_variable;
        var initialGlobalVariable = dataCenter.initial_global_variable;
        for(x in initialGlobalVariable)
        {
            dataCenter.global_variable[x] = _.clone(dataCenter.initial_global_variable[x]);
        }
        //set the selection value
        var timeSortArray = [];
        var propotionArray = [];
        var statData = dataCenter.stats;
        var allInfoObj = dataCenter.global_variable.all_info_obj;
        console.log('allInfoObj', allInfoObj);
        for(var i = 0;i < allInfoObj.length;i++){
            timeSortArray[i] = new Object();        
            timeSortArray[i].value = +allInfoObj[i].flow;
            timeSortArray[i].time = allInfoObj[i].date;
            timeSortArray[i].index = i;
            timeSortArray[i].position = i;
            timeSortArray[i].l0_node = +allInfoObj[i].l0;
            timeSortArray[i].l1_node = +allInfoObj[i].l1;
            timeSortArray[i].l2_node = +allInfoObj[i].l2;
            timeSortArray[i].l3_node = +allInfoObj[i].l3;
            timeSortArray[i].l4_node = +allInfoObj[i].l4;
            timeSortArray[i].sum_node = +allInfoObj[i].sum;
            propotionArray[i] = new Object();
            propotionArray[i].value = +allInfoObj[i].flow;
            propotionArray[i].time = allInfoObj[i].date;
            propotionArray[i].index = i;    
            propotionArray[i].l0_node = +allInfoObj[i].l0;
            propotionArray[i].l1_node = +allInfoObj[i].l1;
            propotionArray[i].l2_node = +allInfoObj[i].l2;
            propotionArray[i].l3_node = +allInfoObj[i].l3;
            propotionArray[i].l4_node = +allInfoObj[i].l4;
            propotionArray[i].sum_node = +allInfoObj[i].sum;
        }
        propotionArray.sort(function(a, b) {
            return a.value - b.value;
        });
        timeSortArray.sort(function(a,b){
            var aTime = a.time.split('-')[0];
            var bTime = b.time.split('-')[0];
            return aTime - bTime;
        });
        dataCenter.max_value = _.max(timeSortArray, function(d) {return d.value}).value;
        dataCenter.min_value = 0;
        for (var i = 0; i < propotionArray.length; i++) {
            propotionArray[i].position = i;
        }
        dataCenter.global_variable.time_sort_array = timeSortArray;
        dataCenter.global_variable.propotion_array = propotionArray;
        dataCenter.global_variable.current_operation_tree_name = timeSortArray[0].time;
        dataCenter.global_variable.current_id = timeSortArray[0].time;
        dataCenter.global_variable.selection_array = [timeSortArray[0].time, timeSortArray[1].time];
        dataCenter.global_variable.current_nodeid_before = [timeSortArray[0].time, timeSortArray[1].time];
        dataCenter.global_variable.current_id = timeSortArray[1].time;
        //计算multi-tree-comparison界面standard每一层的高度值，将柱状图作为信号树的一层
        var rightComparisonWrapperHeight = $('#rightComparisonWrapper').height();
        var standardLevelHeight = rightComparisonWrapperHeight / ((dataCenter.GLOBAL_STATIC.MAX_DEPTH + 1) * 2);
        dataCenter.global_variable.real_level_height = standardLevelHeight;
        //计算每一层的标准高度以及最低高度值，在没有达到最低高度的时候会保证充满在窗口中，低于最低高度值会超过窗口的高度
        dataCenter.global_variable.standard_level_height = standardLevelHeight;
        dataCenter.global_variable.minimum_level_height = standardLevelHeight / 2;
    },
    _initial_toolbar: function(){
        dataCenter.view_collection.toolbarAllView =  toolbarAll.initialize();
        dataCenter.view_collection.toolbar_comparison_view =  toolbarComparison.initialize();
        dataCenter.view_collection.toolbar_tree_view = toolbarSignaltree.initialize();
        //初始工具栏中的提示视窗
        $('.button').tooltip(); 
    },
    _main_controller: function(){
        var self = this;
        //mainController对象内部存在控制全局视图更新的方法，因此在该object中增加监听器对象
        var filePathName = dataCenter.global_variable.local_file;
        var datasetID = [];
        var filePath = 'data/' + filePathName + '/';
        //加载统计文件数据，用于绘制上方overview中的柱状图
        function loadStatData() {
            var dtd = $.Deferred();
            d3.json(filePath + "stat.json", function(error, dataStat){
                d3.csv(filePath + "level_node_num.csv", function(error, levelNodeNum){
                    if (error) {
                        dtd.reject();
                        throw error;
                    }
                    else {
                        dataCenter.stats = dataStat;
                        dataCenter.global_variable.all_info_obj = levelNodeNum;
                    }
                    //加载stat数据之后，将数据进行排序，并且存储到dataCenter中继续使用
                    self._set_initial_data();
                    dtd.resolve();
                });
            });
            return dtd.promise();
        }
        function loadNodeNumData() {
            var dtd = $.Deferred();
            d3.csv(filePath + "level_node_num.csv", function(error, data){
                if (error) {
                    dtd.reject();
                    throw error;
                }
                else {
                    dataCenter.nodeNumberObj = data;
                }
                //加载stat数据之后，将数据进行排序，并且存储到dataCenter中继续使用
                self._set_initial_data();
                dtd.resolve();
            });
            return dtd.promise();
        }
        //加载信号树的距离矩阵数据
        function load_distance_matrix_data(){
            var dtd = $.Deferred();
            d3.csv(filePath + 'distance_matrix.csv', function(error, data){
                if(error){
                    dtd.reject();
                    throw error;
                }else{
                    //存储两个文件，dataCenter.distanceObject与dataCenter.distanceMatrix
                    dataCenter.distanceObject = data;
                    for(var i = 0;i < dataCenter.distanceObject.length;i++){
                        dataCenter.distanceObject[i].fileName = dataCenter.distanceObject[i].fileName.replace('XX.csv','');
                    }
                    //dataCenter的距离矩阵
                    var dataLength = data.length;
                    dataCenter.distanceMatrix = new Array(dataLength);
                    for(var i = 0;i < dataLength;i++){
                        dataCenter.distanceMatrix[i] = new Array(dataLength);
                    }
                    for(var i = 0;i < dataLength;i++){
                        for(var j = 0;j < dataLength;j++){
                            dataCenter.distanceMatrix[i][j] = +data[i]['attr' + j];
                        }
                    }
                }
                dtd.resolve();
            });
            return dtd.promise();
        }
        //加载信号树的相似度矩阵数据
        function load_similarity_matrix_data(){
            var dtd = $.Deferred();
            d3.csv(filePath + 'similarity_matrix.csv', function(error, data){
                if(error){
                    dtd.reject();
                    throw error;
                }
                else{
                    dataCenter.similarityMatrix = data;
                    change_matrix_to_object(data);
                    for(var i = 0;i < dataCenter.similarityMatrix.length;i++){
                        dataCenter.similarityMatrix[i].fileName = dataCenter.similarityMatrix[i].fileName.replace('XX.csv','');
                    }
                }
                dtd.resolve();
            })
            return dtd.promise();
        }
        function change_matrix_to_object(similarity_matrix){
            var similarityObjectMatrix = new Array();
            for(var i = 0;i < similarity_matrix.length;i++){
                similarityObjectMatrix[i] = new Array();
                //similarity_marix每个元素是一个对象
                for(var j = 0;j < similarity_matrix.length;j++){
                    var attrName = 'attr' + j;
                    var similarityObject = new Object();
                    similarityObject.origin_name = dataCenter.global_variable.time_sort_array[i].time;
                    similarityObject.target_name = dataCenter.global_variable.time_sort_array[j].time;
                    if(similarityObject.origin_name != similarityObject.target_name){
                        similarityObject.similar_value = +dataCenter.similarityMatrix[i][attrName];
                    }else{
                        similarityObject.similar_value = 0;   
                    }
                    similarityObjectMatrix[i].push(similarityObject);
                }
                similarityObjectMatrix[i] = similarityObjectMatrix[i].sort(function(a,b){
                    return b.similar_value - a.similar_value;
                });
            }
            dataCenter.global_variable.similarity_object_matrix = similarityObjectMatrix;
        }
        //预先加载设定好需要读取的数据，目前需要读取的数据是第一个文件与第二个文件
        function load_init_data(){
            var dtd = $.Deferred();
            var data = dataCenter.global_variable.selection_array;
            var datasetID = _.clone(data);
            dataCenter.datasets = [];
            var defers = [];
            for (var i = data.length - 1; i >= 0; i--) {
                var id = data[i];
                var processor = new sigtree.dataProcessor();
                var dataset = {
                    id: id,
                    processor: processor
                }
                dataCenter.datasets.push(dataset)
                //var file = dataCenter.stats[id].file;
                var fileName = data[i] + 'XX.csv';
                file = filePath + fileName;
                defers.push(dataset.processor.loadData(file));
            }
            $.when(defers[0], defers[1])
                .done(function(){
                //拷贝信号树的数据信号树数据
                clone_datasets();
                //将信号树对象添加到SelectionObjectArray数组中
                for(var i = 0;i < dataCenter.datasets.length;i++){  
                    self._add_selection_object(dataCenter.datasets[i].id, 
                            dataCenter.datasets[i].processor.result.treeRoot,
                            dataCenter.datasets[i].processor.result.dataList);
                }
                dtd.resolve();
            });
            return dtd.promise();
        }
        $.when(loadStatData())
        .done(function(){
            $.when(load_distance_matrix_data(), load_similarity_matrix_data(), load_init_data())
                .done(function() {
                    treeSelectView = treeSelect.initialize();
                    dataCenter.view_collection.all_view_controller = allViewController.initialize();
                    dataCenter.view_collection.radial_view = radial.initialize();
                    //dataCenter.view_collection.sunburst_view = sunburst.initialize();
                    dataCenter.view_collection.sunburst_view = sunburstView.initialize();
                    dataCenter.view_collection.radial_histogram = radialHistogram.initialize();  
                    dataCenter.view_collection.multitree_comparison_view = multiTreeComparison.initialize();
                    //dataCenter.view_collection.tree_compare_view = treeCompare();     
                    dataCenter.view_collection.parallel_set_view =  parset.initialize();     
                    dataCenter.view_collection.projectionView = projection.initialize();
                    dataCenter.view_collection.projectionLinkView = projectionLink.initialize();
                    display_main_view();
                    hidden_main_view();
            });
        });
        function merge_trees(root1, root2, index){
            //console.log('index', index);
            if(root1._children){root1.children = root1._children;}
            if(root2._children){root2.children = root2._children;}
            var idlist = {};
            if(root1.id == root2.id){
                if(root1.has == undefined){
                    root1.has = new Object();
                    root1.has[index] = true;
                }else{
                    root1.has[index] = true;
                }
            }
            if(root1.children == undefined){root1.children = [];}
            if(root2.children == undefined){root2.children = [];}
            for(var j = 0;j < root1.children.length;j++){
                idlist[root1.children[j].id] = j;
            }
            for(var j = 0;j < root2.children.length;j++){
                var tmp = idlist[root2.children[j].id];
                if(tmp == undefined){
                    //如果root2中的某一个元素不是root1的子节点
                    //向root的children[j]中增加has[index]
                    root1.children.push(root2.children[j]);
                    _add_has_index(root2.children[j], index);
                }else{
                    //如果root2中的孩子节点与root1中的某一个孩子节点相同
                    if(root1.children[tmp].has == undefined){
                        root1.children[tmp].has = new Object();
                        root1.children[tmp].has[index] = true;
                    }else{
                        root1.children[tmp].has[index] = true;
                    }
                    merge_trees(root1.children[tmp], root2.children[j], index);
                }
            }
            function _add_has_index(root, index){
                if(root.has == undefined){
                    root.has = new Object();
                    root.has[index] = true;
                }else{
                    root.has[index] = true;
                }
                if(root.children != undefined){
                    for(var i = 0;i < root.children.length;i++){
                        _add_has_index(root.children[i], index);
                    }
                }else if(root.children == undefined){
                    return;
                }
            }
        }
        //显示出隐藏的视图
        function display_main_view(){
            //.hidden-content主要包括的是三个主要的视图，overview视图，comparison视图，singleTree视图
            $('.hidden-content').css({'visibility': 'visible'});
            $('.toolbar').css({'visibility':'visible'});
        }
        //隐藏loading视图
        function hidden_main_view(){
            $('#loading').css({'visibility':'hidden'});
        }
        //将dataCenter的datasets属性深拷贝到clone_datasets中
        function clone_datasets(){
            dataCenter.clone_datasets = _.clone(dataCenter.datasets);
        }
    },
    /**
     * [_add_selection_object description]将信号树对象添加到信号树数组中
     * @param {[type]} tree_name [description]信号树的名称
     * @param {[type]} tree_root [description]信号树的根节点对象
     */
    _add_selection_object: function(tree_name, tree_root, data_list){
        /**
         * selection_object的属性主要有：
         * TreeName
         * TreeIndex
         * DivId
         * Number(Label)
         * Depth
         * TreeRoot
         * isRollingOver
         * DisplayMode
         * CustomColor
         */
        var self = this;
        var addTreeCount = dataCenter.global_variable.add_tree_count;
        var treeNumber = compute_label_number();
        var displayMode = dataCenter.global_variable.multitree_display_mode;
        var tree = d3.layout.tree()
        .children(function(d){
            if(Array.isArray(d.values)) return d.values;
            return undefined;
        });
        var treeNodes = tree.nodes(tree_root);
        for(var i = 0;i < treeNodes.length;i++){
            treeNodes[i].belong_tree_index = addTreeCount;
            treeNodes[i].id = treeNodes[i].id.replace('CID编号_','');
            treeNodes[i].id = treeNodes[i].id.replace(';','');
        }
        var selectionTreeObject = {
            'tree_name': tree_name,
            //'tree_index':用于唯一区分信号树
            //'DivID':信号树所在的div的ID
            'tree_number': treeNumber,
            'depth': dataCenter.GLOBAL_STATIC.MAX_DEPTH,
            'tree_root': tree_root,
            'is_rolling_over':false,
            'data_list': data_list,
            'display_mode': displayMode,
            'location_object': new Object(),
            'tree_index': addTreeCount,//用于对于节点进行区分
            'tree_nodes': treeNodes,
        }
        dataCenter.global_variable.selection_object_array.push(selectionTreeObject);
        dataCenter.global_variable.add_tree_count = dataCenter.global_variable.add_tree_count + 1;
        self.update_location_object();
        function compute_label_number(){
            var selectionObjectArray = dataCenter.global_variable.selection_object_array;
            if(selectionObjectArray.length != 0){
                var range = d3.extent(selectionObjectArray, function(d,i){
                    return d.tree_number;
                });
                console.log('range', range);
                var currentTreeNumArray = [];
                for(var i = 0;i < selectionObjectArray.length;i++){
                    currentTreeNumArray.push(selectionObjectArray[i].tree_number);
                }
                //如果信号树index值并不是连续的
                for(var i = range[0];i < range[1];i++){
                    if(currentTreeNumArray.indexOf(i) == -1){
                        return i;
                    }
                }
                //如果信号树index值是连续的，则顺序向后取值
                return range[1] + 1;
            }
            return 1;
        }
    },
    update_location_object: function(){
        var objectArray = dataCenter.global_variable.selection_object_array;
        var wholeLevel = 0;
        var levelHeight = dataCenter.global_variable.standard_level_height;
        var comparisonViewHeight = $('#rightComparisonWrapper').height();
        var comparisonViewWidth = $('#rightComparisonWrapper').width();
        for(var i = 0;i < objectArray.length;i++){
            var displayMode = objectArray[i].display_mode;
            wholeLevel = wholeLevel + dataCenter.GLOBAL_STATIC.DISPLAY_MODE[displayMode];
        }
        if(wholeLevel > dataCenter.GLOBAL_STATIC.MAX_LEVEL){
            levelHeight = comparisonViewHeight / dataCenter.GLOBAL_STATIC.MAX_LEVEL;
            dataCenter.global_variable.real_level_height = levelHeight;
        }else if(wholeLevel < dataCenter.GLOBAL_STATIC.MIN_LEVEL){
            levelHeight = comparisonViewHeight / dataCenter.GLOBAL_STATIC.MIN_LEVEL;
            dataCenter.global_variable.real_level_height = levelHeight;
        }else{
            levelHeight = comparisonViewHeight / wholeLevel;
            dataCenter.global_variable.real_level_height = levelHeight;
        }
        var sumHeight = 0;
        for(var i = 0;i < objectArray.length;i++){
            objectArray[i].location_object = new Object();
            var displayMode = objectArray[i].display_mode;
            objectArray[i].location_object.width = comparisonViewWidth;
            objectArray[i].location_object.height = levelHeight * dataCenter.GLOBAL_STATIC.DISPLAY_MODE[displayMode];
            sumHeight = sumHeight + objectArray[i].location_object.height;
        }
        dataCenter.global_variable.sum_height = sumHeight;
    },
    _add_signal_tree_data: function(data){
        var self = this;
        var filePathName = dataCenter.global_variable.local_file;
        var filePath = 'data/' + filePathName + '/';
        //在数组中添加数据对象
        var sigtreeId = data;
        var processor = new sigtree.dataProcessor();
        var dataset = {
            id: sigtreeId,
            processor: processor
        }
        //将点击的信号树设置为当前操作信号树
        dataCenter.global_variable.current_operation_tree_name = data;
        //之前是否加载这个信号树
        var have_added_before = false;
        for(var i = 0;i < dataCenter.clone_datasets.length;i++){
            if(dataCenter.clone_datasets[i].id == data){
                //深拷贝clone_datasets中的元素，将拷贝得到的元素添加到dataCenter的datasets数组中
                //保证datasets与clone_datasets中的元素没有依赖性
                var signalTreeDataSetsObject = _.clone(dataCenter.clone_datasets[i]);
                dataCenter.datasets.push(signalTreeDataSetsObject);
                self._add_selection_object(signalTreeDataSetsObject.id, 
                            signalTreeDataSetsObject.processor.result.treeRoot, 
                            signalTreeDataSetsObject.processor.result.dataList);
                have_added_before = true;
                ObserverManager.post('draw-current-selection');
                ObserverManager.post('draw-current-operation');
                break;
            }
        }
        //之前不存在曾经加载这个信号树
        if(!have_added_before){
            var fileName = data + 'XX.csv';
            var file = filePath + fileName;
            var defer = dataset.processor.loadData(file);
            $.when(defer)
                .done(function(){
                    //拷贝信号树数据，并且深拷贝另一份数据文件添加到clone_datasets数组中
                    console.log('read data finish');
                    dataCenter.datasets.push(dataset);
                    self._add_selection_object(dataset.id, 
                                dataset.processor.result.treeRoot,
                                dataset.processor.result.dataList);
                    dataCenter.clone_datasets.push(_.clone(dataset));
                    ObserverManager.post('draw-current-selection');
                    ObserverManager.post('draw-current-operation');
            });
        }
    },
    _delete_signal_tree_data_and_object: function(data){
        var self = this;
        //删除数组中的数据对象
        var selectionObjectArray = dataCenter.global_variable.selection_object_array;
        for(var i = 0;i < dataCenter.datasets.length;i++){
            if(data == dataCenter.datasets[i].id){
                dataCenter.datasets.splice(i, 1);
                break;
            }
        }
        for(var i = 0;i < selectionObjectArray.length;i++){
            if(data == selectionObjectArray[i].tree_name){
                console.log(selectionObjectArray[i]);
                dataCenter.global_variable.delete_tree_index = selectionObjectArray[i].tree_index;
                selectionObjectArray.splice(i, 1);
                break;
            }
        }
        if(selectionObjectArray.length != 0){
            dataCenter.global_variable.current_operation_tree_name = 
                selectionObjectArray[selectionObjectArray.length - 1].tree_name;
        }else{
            dataCenter.global_variable.current_operation_tree_name = null;
        }
        self.update_location_object();
        ObserverManager.post('draw-current-selection');
        ObserverManager.post('draw-current-operation');
    },
    _change_signal_tree_data: function(data){
        dataCenter.global_variable.current_operation_tree_name = data;
        ObserverManager.post('draw-current-operation', data);
    },
    _get_current_operation_similar_array: function(){
        var operationSimilarArray = [];
        var currentOperationTreeName = dataCenter.global_variable.current_operation_tree_name;
        var similarityObjectMatrix = dataCenter.global_variable.similarity_object_matrix;
        for(var i = 0;i < similarityObjectMatrix.length;i++){
            var originName = similarityObjectMatrix[i][0].origin_name;
            if(originName == currentOperationTreeName){
                for(var j = 0;j < dataCenter.global_variable.hover_arc_link_num;j++){//
                    var targetName = similarityObjectMatrix[i][j].target_name;
                    operationSimilarArray.push(targetName);
                }
            }   
        }
        dataCenter.global_variable.operation_similar_array = operationSimilarArray;
    },
    reverse_signaltree: function(tree_id){
        var selectionObjectArray = dataCenter.global_variable.selection_object_array;
        for(var i = 0;i < selectionObjectArray.length;i++){
            if(selectionObjectArray[i].tree_name == tree_id){
                if(selectionObjectArray[i].is_rolling_over){
                    selectionObjectArray[i].is_rolling_over = false;
                }else{
                    selectionObjectArray[i].is_rolling_over = true;
                }
                break;
            }
        }
        ObserverManager.post('draw-current-selection');
        ObserverManager.post('draw-current-operation');
    },
    remove_signaltree: function(tree_id){
        var selectionObjectArray = dataCenter.global_variable.selection_object_array;
        for(var i = 0;i < selectionObjectArray.length;i++){
            if(selectionObjectArray[i].tree_name == tree_id){
               // var treeRoot =  selectionObjectArray[i].tree_root;
                console.log(selectionObjectArray[i]);
                dataCenter.global_variable.delete_tree_root = selectionObjectArray[i].tree_root;
                selectionObjectArray.splice(i, 1);
                break;
            }
        }
        ObserverManager.post('draw-current-selection');
    },
    change_display_mode: function(tree_object){
        var self = this;
        var displayModeName = dataCenter.GLOBAL_STATIC.DISPLAY_MODE_NAME;
        var nameLength = displayModeName.length;
        var displayMode = tree_object.display_mode;
        var nameIndex = displayModeName.indexOf(displayMode);
        var nextNameIndex = (nameIndex + 1)%nameLength;
        tree_object.display_mode = displayModeName[nextNameIndex];
        self.update_location_object();
        ObserverManager.post('draw-current-selection');
        ObserverManager.post('draw-current-operation');
    },
    change_to_show_two_depth: function(){
        var self = this;
        var selectionObjectArray = dataCenter.global_variable.selection_object_array;
        dataCenter.global_variable.multitree_display_mode = 
            dataCenter.global_variable.display_mode_object.last_level_flow;
        for(var i = 0;i < selectionObjectArray.length;i++){
            selectionObjectArray[i].display_mode = dataCenter.global_variable.display_mode_object.last_level_flow;
        }
        self.update_location_object();
        ObserverManager.post('draw-current-selection');
        ObserverManager.post('draw-current-operation');
    },
    change_to_show_all_depth: function(){
        var self = this;
        var selectionObjectArray = dataCenter.global_variable.selection_object_array;
        dataCenter.global_variable.multitree_display_mode = 
            dataCenter.global_variable.display_mode_object.whole_tree;
        for(var i = 0;i < selectionObjectArray.length;i++){
            selectionObjectArray[i].display_mode = dataCenter.global_variable.display_mode_object.whole_tree;
        }
        self.update_location_object();
        ObserverManager.post('draw-current-selection');
        ObserverManager.post('draw-current-operation');
    },
    change_comparison_show_only_flow: function(){
        var self = this;
        var selectionObjectArray = dataCenter.global_variable.selection_object_array;
        dataCenter.global_variable.multitree_display_mode = 
            dataCenter.global_variable.display_mode_object.flow;
        for(var i = 0;i < selectionObjectArray.length;i++){
            selectionObjectArray[i].display_mode = dataCenter.global_variable.display_mode_object.flow;
        }
        self.update_location_object();
        ObserverManager.post('draw-current-selection');
        ObserverManager.post('draw-current-operation');
    },
    OMListen: function(message, data){
        var self = this;
        //changeData信号是从treeselection界面中传递到main中，main中接收到之后对于所有的界面进行转发
        if (message == "changeData") {
            datasetID = _.clone(data);
            dataCenter.datasets = [];
            var defers = [];
            for (var i = data.length - 1; i >= 0; i--) {
                var id = data[i];
                var processor = new sigtree.dataProcessor();
                var dataset = {
                    id: id,
                    processor: processor
                }
                dataCenter.datasets.push(dataset)
                //var file = dataCenter.stats[id].file;
                var file = data[i] + 'XX.csv';
                var filePathName = dataCenter.global_variable.local_file;
                var filePath = 'data/' + filePathName + '/';
                file = filePath + file;
                defers.push(dataset.processor.loadData(file));
            }
            $.when.apply($, defers)
                .done(function() {
                    ObserverManager.post("update-view", dataCenter.datasets);
                    var currentId = dataCenter.global_variable.current_id;
                    if(currentId == null){
                        ObserverManager.post('clean-view');
                    }
            });
        }
        //click信号树的信号
        if(message == 'click-signal-tree'){
            var sigtreeName = data;
            console.log('data', data);
            var currentOperationTreeName = dataCenter.global_variable.current_operation_tree_name;
            if(sigtreeName == currentOperationTreeName){
                //当前操作状态的节点再次被点击，会取消选择该节点
                self._delete_signal_tree_data_and_object(data);
                ObserverManager.post('draw-current-operation', data);
            }else{
                //判断当前点击的节点时候已经被选择，没有被选择，需要重新加载数据，否则直接改变当前操作节点即可
                var have_added_now = false
                for(var i = 0;i < dataCenter.datasets.length;i++){
                    var dataObj = dataCenter.datasets[i];
                    if(dataObj.id == sigtreeName){
                        //删除需要删除的数组元素
                        have_added_now = true;
                        self._change_signal_tree_data(data);
                    }
                }
                //判断点击显示选择节点，并且该节点作为当前操作的状态或者点击取消选择该节点
                if(!have_added_now){
                    self._add_signal_tree_data(data);
                } 
            }
        }
        if(message == 'compare-click-signal-tree'){
            self._change_signal_tree_data(data);
        }
        //mouseover信号树的信号
        if(message == 'mouseover-signal-tree'){
            dataCenter.global_variable.hover_tree_name = data;
            ObserverManager.post('draw-current-hover');
        }
        //mouseout信号树的信号
        if(message == 'mouseout-signal-tree'){
            dataCenter.global_variable.hover_tree_name = null;
            ObserverManager.post('remove-current-hover');
        }
        //
        if((message == 'set:hover_arc_link_num') || (message == 'click-signal-tree')){
            self._get_current_operation_similar_array();
        }
        if(message == 'remove-signaltree'){
            var treeId = data;
            self._delete_signal_tree_data_and_object(data);
        }
        if(message == 'reverse-signaltree'){
            var treeId = data;
            self.reverse_signaltree(treeId);
        }
        if(message == 'change-display-mode'){
            var treeObject = data;
            self.change_display_mode(treeObject);
        }
        if(message == 'comparison-show-two-depth'){
            self.change_to_show_two_depth();
        }
        if(message == 'comparison-show-all-depth'){
            self.change_to_show_all_depth();
        }
        if(message == 'comparison-show-only-flow'){
            self.change_comparison_show_only_flow();
        }
        if(message == 'change-data-set'){
            self._main_controller();
        }
    }
}