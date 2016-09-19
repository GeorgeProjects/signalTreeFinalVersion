var multiTreeComparison = {
	name: 'multiTreeComparisonView',
	treeIdPrefix: 'tree-div-',
	nodeIdPrefix: 'compare-node-', 
	linkIdPrefix: 'compare-link-',
	barIdPrefix: 'compare-bar-',
	treeViewIdPrefix: 'treeview-', 
	treeViewGPrefix: 'treeview-g-',
	treeViewSvgPrefix: 'treeview-svg-',
	histogramDivPrefix: 'histogram-div-',
	histogramGPrefix: 'histogram-g-',
	histogramSvgPrefix: 'histogram-svg-',
	polygonPrefix: 'compare-polygon-',
	totalNodes: null,
	totalRoot: null,
	currentDepth: 0,
	iconWidth: 25,
	focusRange: [0, 1],
	leftContextScaleStart: 0,
	leftContextScaleEnd: 1/8,
	focusScaleStart: 1/8,
	focusScaleEnd: 7/8,
	rightContextScaleStart: 7/8,
	rightContextScaleEnd: 1,
	tree: d3.layout.tree()
		.children(function(d){
			if(Array.isArray(d.values)) return d.values;
			return undefined;
		})
		.separation(function(a, b) { 
			var dis = (a.parent == b.parent ? 1 : 2) / a.depth;
			if(a.depth <= 2 && b.depth <= 2)
				dis = 10;
			if(a.depth == 3 && b.depth == 3)
				dis = 1;
			if(a.parent && b.parent){
            	return dis;
			}
            return 1;
		}),
	all_tree: d3.layout.tree()
		.children(function(d){
			if(Array.isArray(d.values)){
				return d.values;
			}else if(Array.isArray(d._values)){
				return d._values;
			}
			return undefined;
		})
		.separation(function(a, b) { 
			var dis = (a.parent == b.parent ? 1 : 2) / a.depth;
			if(a.depth <= 2 && b.depth <= 2)
				dis = 10;
			if(a.depth == 3 && b.depth == 3)
				dis = 1;
			if(a.parent && b.parent){
            	return dis;
			}
            return 1;
	}),
	tip: d3.tip()
	.attr('class', 'd3-tip')
	.offset([-10, 0])
	.html(function(d) {
	  	return "Name: <span style='color:#ff5858'>" +  d.key + "</span>"  + " flow:<span style='color:#ff5858'>" +  d3.format(".3s")(d.flow) + "</span>";//d.time +
	}),
	initialize: function(){
		var self = this;
		self._add_to_listener();
		self._bind_view();
		self._compute_all_nodes_and_render();
	},
	_add_to_listener: function(){
		var self = this;
		ObserverManager.addListener(self);
	},
	_bind_view: function(){
	},
	_compute_all_nodes_and_render: function(){
		var self = this;
		var objectArray = dataCenter.global_variable.selection_object_array;
		var totalRoot = sigtree.dataProcessor().mergeTwoListAsTree([], []);//supertree根节点
		totalRoot.has = new Object();
		self.totalRoot = totalRoot;
		self.currentDepth = dataCenter.global_variable.comparison_view_current_depth;
		var treeIdPrefix = self.treeIdPrefix;
		var nodeIdPrefix = self.nodeIdPrefix;
		var tree = self.tree;
		var objectArrayLength = objectArray.length;
		for(var i = 0;i < objectArrayLength;i++){
			totalRoot.has[objectArray[i].tree_index] = true;
			var treeNodeList = tree.nodes(objectArray[i].tree_root);
			var deleteTreeIndex = dataCenter.global_variable.delete_tree_index;
			_clear_has_obj(treeNodeList);
			_delete_added_nodes(objectArray[i].tree_root, deleteTreeIndex);
			var totalNodes = tree.nodes(objectArray[i].tree_root);
			var count = 0;
			for(var j = 0;j < totalNodes.length;j++){
				if(totalNodes[j].belong_tree_index == deleteTreeIndex){
					count = count + 1;
				}
			}
			merge_trees(totalRoot, objectArray[i].tree_root, objectArray[i].tree_index);
		}	
		var totalNodes = tree.nodes(totalRoot);
		//_filter_by_level(totalNodes, dataCenter.global_variable.comparison_view_current_depth);
		self.totalNodes = totalNodes;
		var countArray = [0,0,0,0,0,0,0,0];
		var count0 = 0;
		for(var i = 0;i < totalNodes.length;i++){
			if(totalNodes[i].has != undefined){
				if(totalNodes[i].has[0]){
					count0 = count0 + 1;
				}
			}
			for(var j = 0;j < countArray.length;j++){
				if(totalNodes[i].has != undefined){
					if(totalNodes[i].has[j]){
						countArray[j] = countArray[j] + 1;
						//break;
					}
				}
			}
		}
		_update_single_tree_container(objectArray);
		self._render_view(totalNodes);
		_add_all_tree_label(objectArray);
		//根据层级筛选节点
		function _filter_by_level(total_nodes, current_depth){
			var totalNodes = total_nodes.filter(function(d){
				if(total_nodes <= current_depth){
					return d;
				}
			})
			return totalNodes;
		}
		function merge_trees(root1, root2, index){
			if(root1._children){root1.children = root1._children;}
			if(root1._values){root1.values = root1._values;}
			if(root2._children){root2.children = root2._children;}
			if(root2._values){root2.values = root2._values;}
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
				root.added = index;
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
		function _delete_added_nodes(root, index){
			var rootChildren = root.children;
			if(rootChildren != undefined){
				for(var i = 0;i < rootChildren.length;i++){
					if(rootChildren[i].belong_tree_index == index){
						//delete rootChildren[i];
						rootChildren.splice(i, 1);
						i--;
					}else{
						_delete_added_nodes(rootChildren[i], index);
					}
				}
			}
		}
		function _clear_has_obj(tree_node_list){
			if(tree_node_list != null){
				for(var i = 0;i < tree_node_list.length;i++){
					if(tree_node_list[i] != undefined){
						tree_node_list[i].has = null;
					}
				}
			}	
		}
		function _update_single_tree_container(object_array){
			var objectArray = dataCenter.global_variable.selection_object_array;
			d3.selectAll('#multitree .ui-sortable-handle')
			.each(function(d,i){
				var signalTreeId = d3.select(this).select('.comparison-signaltree-div').attr('id').replace('tree-div-', '');
				if(!is_exist(signalTreeId, objectArray)){
					d3.select(this).remove();
				}
			});
			$('#multitree').height(dataCenter.global_variable.sum_height);
			for(var i = 0;i < objectArray.length;i++){
				var treeName = objectArray[i].tree_name;
				var treeNumber = objectArray[i].tree_number;
				var treeId = treeIdPrefix + treeName;
				var locationObject = objectArray[i].location_object;
				var width = locationObject.width;
				var height = locationObject.height;
				var rollingOver = objectArray[i].is_rolling_over;
				//_add_tree_label(treeId, rollingOver, treeNumber);
				//_divide_container(treeId, rollingOver, height);
				if($('#' + treeId)[0]){
					//如果之前选择了该信号树，只需要改变这个信号树的高度，并不需要新增加div
					_change_container(treeId, treeName, rollingOver, height);
				}else{
					d3.select("#multitree")
					  .append("li")
					  .attr('class', 'ui-sortable-handle')
					  .append("div").attr("id",function(){
						return treeId;
					  })
					  .attr('class', function(d,i){
					  	var classArray = ['comparison-signaltree-div'];
					  	if(dataCenter.global_variable.current_bg_color == 'black'){
					  		classArray.push('black-border');
					  	}else{
					  		classArray.push('white-border');
					  	}
						return self._group_class(classArray)
					  })
					  .style("position","relative")
					  .style('width', width + 'px')
					  .style('height', height + 'px');
					  //如果之前没有选择该信号树,需要新增加div
					  _divide_container(treeId, treeName, rollingOver, height);
				}
				$('div#' + treeId).mouseover(function(){
					var treeId = $(this).attr('id');
					var treeName = treeId.replace(treeIdPrefix, '');
					dataCenter.global_variable.current_mouseover_signaltree = treeName;
				});
			}
		}
		function is_exist(signal_tree_id, object_array){
			for(var i = 0;i < object_array.length;i++){
				if(object_array[i].tree_name == signal_tree_id){
					return true;
				}
			}
			return false;
		}
		function _add_all_tree_label(object_array){
			var objectArray = object_array;
			for(var i = 0;i < objectArray.length;i++){
				var treeName = objectArray[i].tree_name;
				var treeNumber = objectArray[i].tree_number;
				var treeId = treeIdPrefix + treeName;
				var locationObject = objectArray[i].location_object;
				var rollingOver = objectArray[i].is_rolling_over;
				_add_tree_label(treeId, rollingOver, treeNumber, objectArray[i]);
			}
		}
		function _add_tree_label(div_id, rolling_over, tree_number, tree_object){
			var iconWidth = self.iconWidth;
			var objectArray = dataCenter.global_variable.object_array;
			var treeObject = tree_object;
			//判断是否已经添加了每个信号树的label，已经存在的信号树的标号不会更新，因此添加完成之后不需要更新
			if($('#' + div_id + ' #icon-container').length == 0){
				d3.select('#' + div_id)
				.append('div')
				.attr('id', 'icon-container')
				.style('width', iconWidth + 'px');

				d3.select('#' + div_id + ' #icon-container')
				.append('div')
				.attr('class', 'div-icon-container')
				.append('span')
				.attr('id', 'node-type')
				.attr('class', 'btn btn-default btn-xs label')
				.html(tree_number);
				
				d3.select('#' + div_id)//+ ' #icon-container'
				.append('div')
				.attr('class', 'div-instrument-container rolling-over')
				.append('span')
				.attr('class', 'btn btn-default btn-xs')
				.append('span')
				.attr('class', 'glyphicon glyphicon-sort');

				d3.select('#' + div_id)// + ' #icon-container'
				.append('div')
				.attr('class', 'div-instrument-container operation')
				.append('span')
				.attr('class', 'btn btn-default btn-xs')
				.append('span')
				.attr('class', 'glyphicon glyphicon-pushpin');

				d3.select('#' + div_id)//+ ' #icon-container'
				.append('div')
				.attr('class', 'div-instrument-container remove')
				.append('span')
				.attr('class', 'btn btn-default btn-xs')
				.append('span')
				.attr('class', 'glyphicon glyphicon-remove');

				if(rolling_over){
					//翻转状态的是橙色
					$('#' + div_id + ' #icon-container #node-type').removeClass('blue-label');
					$('#' + div_id + ' #icon-container #node-type').addClass('orange-label');
				}else{
					//默认状体是蓝色
					$('#' + div_id + ' #icon-container #node-type').removeClass('orange-label');
					$('#' + div_id + ' #icon-container #node-type').addClass('blue-label');
				}
				$('#' + div_id).mouseover(function(d,i){
					var containerVisibility = $('#' + div_id + ' .div-instrument-container').css("visibility");
					$('#' + div_id + ' .div-instrument-container').css('visibility', 'visible');			
				});
				$('#' + div_id).mouseout(function(d,i){
					var containerVisibility = $('#' + div_id + ' .div-instrument-container').css("visibility");
					$('#' + div_id + ' .div-instrument-container').css('visibility', 'hidden');			
				});
				//在反转按钮与删除按钮上面添加监听器
				$('#' + div_id + ' .rolling-over').click(function(d,i){
					var treeId = div_id.replace('tree-div-', '');
					//_reverse_tree(treeId);
					ObserverManager.post('reverse-signaltree', treeId);
				});
				$('#' + div_id + ' .remove').click(function(d,i){
					var treeId = div_id.replace('tree-div-', '');
					//_remove(treeId);
					ObserverManager.post('remove-signaltree', treeId);
				});
				$('#' + div_id + ' .operation').click(function(d,i){
					var treeId = div_id.replace('tree-div-', '');
					ObserverManager.post('compare-click-signal-tree', treeId);
				});
				$('#' + div_id).dblclick(function(d,i){
					ObserverManager.post('change-display-mode', treeObject);
				});
				$('#' + div_id + ' #icon-container').mouseover(function(d,i){
					$(this).addClass('mouse-move');
				});
				$('#' + div_id + ' #icon-container').mouseout(function(d,i){
					$(this).removeClass('mouse-move');
				});
			}else{
				if(rolling_over){
					//翻转状态的是橙色
					$('#' + div_id + ' #icon-container #node-type').removeClass('blue-label');
					$('#' + div_id + ' #icon-container #node-type').addClass('orange-label');
				}else{
					//默认状体是蓝色
					$('#' + div_id + ' #icon-container #node-type').removeClass('orange-label');
					$('#' + div_id + ' #icon-container #node-type').addClass('blue-label');
				}
			}
		}
		function _change_container(div_id, tree_name, rolling_over, div_height){
			var iconWidth = self.iconWidth;
			var realLevelHeight = dataCenter.global_variable.real_level_height;
			var treeTop = 0, treeLeft = 0, treeRight = 0, treeBottom = 0;
			var histogramTop = 0, histogramLeft = 0, histogramRight = 0, histogramBottom = 0;
			var treeViewIdPrefix = self.treeViewIdPrefix;
			var treeViewGPrefix = self.treeViewGPrefix;
			var treeViewSvgPrefix = self.treeViewSvgPrefix;
			var histogramDivPrefix = self.histogramDivPrefix;
			var histogramGPrefix = self.histogramGPrefix;
			var histogramSvgPrefix = self.histogramSvgPrefix;
			var marginTree = {
				top: 20, right: 10, left: 10, bottom: 0
			};
			if(rolling_over){
				marginTree = {
					top: 0, right: 10, left: 10, bottom: 20
				};
			}
			var marginHistogram = {
				top: 0, right: 10, left: 10, bottom: 10
			};
			if(!rolling_over){
				//没有被反转，则下面是柱状图，上面是multi-level node-link视图
				treeTop = 0;
				treeLeft = iconWidth;
				treeRight = 0;
				treeBottom = realLevelHeight;
				histogramTop = div_height - realLevelHeight;
				histogramLeft = iconWidth;
				histogramRight = 0;
				histogramBottom = 0;
			}else{
				//翻转的情况下，上方是柱状图，下方是multi-level视图
				histogramTop = 0;
				histogramBottom = div_height - realLevelHeight;
				histogramLeft = iconWidth;
				histogramRight = 0;
				treeTop = realLevelHeight;
				treeLeft = iconWidth;
				treeRight = 0;
				treeBottom = 0;
			}
			d3.select('#' + div_id)
				.style('height', div_height + 'px');
			d3.select('#' + treeViewIdPrefix + tree_name)
				.style('position', 'absolute')
				.style('top', treeTop + 'px')
				.style('bottom', treeBottom + 'px')
				.style('right', treeRight + 'px')
				.style('left', treeLeft + 'px')
				.select('#' + treeViewSvgPrefix + tree_name)
				.style('width', '100%')
				.style('height', '100%');
			var treeWidth = $('#' + treeViewSvgPrefix + tree_name).width();
			var treeHeight =  $('#' + treeViewSvgPrefix + tree_name).height();			
			d3.select('#' + treeViewSvgPrefix + tree_name)
				.attr('width', treeWidth)
				.attr('height', treeHeight)
				.select('#' + histogramGPrefix + tree_name)
				.attr('transform', 'translate(' + marginTree.left + ',' + marginTree.top + ')');
			//变换histogram的位置
			d3.select('#' + histogramDivPrefix + tree_name)
			  .style('position', 'absolute')
			  .style('top', histogramTop + 'px')
			  .style('bottom', histogramBottom + 'px')
			  .style('right', histogramRight + 'px')
			  .style('left', histogramLeft + 'px');
			var histogramWidth = $('#' + histogramDivPrefix + tree_name).width();
			var histogramHeight =  $('#' + histogramDivPrefix + tree_name).height();
			d3.select('#' + histogramSvgPrefix + tree_name)
				.attr('width', histogramWidth)
				.attr('height', histogramHeight)
				.select('#' + histogramGPrefix + tree_name)
				.attr('transform', 'translate(' + marginHistogram.left + ',' + marginHistogram.top + ')');
		}
		function _divide_container(div_id, tree_name, rolling_over, div_height){
			//realLevelHeight是真实情况下信号树每一层的高度
			var iconWidth = self.iconWidth;
			var realLevelHeight = dataCenter.global_variable.real_level_height;
			var treeTop = 0, treeLeft = 0, treeRight = 0, treeBottom = 0;
			var histogramTop = 0, histogramLeft = 0, histogramRight = 0, histogramBottom = 0;
			var marginTree = {
				top: 20, right: 10, left: 10, bottom: 0
			};
			var marginHistogram = {
				top: 0, right: 10, left: 10, bottom: 10
			};
			var treeViewIdPrefix = self.treeViewIdPrefix;
			var treeViewGPrefix = self.treeViewGPrefix;
			var treeViewSvgPrefix = self.treeViewSvgPrefix;
			var histogramDivPrefix = self.histogramDivPrefix;
			var histogramGPrefix = self.histogramGPrefix;
			var histogramSvgPrefix = self.histogramSvgPrefix;
			if(!rolling_over){
				//没有被反转，则下面是柱状图，上面是multi-level node-link视图
				treeTop = 0;
				treeLeft = iconWidth;
				treeRight = 0;
				treeBottom = realLevelHeight;
				histogramTop = div_height - realLevelHeight;
				histogramLeft = iconWidth;
				histogramRight = 0;
				histogramBottom = 0;
			}else{
				//翻转的情况下，上方是柱状图，下方是multi-level视图
				histogramTop = 0;
				histogramBottom = div_height - realLevelHeight;
				histogramLeft = iconWidth;
				histogramRight = 0;
				treeTop = realLevelHeight;
				treeLeft = iconWidth;
				treeRight = 0;
				treeBottom = 0;
			}
			//增加tree view
			d3.select('#' + div_id)
			  .append('div')
			  .attr('id', function(d,i){
			  	return treeViewIdPrefix + tree_name;
			  })
			  .attr('class', 'tree-node-link-div')
			  .style('position', 'absolute')
			  .style('top', treeTop + 'px')
			  .style('bottom', treeBottom + 'px')
			  .style('right', treeRight + 'px')
			  .style('left', treeLeft + 'px')
			  .append('svg')
			  .attr('class', 'treeview')
			  .attr('id', function(d,i){
			  	return treeViewSvgPrefix + tree_name;
			  })
			  .style('width', '100%')
			  .style('height', '100%');
			var treeWidth = $('#' + div_id + ' #treeview').width();
			var treeHeight =  $('#' + div_id + ' #treeview').height();
			d3.select('#' + treeViewSvgPrefix + tree_name)
				.attr('width', treeWidth)
				.attr('height', treeHeight)
				.append('g')
				.attr('id', function(d,i){
					return treeViewGPrefix + tree_name;
				})
				.attr('transform', 'translate(' + marginTree.left + ',' + marginTree.top + ')');
			//增加histogram view	
			d3.select('#' + div_id)
			  .append('div')
			  .attr('id', function(d,i){
			  	return histogramDivPrefix + tree_name;
			  })
			  .attr('class', 'tree-node-link-histogram')
			  .style('position', 'absolute')
			  .style('top', histogramTop + 'px')
			  .style('bottom', histogramBottom + 'px')
			  .style('right', histogramRight + 'px')
			  .style('left', histogramLeft + 'px')
			  .append('svg')
			  .attr('class', 'histogram')
			  .attr('id', function(d,i){
			  	return histogramSvgPrefix + tree_name;
			  })
			  .style('width', '100%')
			  .style('height', '100%');
			var tip = self.tip;
			d3.select('#' + treeViewSvgPrefix + tree_name)
				.call(tip);
			var histogramWidth = $('#' + div_id + ' #histogram').width();
			var histogramHeight =  $('#' + div_id + ' #histogram').height();
			d3.select('#' + histogramSvgPrefix + tree_name)
				.attr('width', histogramWidth)
				.attr('height', histogramHeight)
				.append('g')
				.attr('id', function(d,i){
					return histogramGPrefix + tree_name;
				})
				.attr('transform', 'translate(' + marginHistogram.left + ',' + marginHistogram.top + ')');
		}
	},
	_render_view: function(total_nodes){
		var self = this;	
		var currentDepth = self.currentDepth;	
		var objectArray = dataCenter.global_variable.selection_object_array;
		//每个信号树的div中增加可以移动的div
		var multiTreeContainer = d3.select('#multitree');
		//信号树能够沿y轴拖动
		$( "#multitree" ).sortable({
			//cancel:".g_for_brush",
			axis:"y",
			//拖动结束时调用
			stop: function() {
				//draw_flow_color();
				//绘制没有最下层节点时的虚线连接
				//draw_dash_line();
			}
		});
		for(var i = 0;i < objectArray.length;i++){//
			if(objectArray[i].is_rolling_over){
				self.draw_reverse_tree(total_nodes, objectArray[i]);
				self.draw_reverse_trend(total_nodes, objectArray[i], currentDepth);
			}else{
				self.draw_single_tree(total_nodes, objectArray[i]);
				self.draw_trend(total_nodes, objectArray[i], currentDepth);
			}
		}
		self.add_mouseover_handler();
		self.add_mouseout_handler();
		//self.add_click_handler();
		self._draw_current_operation();
	},
	draw_trend: function(total_nodes, tree_info_object, current_depth){
		//存在一些节点的target是undefined
		var self = this;
		var focusScaleStart = self.focusScaleStart;
		var focusScaleEnd = self.focusScaleEnd;
		var sqrtScale = d3.scale.sqrt();
		var treeName = tree_info_object.tree_name;
		var rollingOver = tree_info_object.is_rolling_over;
		var displayMode = tree_info_object.display_mode;
		var treeIndex = tree_info_object.tree_index;
		var treeIdPrefix = self.treeIdPrefix;
		var treeId = treeIdPrefix + treeName;
		var nodeIdPrefix = self.nodeIdPrefix;
		var barIdPrefix = self.barIdPrefix;
		var histogramDivPrefix = self.histogramDivPrefix;
		var histogramSvgPrefix = self.histogramSvgPrefix;
		var histogramGPrefix = self.histogramGPrefix;
		var DURATION = 750;
		var focusRange = self.focusRange;
		var operationTreeIndex = get_current_operation_index();
		var leaves = total_nodes.filter(function(d){
			if(dataCenter.global_variable.comparison_show_similiar){
				return (d.depth == current_depth) && (d.has[treeIndex]) && (d.has[operationTreeIndex]);
			}else{
				return (d.depth == current_depth) && (d.has[treeIndex]);
			}
			//&& (d.x>=focusRange[0]) && (d.x<=focusRange[1])
		});
		var allLeaves = total_nodes.filter(function(d){
			return (d.depth == current_depth);// && (d.x>=focusRange[0]) && (d.x<=focusRange[1])
		});
		var maxValue = d3.max(allLeaves, function(d,i){
			var value = 0;
			value = d.flow;
			return sqrtScale(value);
		});
		var width = $('#' + histogramDivPrefix + treeName).width();
		var height =  $('#' + histogramDivPrefix + treeName).height();
		var margin = {
			top: 0, right: 10, left: 10, bottom: 10
		};
		var histogramWidth = width - margin.left - margin.right;
		var histogramHeight = height - margin.top - margin.bottom;
		var valueSale = d3.scale.linear()
			.domain([0, maxValue])
			.range([0, histogramHeight]);
		var leftXScale = d3.scale.linear()
			.domain([0, focusRange[0]])
			.range([0, histogramWidth * focusScaleStart]);
		var rightXScale = d3.scale.linear()
			.domain([focusRange[1], 1])
			.range([histogramWidth * focusScaleEnd, histogramWidth]);
		var xScale = d3.scale.linear()
			.domain(focusRange);
		if((focusRange[0] == 0) && (focusRange[1] == 1)){
			xScale.range([0, histogramWidth]);
		}else{
			xScale.range([histogramWidth * focusScaleStart, histogramWidth * focusScaleEnd]);
		}
		var brush = d3.svg.brush()
		    .x(xScale)
		    //.on("click", brush_click_handler)
		    .on("brushstart", brushstart)
		    .on("brush", brushmove)
		    .on("brushend", function(d,i){
		    	brushend();
		    });
		var histogramSvg = d3.select('#' + histogramGPrefix + treeName)
			.attr('transform', 'translate(' + margin.left + ',' + margin.top +')'); 
		var histogramBar = histogramSvg.selectAll('.compare-bar')
		.data(leaves, function(d,i){
			return d.id;
		});
		histogramBar.exit()
		.remove();
		histogramBar.enter()
		.append('rect')
		.attr('class', function(d,i){
			var nodeClassArray = ['compare-bar'];
			if(rollingOver){
				nodeClassArray.push('orange-bar')
			}else{
				nodeClassArray.push('blue-bar')
			}
			return self._group_class(nodeClassArray);
		})
		.attr('id', function(d,i){
			var barIdName = d.id;
			var barId = barIdPrefix + barIdName;
			return barId;
		})
		.attr('x', function(d,i){
			var cx = +d.x;
			return _cx_handler(cx);
		})
		.attr('y', 0)
		.attr('width', 2)
		.attr('height', function(d,i){
			var value = +d.values;
			if(!isNaN(value)){
				return valueSale(Math.sqrt(value));
			}else{
				return 0;
			}
		});
		histogramBar.transition()
		.duration(DURATION)
		.attr('class', function(d,i){
			var nodeClassArray = ['compare-bar'];
			if(rollingOver){
				nodeClassArray.push('orange-bar')
			}else{
				nodeClassArray.push('blue-bar')
			}
			return self._group_class(nodeClassArray);
		})
		.attr('id', function(d,i){
			var barIdName = d.id;
			var barId = barIdPrefix + barIdName;
			return barId;
		})
		.attr('x', function(d,i){
			var cx = +d.x;
			return _cx_handler(cx);
		})
		.attr('y', 0)
		.attr('width', 2)
		.attr('height', function(d,i){
			var value = d.flow;
			if(!isNaN(value)){
				return valueSale(sqrtScale(value));
			}else{
				return 0;
			}	
		});
		//append brush function
		//防止重复添加多个brush g
		if($('#' + treeId + ' .brush').length == 0){
			histogramSvg.append("g")
		    .attr("class", "brush")
		    .call(brush)
		  	.selectAll('rect')
		    .attr('height', height);
		}else{
			d3.select('#' + treeId + ' .brush')
			.selectAll('rect')
			.attr('height', height);
		}
		histogramSvg.on("mousedown", function() {
			d3.event.stopPropagation(); 
		});
		function brushstart(){
			//$('#multitree .extent').css('visibility', 'visible');
		}
		function brushmove() {
		}
		function brushend() {
			var focusRange = self.focusRange;
			var extent = brush.extent();
			//通过比例关系计算新刷选得到的范围
			if((focusRange[0] == 0) && (focusRange[1] == 1)){
				var extentRangeLength = extent[1] - extent[0];
				if(extentRangeLength > 0.01){
					self.focusRange = extent;
					$('#resize-brush').removeClass('active')
				}
			}else{
				var extentRangeLength = extent[1] - extent[0];
				if(extentRangeLength > 0.01){
					extent[0] = _cx_back_handler(extent[0]);
					extent[1] = _cx_back_handler(extent[1]);
					self.focusRange = extent;
					$('#resize-brush').removeClass('active')
				}
			}
			$('#multitree .extent').attr('width', 0);
			self._compute_all_nodes_and_render();
		}
		function get_current_operation_index(){
			var selectionObjectArray = dataCenter.global_variable.selection_object_array;
			var currentOperationTreeName = dataCenter.global_variable.current_operation_tree_name;
			for(var i = 0;i < selectionObjectArray.length;i++){
				if(selectionObjectArray[i].tree_name == currentOperationTreeName){
					return selectionObjectArray[i].tree_index;
					break;
				}
			}
		}
		function _cx_back_handler(cx){
			var focusScaleStart = self.focusScaleStart;
			var focusScaleEnd = self.focusScaleEnd;
			var focusRange = self.focusRange;
			var leftBackScale = d3.scale.linear().domain([0, focusScaleStart]).range([0, focusRange[0]]);
			var centerBackScale = d3.scale.linear().domain([focusScaleStart, focusScaleEnd]).range([focusRange[0], focusRange[1]]);
			var rightBackScale = d3.scale.linear().domain([focusScaleEnd, 1]).range([focusRange[1], 1]);
			var backCx = 0;
			if(cx < focusScaleStart){
				backCx = leftBackScale(cx);
			}
			if((cx >= focusScaleStart) && (cx <= focusScaleEnd)){
				backCx = centerBackScale(cx);
			}
			if(cx > focusScaleEnd){
				backCx = rightBackScale(cx);
			}
			return backCx;
		}
		//focusRange与xScale, leftXScale, rightXScale都是全局定义的变量
		function _cx_handler(cx){
			if((cx >= focusRange[0]) && (cx <= focusRange[1])){
				return xScale(cx);
			}else if(cx < focusRange[0]){
				return leftXScale(cx);
			}else if(cx > focusRange[1]){
				return rightXScale(cx);
			}	
		}
	},
	draw_single_tree: function(total_nodes, tree_info_object){
		var self = this;
		var focusScaleStart = self.focusScaleStart;
		var focusScaleEnd = self.focusScaleEnd;
		var treeName = tree_info_object.tree_name;
		var treeIdPrefix = self.treeIdPrefix;
		var treeId = treeIdPrefix + treeName;
		var rollingOver = tree_info_object.is_rolling_over;
		var displayMode = tree_info_object.display_mode;
		var treeIndex = tree_info_object.tree_index;
		var nodeIdPrefix = self.nodeIdPrefix;
		var linkIdPrefix = self.linkIdPrefix;
		var nodePadding = 15;
		var DURATION = 750;
		var maxDepth = dataCenter.GLOBAL_STATIC.MAX_DEPTH;
		var treeViewIdPrefix = self.treeViewIdPrefix;
		var treeViewGPrefix = self.treeViewGPrefix;
		var treeViewSvgPrefix = self.treeViewSvgPrefix;
		var width = $('#' + treeViewIdPrefix + treeName).width();
		var height =  $('#' + treeViewIdPrefix + treeName).height();
		var margin = {
			top: 20, right: 10, left: 10, bottom: 6
		}
		var treeWidth = width - margin.left - margin.right;
		var treeHeight = height - margin.top - margin.bottom;
		var tree = self.tree;
		var focusRange = self.focusRange;
		var leftXScale = d3.scale.linear()
			.domain([0, focusRange[0]])
			.range([0, treeWidth * focusScaleStart]);
		var rightXScale = d3.scale.linear()
			.domain([focusRange[1], 1])
			.range([treeWidth * focusScaleEnd, treeWidth]);
		var xScale = d3.scale.linear()
			.domain(focusRange);
		if((focusRange[0] == 0) && (focusRange[1] == 1)){
			xScale.range([0, treeWidth]);
		}else{
			xScale.range([treeWidth * focusScaleStart, treeWidth * focusScaleEnd]);
		}
		var yScale = d3.scale.linear()
			.domain([0, (0.25 * dataCenter.global_variable.comparison_view_current_depth)])
			.range([0, treeHeight]);
		var treeSvg = d3.select('#' + treeViewGPrefix + treeName)
			.attr('transform', 'translate(' + margin.left + ',' + margin.top +')'); 
		//筛选的顺序是每次将brush的全部节点计算得到，包括上层节点
		//计算节点的坐标位置
		//对于节点按照树的标号进行筛选
		//对于不同信号树的绘制方式，再次进行筛选，得到需要进行绘制的部分，比如说只有流量层，或者最后一层节点
		var nodesTodraw = new Array();
		total_nodes = _filter_by_depth(total_nodes);
		nodesToDraw = _compute_node_range_array(total_nodes);
		//var nodesToDrawAddRange = _filter_brush_node(nodesToDraw, focusRange);
		//var nodesTodrawAddCenter = _compute_node_center_x_to_draw(nodesToDrawAddRange);
		var nodesToDrawAddExistInRange = _filter_brush_exist_node(nodesToDraw, focusRange);
		var nodesTodrawAddCenter = _compute_range_node_center_x_to_draw(nodesToDrawAddExistInRange);
		if(dataCenter.global_variable.comparison_show_similiar){
			//筛选与当前操作信号树相同的节点
			nodesTodrawAddCenter = _filter_according_to_same(nodesTodrawAddCenter);
		}
		var nodesToDrawFilter = _filter_according_to_index(nodesTodrawAddCenter, treeIndex);
		var diagonal = d3.svg.diagonal();
		//--------------------------------------------------
		//绘制节点之间的连边
		//--------------------------------------------------
		//选择要绘制的节点连接边
		var linksToDrawFinal = new Array();
		var nodesToDrawFinal = new Array();
		var tip = self.tip;
		if(displayMode == dataCenter.global_variable.display_mode_object.whole_tree){
			//nodesTodraw = _compute_node_center_x_to_draw(nodesToDraw);
			//计算包含所有节点ID的数组
			var nodesToDrawId = new Array();
			for(var i = 0;i < nodesToDrawFilter.length;i++){
				nodesToDrawId.push(nodesToDrawFilter[i].id);
			}
			//保留的target节点和source节点都是存在的
			linksToDrawFinal = tree.links(nodesToDrawFilter).filter(function(l){
				//存在一些节点的target是undefined
				if((nodesToDrawId.indexOf(l.source.id) != -1) && (nodesToDrawId.indexOf(l.target.id) != -1)){
					return true;
				}
				return false;
			});
			for(var i = 0; i < nodesToDrawFilter.length;i++){
				nodesToDrawFilter[i].y = nodesToDrawFilter[i].depth * 0.25;
			}
			nodesToDrawFinal = nodesToDrawFilter;
		}else if(displayMode == dataCenter.global_variable.display_mode_object.last_level_flow){
			var lastLevelFlowScale = d3.scale.linear()
				.domain([0.75, 1])
				.range([0, 1]);
			nodesToDrawLastLevelFlow = nodesToDrawFilter.filter(function(d){
				if(d.depth >= (maxDepth - 1)){
					return true;
				}
				return false;
			});
			//nodesTodraw = _compute_node_center_x_to_draw(nodesToDraw);
			//将计算错误的节点恢复到正确的y坐标上
			for(var i = 0;i < nodesToDraw.length;i++){
				var y = nodesToDraw[i].y;
				var depth = nodesToDraw[i].depth;
				if((y < 0.75) || (y > 1)){
					if(depth == 3){
						nodesToDraw[i].y = 0.75;
					}
				}
			}
			//计算包含所有节点ID的数组
			var nodesToDrawId = new Array();
			for(var i = 0;i < nodesToDrawLastLevelFlow.length;i++){
				nodesToDrawId.push(nodesToDrawLastLevelFlow[i].id);
			}
			linksToDrawFinal = tree.links(nodesToDrawLastLevelFlow).filter(function(l){
				if((nodesToDrawId.indexOf(l.source.id) != -1) && (nodesToDrawId.indexOf(l.target.id) != -1)){
					//存在一些节点的target是undefined
					return true;
				}
				return false;
			});
			for(var i = 0; i < nodesToDrawLastLevelFlow.length;i++){
				nodesToDrawLastLevelFlow[i].y = lastLevelFlowScale(nodesToDrawLastLevelFlow[i].y);
			}
			nodesToDrawFinal = nodesToDrawLastLevelFlow;
		}else if(displayMode == dataCenter.global_variable.display_mode_object.flow){
		}
		var compareLinks = treeSvg.selectAll('.compare-links')
			.data(linksToDrawFinal, function(l){
				return l.target.id;
			});
		//添加连接边
		compareLinks.enter()
		.insert("path")
		.attr("id",function(l){
			return linkIdPrefix + l.target.id;
		})
		.attr("class","compare-links")
		.attr("d",function(d){
			var sourceX = +d.source.filter_change_x;
			var sourceY = d.source.y;
			var targetX = +d.target.filter_change_x;
			var targetY = d.target.y;
			var sourceCx = _cx_handler(sourceX);
			var sourceCy = yScale(sourceY);
			var targetCx = _cx_handler(targetX);
			var targetCy = yScale(targetY);
			var s = {x:sourceCx, y:sourceCy};
			var t = {x:targetCx, y:targetCy};
			return diagonal({source:s,target:t});
		});
		compareLinks.transition()
		.duration(DURATION)
		.attr("d",function(d){
			var sourceX = +d.source.filter_change_x;
			var sourceY = d.source.y;
			var targetX = +d.target.filter_change_x;
			var targetY = d.target.y;
			var sourceCx = _cx_handler(sourceX);
			var sourceCy = yScale(sourceY);
			var targetCx = _cx_handler(targetX);
			var targetCy = yScale(targetY);
			var s = {x:sourceCx, y:sourceCy};
			var t = {x:targetCx, y:targetCy};
			return diagonal({source:s,target:t});
		});
		compareLinks.exit()
		.remove();
		//--------------------------------------------------
		//绘制节点之间的连边之后绘制节点
		//--------------------------------------------------
		var compareNodes = treeSvg.selectAll('.compare-nodes')
		.data(nodesToDrawFinal, function(d,i){
			return d.id;
		});
		//添加节点
		compareNodes.enter()
		.append('circle')
		.attr('class', function(d,i){
			//控制节点的颜色
			var nodeClassArray = ['compare-nodes'];
			var cx = +d.filter_change_x;
			var cy = +d.y;
			var treeId = d.id;
			var childLength = d.allChilldrenCount;
			nodeClassArray.push('blue-node');
			if((d.values == null) && (d.depth != dataCenter.GLOBAL_STATIC.MAX_DEPTH)){
				nodeClassArray.push('shrink-blue-node');
			}
			return self._group_class(nodeClassArray);
		})
		.attr('id', function(d,i){
			return nodeIdPrefix + d.id;
		})
		.attr("cx",function(d){
			var cx = +d.filter_change_x;
			return _cx_handler(cx);
		})
		.attr("cy",function(d){
			var cy = +d.y;
			return yScale(cy);
		})
		.attr('r', function(d,i){
			var nodeRadius = dataCenter.GLOBAL_STATIC.NODE_RADIUS;
			var depth = d.depth;
			return nodeRadius[depth];
		})
		.on('mouseover', function(d,i){
			var this_node = d3.select(this);
			var clickNode = {
				tree_label: dataCenter.global_variable.current_id,
				node: d,
			};
			ObserverManager.post("mouse-over", [d.id]);
			dataCenter.set_global_variable('mouse_over_signal_node', clickNode);
			if(dataCenter.global_variable.enable_tooltip){
				tip.show(d);
			}
		})
		.on('mouseout', function(d,i){
			ObserverManager.post("mouse-out", [d.id]);
			dataCenter.set_global_variable('mouse_over_signal_node', null);
			tip.hide(d);
		})
		.on('click', function(d,i){
			_node_click_shrink(d);
		})
		.each(function(d,i){
			var cx = +d.filter_change_x;
			var cy = +d.y;
			var treeId = d.id;
			if((d.values == null) && (d.depth != dataCenter.global_variable.comparison_view_current_depth)){
				var treeNodeCount = _get_tree_node_number(d, treeIndex);
				_append_blue_triangle(xScale(cx), yScale(cy), treeNodeCount, treeId);
			}else{
				_delete_polygon(treeId);
			}
		});
		//更新节点
		compareNodes.attr("class",function(d){
			//控制节点的颜色
			var nodeClassArray = ['compare-nodes'];
			var cx = +d.filter_change_x;
			var cy = +d.y;
			var treeId = d.id;
			if(d.id == "-root"){
				var sumNum = 0;
				if(d.values!=null){
					for(var i = 0;i < d.values.length;i++){
						sumNum = sumNum + d.values[i].allChilldrenCount;
					}
				}else{
					for(var i = 0;i < d._values.length;i++){
						sumNum = sumNum + d._values[i].allChilldrenCount;
					}
				}
				d.allChilldrenCount = sumNum;
			}
			nodeClassArray.push('blue-node');
			if((d.values == null) && (d.depth != dataCenter.GLOBAL_STATIC.MAX_DEPTH)){
				nodeClassArray.push('shrink-blue-node');
				var childCountNum = d.allChilldrenCount;
			}
			return self._group_class(nodeClassArray);
		})
		.attr("r", function(d,i){
			var nodeRadius = dataCenter.GLOBAL_STATIC.NODE_RADIUS;
			var depth = d.depth;
			return nodeRadius[depth];
		})
		.transition()
		.duration(DURATION)
		.attr("cx",function(d){
			var cx = +d.filter_change_x;
			return _cx_handler(cx);
		})
		.attr("cy",function(d){
			var cy = +d.y;
			return yScale(cy);
		})
		.each(function(d,i){
			var cx = +d.filter_change_x;
			var cy = +d.y;
			var treeId = d.id;
			if((d.values == null) && (d.depth != dataCenter.global_variable.comparison_view_current_depth)){
				var treeNodeCount = _get_tree_node_number(d, treeIndex);
				_append_blue_triangle(xScale(cx), yScale(cy), treeNodeCount, treeId);
			}else{
				_delete_polygon(treeId);
			}
		});
		//删除节点
		compareNodes.exit()
		.each(function(d,i){
			var nodeId = d.id;
			_delete_polygon(nodeId);
		})
		.remove();
		//focusRange与xScale, leftXScale, rightXScale都是全局定义的变量
		function _cx_handler(cx){
			if((cx >= focusRange[0]) && (cx <= focusRange[1])){
				return _x_changer(xScale(cx));
			}else if(cx < focusRange[0]){
				return _x_changer(leftXScale(cx));
			}else if(cx > focusRange[1]){
				return _x_changer(rightXScale(cx));
			}	
		}
		function _get_tree_node_number(d, tree_index){
			var rootNode = d;
			var nodeChildren = null;
			var indexCount = _compute_node_number(rootNode, tree_index, indexCount);
			function _compute_node_number(this_node, tree_index){
				var indexCount = 0;
				indexCount = indexCount + 1;
				var nodeChildren = new Object();
				if((this_node.values != null) && (this_node.values != undefined)){
					nodeChildren = this_node.values;
				}else if((this_node._values != null)&&(this_node._values != undefined)){
					nodeChildren = this_node._values;
				}
				for(var i = 0;i < nodeChildren.length;i++){
					if(nodeChildren[i].has[tree_index]){
						indexCount = indexCount + _compute_node_number(nodeChildren[i], tree_index);
					}
				}
				return indexCount;
			}
			return indexCount;
		}
		function _append_orange_triangle(cx, cy, childLength, node_id){
			var treeSvg = d3.select('#' + treeViewGPrefix + treeName);
			var numScale = d3.scale.linear()
				.domain([0, 1000])
				.range([0, 20]);
			var height = numScale(childLength);
			poly = [{"x":cx, "y":cy},
		        {"x":cx - height/2,"y":(cy + height)},
		        {"x":cx + height/2,"y":(cy + height)},
		        {"x":cx,"y":cy}];
		    treeSvg.selectAll("polygon")
			    .data([poly])
			  	.enter()
			  	.append("polygon")
			    .attr("points",function(d) { 
			        return d.map(function(d) {
			            return [d.x,d.y].join(",");
			        }).join(" ");
			    })
			    .attr("stroke","black")
			    .attr("stroke-width",2);
		}
		function _append_blue_triangle(cx, cy, childLength, node_id){
			var polygonPrefix = self.polygonPrefix;
			var treeSvg = d3.select('#' + treeViewGPrefix + treeName);
			var numScale = d3.scale.linear()
				.domain([0, 1000])
				.range([20, 100]);
			var height = numScale(childLength);
			var translateX = cx - height/2;
			var translateY = cy;
			poly = [{"x":height/2, "y":0},
		        {"x":0,"y":height},
		        {"x":height,"y":height},
		        {"x":height/2,"y":0}];
		    if($('#' + polygonPrefix + node_id).length > 0){
		    	treeSvg.select('#' + polygonPrefix + node_id)
		    		.transition()
		    		.duration(700)
			   		.attr('transform', 'translate(' + translateX + ',' + translateY + ')');
		    }else{
		    	treeSvg.append("polygon")
		    	.attr('transform', 'translate(' + translateX + ',' + translateY + ')')
		    	.transition()
   			 	.delay(750)
		    	.attr("points",function(d) { 
			        return height/2 + ',' + 0 + ' ' + 0 + ',' + height + ' ' + height + ',' + height +' ';
			    })
			    .attr('id', function(d,i){
			    	return polygonPrefix + node_id;
			    })
			    .attr('class', function(d,i){
			    	return 'compare-blue-triangle';
			    });
		    }
		}
		function _delete_polygon(node_id){
			var polygonPrefix = self.polygonPrefix; 
			var treeSvg = d3.select('#' + treeViewGPrefix + treeName);
			treeSvg.select('#' + polygonPrefix + node_id).remove();
		}
		function _x_changer(x){
			var sourceCx = x;
			/*if(x > treeWidth){
				sourceCx = treeWidth - 40;
			}else if(x < 0){
				sourceCx = 40;
			}*/
			return sourceCx;
		}
		//判断两个数组是否相交
		function _intersect(focus_range, node_range_array){
			if((node_range_array[0] >= focus_range[0]) && (node_range_array[0] <= focus_range[1])){
				return true;
			}
			if((node_range_array[1] >= focus_range[0]) && (node_range_array[1] <= focus_range[1])){
				return true;
			}
			if((focus_range[0] >= node_range_array[0]) && (focus_range[0] <= node_range_array[1])){
				return true;
			}
			if((focus_range[1] >= node_range_array[0]) && (focus_range[1] <= node_range_array[1])){
				return true;
			}
			return false;
		}
		function _filter_by_depth(total_nodes){
			var currentDepth = dataCenter.global_variable.comparison_view_current_depth;
			var totalNodes = total_nodes.filter(function(d){
				if(d.depth <= currentDepth){
					return d;
				}
			});
			return totalNodes;
		}
		function _compute_node_range_array(nodes_to_draw){
			//计算最后一层的节点的范围
			for(var j = 0;j < nodes_to_draw.length;j++){
				if(nodes_to_draw[j].depth == (dataCenter.GLOBAL_STATIC.MAX_DEPTH - 1)){
					var xArray = new Array();
					var nodeChildren = nodes_to_draw[j].children;
					if(nodeChildren != undefined){
						for(var k = 0;k < nodeChildren.length;k++){
							//if(nodeChildren[k].has[tree_index]){
								xArray.push(nodeChildren[k].x)
							//}
						}
						if(xArray.length != 0){
							var rangeArray = d3.extent(xArray);
							nodes_to_draw[j].range_array = rangeArray;
						}else{
							var x = nodes_to_draw[j].x;
							nodes_to_draw[j].range_array = [x, x];
						}
					}else{
						var x = nodes_to_draw[j].x;
						nodes_to_draw[j].range_array = [x, x];
					}	
				}
			}
			var minX = d3.min(nodes_to_draw,function(d,i){
				return d.x;
			});
			//计算每一层节点在最后一层节点上面的范围
			for(var i = (dataCenter.GLOBAL_STATIC.MAX_DEPTH - 2);i >= 0;i--){
				for(var j = 0;j < nodes_to_draw.length;j++){
					if(nodes_to_draw[j].depth == i){
						var nodeChildren = nodes_to_draw[j].children;
						//如果node的孩子节点属于当前的的信号树
						if(nodeChildren != undefined){
							var rangeArrayArray = new Array();
							for(var k = 0;k < nodeChildren.length;k++){
								//if(nodeChildren[k].has[tree_index]){
									if(nodeChildren[k].range_array != null){
										rangeArrayArray.push(nodeChildren[k].range_array);
									}
								//}
							}
							var getRangeArray = [];
							if(rangeArrayArray.length != 0){
								getRangeArray = _change_array2_to_range(rangeArrayArray);
							}else{
								var x = nodes_to_draw[j].x;
								getRangeArray = [x, x];
							}	
							nodes_to_draw[j].range_array = getRangeArray;
						}else{
							var x = nodes_to_draw[j].x;
							nodes_to_draw[j].range_array = [x, x];
						}	
					}
				}
			}
			return nodes_to_draw;
		}
		function _filter_according_to_same(nodes_to_draw){
			var currentOperationTreeIndex = get_current_operation_index();
			nodes_to_draw = nodes_to_draw.filter(function(d){
				if(d.has[currentOperationTreeIndex]){
					return true;
				}
			});
			return nodes_to_draw;
		}
		function get_current_operation_index(){
			var selectionObjectArray = dataCenter.global_variable.selection_object_array;
			var currentOperationTreeName = dataCenter.global_variable.current_operation_tree_name;
			for(var i = 0;i < selectionObjectArray.length;i++){
				if(selectionObjectArray[i].tree_name == currentOperationTreeName){
					return selectionObjectArray[i].tree_index;
					break;
				}
			}
		}
		//筛选brush得到的节点
		function _filter_brush_exist_node(nodes_to_draw, focus_range){
			var self = this;
			var focusRange = focus_range;
			for(var i = 0;i < nodes_to_draw.length;i++){
				var nodeRangeArray = nodes_to_draw[i].range_array;
				if(nodeRangeArray != undefined){
					if(_intersect(focusRange, nodeRangeArray)){
						nodes_to_draw[i].is_exist_in_range = true;
					}else{
						nodes_to_draw[i].is_exist_in_range = false;
					}
				}else{
					var x = +nodes_to_draw[i].x;
					if((x >= focusRange[0]) && (x <= focusRange[1])){
						nodes_to_draw[i].is_exist_in_range = true;
					}else{
						nodes_to_draw[i].is_exist_in_range = false;
					}
				}
			}
			return nodes_to_draw;
		}
		//计算在刷选范围内的节点的中心位置
		function _compute_range_node_center_x_to_draw(nodes_to_draw){
			var nodesIdArray = [];
			for(var i = 0;i < nodes_to_draw.length;i++){
				if(nodes_to_draw[i].is_exist_in_range){
					nodesIdArray.push(nodes_to_draw[i].id);
				}
			}
			var maxDepth = dataCenter.GLOBAL_STATIC.MAX_DEPTH;
			for(var i = 0;i < nodes_to_draw.length;i++){
				//if(nodes_to_draw[i].depth == maxDepth){
				nodes_to_draw[i].filter_change_x = nodes_to_draw[i].x;
				//}
			}
			for(var i = (dataCenter.GLOBAL_STATIC.MAX_DEPTH - 1);i >= 0;i--){
				for(var j = 0;j < nodes_to_draw.length;j++){
					if(nodes_to_draw[j].depth == i){
						var nodeChildren = nodes_to_draw[j].children;
						if(nodeChildren != undefined){
							//该层下面仍然存在子节点
							var sumX = 0;
							var innerChildNum = 0;
							for(var k = 0;k < nodeChildren.length;k++){
								if(nodesIdArray.indexOf(nodeChildren[k].id) != -1){
									sumX = sumX + nodeChildren[k].filter_change_x;
									innerChildNum = innerChildNum + 1;
								}
							}
							if(innerChildNum != 0){
								var filterChangeX = sumX / innerChildNum;
								nodes_to_draw[j].filter_change_x = filterChangeX;
							}else{
								nodes_to_draw[j].filter_change_x = nodes_to_draw[j].x;
							}
						}else{
							//如果最后一层是vpi/vci层，下层不存在子节点
							nodes_to_draw[j].filter_change_x = nodes_to_draw[j].x;
						}
					}
				}
			}
			return nodes_to_draw;
		}
		//筛选brush得到的节点
		function _filter_brush_node(nodes_to_draw, focus_range){
			var self = this;
			var focusRange = focus_range;
			var nodes_to_draw = nodes_to_draw.filter(function(d){
				var nodeRangeArray = d.range_array;
				if(nodeRangeArray != undefined){
					if(_intersect(focusRange, nodeRangeArray)){
						return true;
					}else{
						return false;
					}
				}else{
					var x = +d.x;
					if((x >= focusRange[0]) && (x <= focusRange[1])){
						return true;
					}else{
						return false;
					}
				}
			});
			return nodes_to_draw;
		}
		//计算节点的中心的位置
		function _compute_node_center_x_to_draw(nodes_to_draw){
			var nodesIdArray = [];
			for(var i = 0;i < nodes_to_draw.length;i++){
				nodesIdArray.push(nodes_to_draw[i].id);
			}
			var maxDepth = dataCenter.GLOBAL_STATIC.MAX_DEPTH;
			for(var i = 0;i < nodes_to_draw.length;i++){
				if(nodes_to_draw[i].depth == maxDepth){
					nodes_to_draw[i].filter_change_x = nodes_to_draw[i].x;
				}
			}
			for(var i = (dataCenter.GLOBAL_STATIC.MAX_DEPTH - 1);i >= 0;i--){
				for(var j = 0;j < nodes_to_draw.length;j++){
					if(nodes_to_draw[j].depth == i){
						var nodeChildren = nodes_to_draw[j].children;
						if(nodeChildren != undefined){
							//该层下面仍然存在子节点
							var sumX = 0;
							var innerChildNum = 0;
							for(var k = 0;k < nodeChildren.length;k++){
								if(nodesIdArray.indexOf(nodeChildren[k].id) != -1){
									sumX = sumX + nodeChildren[k].filter_change_x;
									innerChildNum = innerChildNum + 1;
								}
							}
							if(innerChildNum != 0){
								var filterChangeX = sumX / innerChildNum;
								nodes_to_draw[j].filter_change_x = filterChangeX;
							}else{
								nodes_to_draw[j].filter_change_x = nodes_to_draw[j].x;
							}
						}else{
							//如果最后一层是vpi/vci层，下层不存在子节点
							nodes_to_draw[j].filter_change_x = nodes_to_draw[j].x;
						}
					}
				}
			}
			return nodes_to_draw;
		}
		//按照是否在该信号树中判断是否需要绘制该节点
		function _filter_according_to_index(nodes_to_draw, tree_index){
			var nodesToDrawFilter = new Array();
			var nodesToDrawFilter = nodes_to_draw.filter(function(d){
				if(d.has == undefined){
					if(d.depth == 0){
						return true;
					}
				}else if(d.has != undefined){
					if(d.has[tree_index]){
						return true
					}
				}
				return false;
			});
			return nodesToDrawFilter;
		}
		//传入的参数是一个数组，每一个数组里面的元素是一个range数组
		function _change_array2_to_range(range_array){
			var rangeAllArray = new Array();
			for(var i = 0;i < range_array.length;i++){
				if(range_array[i] != undefined){
					for(var j = 0;j < range_array[i].length;j++){
						rangeAllArray.push(range_array[i][j]);
					}
				}
			}
			var range = d3.extent(rangeAllArray);
			return range;
		}
		function _node_click_shrink(d){
			var totalRoot = self.totalRoot;
			var tree = self.tree;
			if(dataCenter.global_variable.click_thisNode_shrink){
				if (d.values) {
					d._values = d.values;
					d.values = null;
				} else {
					d.values = d._values;
					d._values = null;
					_delete_polygon(d.id);
				}
			}else{
				var thisNodeID = d.id;
				var thisNodeParent = d.parent;
				if(thisNodeParent != undefined){
					var thisNodeSibling = thisNodeParent.children;
					for(var i = 0;i < thisNodeSibling.length;i++){
						if(thisNodeSibling[i].id != thisNodeID){
							if (thisNodeSibling[i].values) {
								thisNodeSibling[i]._values = thisNodeSibling[i].values;
								thisNodeSibling[i].values = null;
							}else{
								thisNodeSibling[i].values = thisNodeSibling[i]._values;
								thisNodeSibling[i]._values = null;
							}
						}
					}
				}
			}
			var totalNodes = tree.nodes(totalRoot);
			self._render_view(totalNodes);
		}
	},
	draw_last_level: function(total_nodes, tree_info_object){
		var self = this;
		var treeName = tree_info_object.tree_name;
		var treeIdPrefix = self.treeIdPrefix;
		var treeId = treeIdPrefix + treeName;
		var rollingOver = tree_info_object.is_rolling_over;
		var displayMode = tree_info_object.display_mode;
		var treeIndex = tree_info_object.tree_index;
		var nodeIdPrefix = self.nodeIdPrefix;
		var linkIdPrefix = self.linkIdPrefix;
		var nodePadding = 15;
		var DURATION = 750;
		var width = $('#' + treeId + ' #treeview').width();
		var height =  $('#' + treeId + ' #treeview').height();
		var margin = {
			top: 20, right: 10, left: 10, bottom: 0
		};
		var treeWidth = width - margin.left - margin.right;
		var treeHeight = height - margin.top - margin.bottom;
		var tree = self.tree;
		var treeSvg = d3.select('#' + treeId)
			.select('.treeview')
			.select('#treeviewG');
	},
	draw_reverse_trend: function(total_nodes, tree_info_object, current_depth){
		//存在一些节点的target是undefined
		var self = this;
		var focusScaleStart = self.focusScaleStart;
		var focusScaleEnd = self.focusScaleEnd;
		var sqrtScale = d3.scale.sqrt();
		var treeName = tree_info_object.tree_name;
		var rollingOver = tree_info_object.is_rolling_over;
		var displayMode = tree_info_object.display_mode;
		var treeIndex = tree_info_object.tree_index;
		var treeIdPrefix = self.treeIdPrefix;
		var treeId = treeIdPrefix + treeName;
		var nodeIdPrefix = self.nodeIdPrefix;
		var barIdPrefix = self.barIdPrefix;
		var DURATION = 750;
		var focusRange = self.focusRange;
		var histogramDivPrefix = self.histogramDivPrefix;
		var histogramSvgPrefix = self.histogramSvgPrefix;
		var histogramGPrefix = self.histogramGPrefix;
		var operationTreeIndex = get_current_operation_index();
		var leaves = total_nodes.filter(function(d){
			if(dataCenter.global_variable.comparison_show_similiar){
				return (d.depth == current_depth) && (d.has[treeIndex]) && (d.has[operationTreeIndex]);//&& (d.x>=focusRange[0]) && (d.x<=focusRange[1])
			}else{
				return (d.depth == current_depth) && (d.has[treeIndex]);
			}
		});
		var allLeaves = total_nodes.filter(function(d){
			return (d.depth == current_depth);//&& (d.x>=focusRange[0]) && (d.x<=focusRange[1])
		});
		var maxValue = d3.max(allLeaves, function(d,i){
			var value = 0;
			value = d.flow;
			return sqrtScale(value);
		});
		var width = $('#' + histogramDivPrefix + treeName).width();
		var height =  $('#' + histogramDivPrefix + treeName).height();
		var margin = {
			top: 10, right: 10, left: 10, bottom: 0
		};
		var histogramWidth = width - margin.left - margin.right;
		var histogramHeight = height - margin.top - margin.bottom;
		var valueSale = d3.scale.linear()
			.domain([0, maxValue])
			.range([0, histogramHeight]);
		var leftXScale = d3.scale.linear()
			.domain([0, focusRange[0]])
			.range([0, histogramWidth * focusScaleStart]);
		var rightXScale = d3.scale.linear()
			.domain([focusRange[1], 1])
			.range([histogramWidth * focusScaleEnd, histogramWidth]);
		var xScale = d3.scale.linear()
			.domain(focusRange);
		if((focusRange[0] == 0) && (focusRange[1] == 1)){
			xScale.range([0, histogramWidth]);
		}else{
			xScale.range([histogramWidth * focusScaleStart, histogramWidth * focusScaleEnd]);
		}
		var histogramSvg = d3.select('#' + histogramGPrefix + treeName)
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')'); 
		var histogramBar = histogramSvg.selectAll('.compare-bar')
		.data(leaves, function(d,i){
			return d.id;
		});
		histogramBar.exit()
		.remove();
		histogramBar.enter()
		.append('rect')
		.attr('class', function(d,i){
			var nodeClassArray = ['compare-bar'];
			if(rollingOver){
				nodeClassArray.push('orange-bar')
			}else{
				nodeClassArray.push('blue-bar')
			}
			return self._group_class(nodeClassArray);
		})
		.attr('id', function(d,i){
			var barIdName = d.id;
			var barId = barIdPrefix + barIdName;
			return barId;
		})
		.attr('x', function(d,i){
			var cx = +d.x;
			return _cx_handler(cx);
		})
		.attr('y', function(d,i){
			var value = +d.flow;
			if(!isNaN(value)){
				return histogramHeight - valueSale(Math.sqrt(value));
			}else{
				return histogramHeight;
			}
		})
		.attr('width', 2)
		.attr('height', function(d,i){
			var value = +d.flow;
			if(!isNaN(value)){
				return valueSale(Math.sqrt(value));
			}else{
				return 0;
			}
		});
		histogramBar.transition()
		.duration(DURATION)
		.attr('class', function(d,i){
			var nodeClassArray = ['compare-bar'];
			if(rollingOver){
				nodeClassArray.push('orange-bar')
			}else{
				nodeClassArray.push('blue-bar')
			}
			return self._group_class(nodeClassArray);
		})
		.attr('id', function(d,i){
			var barIdName = d.id;
			var barId = barIdPrefix + barIdName;
			return barId;
		})
		.attr('x', function(d,i){
			var cx = +d.x;
			return _cx_handler(cx);
		})
		.attr('y', function(d,i){
			var value = +d.flow;
			if(!isNaN(value)){
				return histogramHeight - valueSale(Math.sqrt(value));
			}else{
				return histogramHeight;
			}
		})
		.attr('width', 2)
		.attr('height', function(d,i){
			var value = +d.flow;
			if(!isNaN(value)){
				return valueSale(sqrtScale(value));
			}else{
				return 0;
			}	
		});
		//focusRange与xScale, leftXScale, rightXScale都是全局定义的变量
		function _cx_handler(cx){
			var focusRange = self.focusRange;
			if((cx >= focusRange[0]) && (cx <= focusRange[1])){
				return xScale(cx);
			}else if(cx < focusRange[0]){
				return leftXScale(cx);
			}else if(cx > focusRange[1]){
				return rightXScale(cx);
			}	
		}
		function get_current_operation_index(){
			var selectionObjectArray = dataCenter.global_variable.selection_object_array;
			var currentOperationTreeName = dataCenter.global_variable.current_operation_tree_name;
			for(var i = 0;i < selectionObjectArray.length;i++){
				if(selectionObjectArray[i].tree_name == currentOperationTreeName){
					return selectionObjectArray[i].tree_index;
					break;
				}
			}
		}
	},
	draw_reverse_tree: function(total_nodes, tree_info_object){
		var self = this;
		var focusScaleStart = self.focusScaleStart;
		var focusScaleEnd = self.focusScaleEnd;
		var treeName = tree_info_object.tree_name;
		var treeIdPrefix = self.treeIdPrefix;
		var treeId = treeIdPrefix + treeName;
		var rollingOver = tree_info_object.is_rolling_over;
		var displayMode = tree_info_object.display_mode;
		var treeIndex = tree_info_object.tree_index;
		var nodeIdPrefix = self.nodeIdPrefix;
		var linkIdPrefix = self.linkIdPrefix;
		var nodePadding = 15;
		var DURATION = 750;
		var maxDepth = dataCenter.GLOBAL_STATIC.MAX_DEPTH;
		var treeViewIdPrefix = self.treeViewIdPrefix;
		var treeViewGPrefix = self.treeViewGPrefix;
		var treeViewSvgPrefix = self.treeViewSvgPrefix;
		var width = $('#' + treeViewIdPrefix + treeName).width();
		var height =  $('#' + treeViewIdPrefix + treeName).height();
		var margin = {
			top: 6, right: 10, left: 10, bottom: 20
		}
		var treeWidth = width - margin.left - margin.right;
		var treeHeight = height - margin.top - margin.bottom;
		var tree = self.tree;
		var focusRange = self.focusRange;
		var leftXScale = d3.scale.linear()
			.domain([0, focusRange[0]])
			.range([0, treeWidth * focusScaleStart]);
		var rightXScale = d3.scale.linear()
			.domain([focusRange[1], 1])
			.range([treeWidth * focusScaleEnd, treeWidth]);
		var xScale = d3.scale.linear()
			.domain(focusRange);
		if((focusRange[0] == 0) && (focusRange[1] == 1)){
			xScale.range([0, treeWidth]);
		}else{
			xScale.range([treeWidth * focusScaleStart, treeWidth * focusScaleEnd]);
		}
		var yScale = d3.scale.linear()
			.domain([0, 0.25 * dataCenter.global_variable.comparison_view_current_depth])
			.range([treeHeight, 0]);
		var treeSvg = d3.select('#' + treeViewGPrefix + treeName)
			.attr('transform', 'translate(' + margin.left + ',' + margin.top +')'); 
		var tip = self.tip;
		//筛选的顺序是每次将brush的全部节点计算得到，包括上层节点
		//计算节点的坐标位置
		//对于节点按照树的标号进行筛选
		//对于不同信号树的绘制方式，再次进行筛选，得到需要进行绘制的部分，比如说只有流量层，或者最后一层节点
		var nodesTodraw = new Array();
		total_nodes = _filter_by_depth(total_nodes);
		nodesToDraw = _compute_node_range_array(total_nodes);
		var nodesToDrawAddExistInRange = _filter_brush_exist_node(nodesToDraw, focusRange);
		var nodesTodrawAddCenter = _compute_range_node_center_x_to_draw(nodesToDrawAddExistInRange);
		if(dataCenter.global_variable.comparison_show_similiar){
			nodesTodrawAddCenter = _filter_according_to_same(nodesTodrawAddCenter);
		}
		var nodesToDrawFilter = _filter_according_to_index(nodesTodrawAddCenter, treeIndex);
		var diagonal = d3.svg.diagonal();
		//--------------------------------------------------
		//绘制节点之间的连边
		//--------------------------------------------------
		//选择要绘制的节点连接边
		var linksToDrawFinal = new Array();
		var nodesToDrawFinal = new Array();

		if(displayMode == dataCenter.global_variable.display_mode_object.whole_tree){
			//nodesTodraw = _compute_node_center_x_to_draw(nodesToDraw);
			//计算包含所有节点ID的数组
			var nodesToDrawId = new Array();
			for(var i = 0;i < nodesToDrawFilter.length;i++){
				nodesToDrawId.push(nodesToDrawFilter[i].id);
			}
			//保留的target节点和source节点都是存在的
			linksToDrawFinal = tree.links(nodesToDrawFilter).filter(function(l){
				//存在一些节点的target是undefined
				if((nodesToDrawId.indexOf(l.source.id) != -1) && (nodesToDrawId.indexOf(l.target.id) != -1)){
					return true;
				}
				return false;
			});
			for(var i = 0; i < nodesToDrawFilter.length;i++){
				nodesToDrawFilter[i].y = nodesToDrawFilter[i].depth * 0.25;
			}
			nodesToDrawFinal = nodesToDrawFilter;
		}else if(displayMode == dataCenter.global_variable.display_mode_object.last_level_flow){
			var lastLevelFlowScale = d3.scale.linear()
				.domain([0.75, 1])
				.range([0, 1]);
			nodesToDrawLastLevelFlow = nodesToDrawFilter.filter(function(d){
				if(d.depth >= (maxDepth - 1)){
					return true;
				}
				return false;
			});
			//nodesTodraw = _compute_node_center_x_to_draw(nodesToDraw);
			//将计算错误的节点恢复到正确的y坐标上
			for(var i = 0;i < nodesToDraw.length;i++){
				var y = nodesToDraw[i].y;
				var depth = nodesToDraw[i].depth;
				if((y < 0.75) || (y > 1)){
					if(depth == 3){
						nodesToDraw[i].y = 0.75;
					}
				}
			}
			//计算包含所有节点ID的数组
			var nodesToDrawId = new Array();
			for(var i = 0;i < nodesToDrawLastLevelFlow.length;i++){
				nodesToDrawId.push(nodesToDrawLastLevelFlow[i].id);
			}
			linksToDrawFinal = tree.links(nodesToDrawLastLevelFlow).filter(function(l){
				if((nodesToDrawId.indexOf(l.source.id) != -1) && (nodesToDrawId.indexOf(l.target.id) != -1)){
					//存在一些节点的target是undefined
					return true;
				}
				return false;
			});
			for(var i = 0; i < nodesToDrawLastLevelFlow.length;i++){
				nodesToDrawLastLevelFlow[i].y = lastLevelFlowScale(nodesToDrawLastLevelFlow[i].y);
			}
			nodesToDrawFinal = nodesToDrawLastLevelFlow;
		}else if(displayMode == dataCenter.global_variable.display_mode_object.flow){
		}
		var compareLinks = treeSvg.selectAll('.compare-links')
			.data(linksToDrawFinal, function(l){
				return l.target.id;
			});
		//添加连接边
		compareLinks.enter()
		.insert("path")
		.attr("id",function(l){
			return linkIdPrefix + l.target.id;
		})
		.attr("class","compare-links")
		.attr("d",function(d){
			var sourceX = +d.source.filter_change_x;
			var sourceY = 1 - d.source.y;
			var targetX = +d.target.filter_change_x;
			var targetY = 1 - d.target.y;
			var sourceCx = _cx_handler(+sourceX);
			var sourceCy = yScale(sourceY);
			var targetCx = _cx_handler(+targetX);
			var targetCy = yScale(targetY);
			var s = {x:sourceCx, y:sourceCy};
			var t = {x:targetCx, y:targetCy};
			return diagonal({source:s,target:t});
		});
		compareLinks.transition()
		.duration(DURATION)
		.attr("d",function(d){
			var sourceX = +d.source.filter_change_x;
			var sourceY = d.source.y;
			var targetX = +d.target.filter_change_x;
			var targetY = d.target.y;
			var sourceCx = _cx_handler(+sourceX);
			var sourceCy = yScale(sourceY);
			var targetCx = _cx_handler(+targetX);
			var targetCy = yScale(targetY);
			var s = {x:sourceCx, y:sourceCy};
			var t = {x:targetCx, y:targetCy};
			return diagonal({source:s,target:t});
		});
		compareLinks.exit()
		//.transition().duration(750)
		.remove();
		//--------------------------------------------------
		//绘制节点之间的连边之后绘制节点
		//--------------------------------------------------
		var compareNodes = treeSvg.selectAll('.compare-nodes')
		.data(nodesToDrawFinal, function(d,i){
			return d.id;
		});
		//添加节点
		compareNodes.enter()
		.append('circle')
		.attr('class', function(d,i){
			//控制节点的颜色
			var nodeClassArray = ['compare-nodes'];
			if(rollingOver){
				nodeClassArray.push('orange-node');
				if(d.values == null){
					nodeClassArray.push('shrink-orange-node');
				}
			}else{
				nodeClassArray.push('blue-node');
				if(d.values == null){
					nodeClassArray.push('shrink-blue-node');
				}
			}
			return self._group_class(nodeClassArray);
		})
		.attr('id', function(d,i){
			return nodeIdPrefix + d.id;
		})
		.attr("cx",function(d){
			var cx = +d.filter_change_x;
			return _cx_handler(cx);
		})
		.attr("cy",function(d){
			var cy = +d.y;
			return yScale(cy);
		})
		.attr('r', function(d,i){
			var nodeRadius = dataCenter.GLOBAL_STATIC.NODE_RADIUS;
			var depth = d.depth;
			return nodeRadius[depth];
		})
		.on('mouseover', function(d,i){
			var this_node = d3.select(this);
			var clickNode = {
				tree_label: dataCenter.global_variable.current_id,
				node: d,
			};
			ObserverManager.post("mouse-over", [d.id]);
			dataCenter.set_global_variable('mouse_over_signal_node', clickNode);
			if(dataCenter.global_variable.enable_tooltip){
				tip.show(d);
			}
		})
		.on('mouseout', function(d,i){
			ObserverManager.post("mouse-out", [d.id]);
			dataCenter.set_global_variable('mouse_over_signal_node', null);
			tip.hide(d);
		})
		.on('click', function(d,i){
			_node_click_shrink(d);
		})
		.each(function(d,i){
			var cx = +d.filter_change_x;
			var cy = +d.y;
			var treeId = d.id;
			if((d.values == null) &&
				 (d.depth != dataCenter.global_variable.comparison_view_current_depth)){
				var treeNodeCount = _get_tree_node_number(d, treeIndex);
				_append_orange_triangle(xScale(cx), yScale(cy), treeNodeCount, treeId);
			}else{
				_delete_polygon(treeId);
			}
		});
		//更新节点
		compareNodes.attr("class",function(d){
			//控制节点的颜色
			var nodeClassArray = ['compare-nodes'];
			if(rollingOver){
				nodeClassArray.push('orange-node');
				if(d.values == null){
					nodeClassArray.push('shrink-orange-node');
				}
			}else{
				nodeClassArray.push('blue-node');
				if(d.values == null){
					nodeClassArray.push('shrink-blue-node');
				}
			}
			return self._group_class(nodeClassArray);
		})
		.attr("r", function(d,i){
			var nodeRadius = dataCenter.GLOBAL_STATIC.NODE_RADIUS;
			var depth = d.depth;
			return nodeRadius[depth];
		})
		.transition()
		.duration(DURATION)
		.attr("cx",function(d){
			var cx = +d.filter_change_x;
			return _cx_handler(cx);
		})
		.attr("cy",function(d){
			var cy = +d.y;
			return yScale(cy);
		})
		.each(function(d,i){
			var cx = +d.filter_change_x;
			var cy = +d.y;
			var treeId = d.id;
			if((d.values == null) && 
				(d.depth != dataCenter.global_variable.comparison_view_current_depth)){
				var treeNodeCount = _get_tree_node_number(d, treeIndex);
				_append_orange_triangle(xScale(cx), yScale(cy), treeNodeCount, treeId);
			}else{
				_delete_polygon(treeId);
			}
		});
		//删除节点
		compareNodes.exit()
		.each(function(d,i){
			var nodeId = d.id;
			_delete_polygon(nodeId);
		})
		.remove();
		function _cx_handler(cx){
			if((cx >= focusRange[0]) && (cx <= focusRange[1])){
				return _x_changer(xScale(cx));
			}else if(cx < focusRange[0]){
				return _x_changer(leftXScale(cx));
			}else if(cx > focusRange[1]){
				return _x_changer(rightXScale(cx));
			}	
		}
		function _x_changer(x){
			var sourceCx = x;
			//if(x > treeWidth){
			//	sourceCx = treeWidth - 40;
			//}else if(x < 0){
			//	sourceCx = 40;
			//}
			return sourceCx;
		}
		function _get_tree_node_number(d, tree_index){
			var rootNode = d;
			var nodeChildren = null;
			var indexCount = _compute_node_number(rootNode, tree_index, indexCount);
			function _compute_node_number(this_node, tree_index){
				var indexCount = 0;
				indexCount = indexCount + 1;
				var nodeChildren = new Object();
				if((this_node.values != null) && (this_node.values != undefined)){
					nodeChildren = this_node.values;
				}else if((this_node._values != null)&&(this_node._values != undefined)){
					nodeChildren = this_node._values;
				}
				for(var i = 0;i < nodeChildren.length;i++){
					if(nodeChildren[i].has[tree_index]){
						indexCount = indexCount + _compute_node_number(nodeChildren[i], tree_index);
					}
				}
				return indexCount;
			}
			return indexCount;
		}
		//判断两个数组是否相交
		function _intersect(focus_range, node_range_array){
			if((node_range_array[0] >= focus_range[0]) && (node_range_array[0] <= focus_range[1])){
				return true;
			}
			if((node_range_array[1] >= focus_range[0]) && (node_range_array[1] <= focus_range[1])){
				return true;
			}
			if((focus_range[0] >= node_range_array[0]) && (focus_range[0] <= node_range_array[1])){
				return true;
			}
			if((focus_range[1] >= node_range_array[0]) && (focus_range[1] <= node_range_array[1])){
				return true;
			}
			return false;
		}
		function _filter_by_depth(total_nodes){
			var currentDepth = dataCenter.global_variable.comparison_view_current_depth;
			var totalNodes = total_nodes.filter(function(d){
				if(d.depth <= currentDepth){
					return d;
				}
			});
			return totalNodes;
		}
		function _filter_according_to_same(nodes_to_draw){
			var currentOperationTreeIndex = get_current_operation_index();
			nodes_to_draw = nodes_to_draw.filter(function(d){
				if(d.has[currentOperationTreeIndex]){
					return true;
				}
			});
			return nodes_to_draw;
		}
		function get_current_operation_index(){
			var selectionObjectArray = dataCenter.global_variable.selection_object_array;
			var currentOperationTreeName = dataCenter.global_variable.current_operation_tree_name;
			for(var i = 0;i < selectionObjectArray.length;i++){
				if(selectionObjectArray[i].tree_name == currentOperationTreeName){
					return selectionObjectArray[i].tree_index;
					break;
				}
			}
		}
		function _compute_node_range_array(nodes_to_draw){
			//计算最后一层的节点的范围
			for(var j = 0;j < nodes_to_draw.length;j++){
				if(nodes_to_draw[j].depth == (dataCenter.GLOBAL_STATIC.MAX_DEPTH - 1)){
					var xArray = new Array();
					var nodeChildren = nodes_to_draw[j].children;
					if(nodeChildren != undefined){
						for(var k = 0;k < nodeChildren.length;k++){
							//if(nodeChildren[k].has[tree_index]){
								xArray.push(nodeChildren[k].x)
							//}
						}
						if(xArray.length != 0){
							var rangeArray = d3.extent(xArray);
							nodes_to_draw[j].range_array = rangeArray;
						}else{
							var x = nodes_to_draw[j].x;
							nodes_to_draw[j].range_array = [x, x];
						}
					}else{
						var x = nodes_to_draw[j].x;
						nodes_to_draw[j].range_array = [x, x];
					}	
				}
			}
			var minX = d3.min(nodes_to_draw,function(d,i){
				return d.x;
			});
			//计算每一层节点在最后一层节点上面的范围
			for(var i = (dataCenter.GLOBAL_STATIC.MAX_DEPTH - 2);i >= 0;i--){
				for(var j = 0;j < nodes_to_draw.length;j++){
					if(nodes_to_draw[j].depth == i){
						var nodeChildren = nodes_to_draw[j].children;
						//如果node的孩子节点属于当前的的信号树
						if(nodeChildren != undefined){
							var rangeArrayArray = new Array();
							for(var k = 0;k < nodeChildren.length;k++){
								//if(nodeChildren[k].has[tree_index]){
									if(nodeChildren[k].range_array != null){
										rangeArrayArray.push(nodeChildren[k].range_array);
									}
								//}
							}
							var getRangeArray = [];
							if(rangeArrayArray.length != 0){
								getRangeArray = _change_array2_to_range(rangeArrayArray);
							}else{
								var x = nodes_to_draw[j].x;
								getRangeArray = [x, x];
							}	
							nodes_to_draw[j].range_array = getRangeArray;
						}else{
							var x = nodes_to_draw[j].x;
							nodes_to_draw[j].range_array = [x, x];
						}	
					}
				}
			}
			return nodes_to_draw;
		}
		//筛选brush得到的节点
		function _filter_brush_node(nodes_to_draw, focus_range){
			var self = this;
			var focusRange = focus_range;
			var nodes_to_draw = nodes_to_draw.filter(function(d){
				var nodeRangeArray = d.range_array;
				if(nodeRangeArray != undefined){
					if(_intersect(focusRange, nodeRangeArray)){
						return true;
					}else{
						return false;
					}
				}else{
					var x = +d.x;
					if((x >= focusRange[0]) && (x <= focusRange[1])){
						return true;
					}else{
						return false;
					}
				}
			});
			return nodes_to_draw;
		}
		//筛选brush得到的节点
		function _filter_brush_exist_node(nodes_to_draw, focus_range){
			var self = this;
			var focusRange = focus_range;
			for(var i = 0;i < nodes_to_draw.length;i++){
				var nodeRangeArray = nodes_to_draw[i].range_array;
				if(nodeRangeArray != undefined){
					if(_intersect(focusRange, nodeRangeArray)){
						nodes_to_draw[i].is_exist_in_range = true;
					}else{
						nodes_to_draw[i].is_exist_in_range = false;
					}
				}else{
					var x = +nodes_to_draw[i].x;
					if((x >= focusRange[0]) && (x <= focusRange[1])){
						nodes_to_draw[i].is_exist_in_range = true;
					}else{
						nodes_to_draw[i].is_exist_in_range = false;
					}
				}
			}
			return nodes_to_draw;
		}
		//计算在刷选范围内的节点的中心位置
		function _compute_range_node_center_x_to_draw(nodes_to_draw){
			var nodesIdArray = [];
			for(var i = 0;i < nodes_to_draw.length;i++){
				if(nodes_to_draw[i].is_exist_in_range){
					nodesIdArray.push(nodes_to_draw[i].id);
				}
			}
			var maxDepth = dataCenter.GLOBAL_STATIC.MAX_DEPTH;
			for(var i = 0;i < nodes_to_draw.length;i++){
				//if(nodes_to_draw[i].depth == maxDepth){
				nodes_to_draw[i].filter_change_x = nodes_to_draw[i].x;
				//}
			}
			for(var i = (dataCenter.GLOBAL_STATIC.MAX_DEPTH - 1);i >= 0;i--){
				for(var j = 0;j < nodes_to_draw.length;j++){
					if(nodes_to_draw[j].depth == i){
						var nodeChildren = nodes_to_draw[j].children;
						if(nodeChildren != undefined){
							//该层下面仍然存在子节点
							var sumX = 0;
							var innerChildNum = 0;
							for(var k = 0;k < nodeChildren.length;k++){
								if(nodesIdArray.indexOf(nodeChildren[k].id) != -1){
									sumX = sumX + nodeChildren[k].filter_change_x;
									innerChildNum = innerChildNum + 1;
								}
							}
							if(innerChildNum != 0){
								var filterChangeX = sumX / innerChildNum;
								nodes_to_draw[j].filter_change_x = filterChangeX;
							}else{
								nodes_to_draw[j].filter_change_x = nodes_to_draw[j].x;
							}
						}else{
							//如果最后一层是vpi/vci层，下层不存在子节点
							nodes_to_draw[j].filter_change_x = nodes_to_draw[j].x;
						}
					}
				}
			}
			return nodes_to_draw;
		}
		//按照是否在该信号树中判断是否需要绘制该节点
		function _filter_according_to_index(nodes_to_draw, tree_index){
			var nodesToDrawFilter = new Array();
			var nodesToDrawFilter = nodes_to_draw.filter(function(d){
				if(d.has == undefined){
					if(d.depth == 0){
						return true;
					}
				}else if(d.has != undefined){
					if(d.has[tree_index]){
						return true
					}
				}
				return false;
			});
			return nodesToDrawFilter;
		}
		//计算节点的中心的位置
		function _compute_node_center_x_to_draw(nodes_to_draw){
			var nodesIdArray = [];
			for(var i = 0;i < nodes_to_draw.length;i++){
				nodesIdArray.push(nodes_to_draw[i].id);
			}
			var maxDepth = dataCenter.GLOBAL_STATIC.MAX_DEPTH;
			for(var i = 0;i < nodes_to_draw.length;i++){
				if(nodes_to_draw[i].depth == maxDepth){
					nodes_to_draw[i].filter_change_x = nodes_to_draw[i].x;
				}
			}
			for(var i = (dataCenter.GLOBAL_STATIC.MAX_DEPTH - 1);i >= 0;i--){
				for(var j = 0;j < nodes_to_draw.length;j++){
					if(nodes_to_draw[j].depth == i){
						var nodeChildren = nodes_to_draw[j].children;
						if(nodeChildren != undefined){
							//该层下面仍然存在子节点
							var sumX = 0;
							var innerChildNum = 0;
							for(var k = 0;k < nodeChildren.length;k++){
								if(nodesIdArray.indexOf(nodeChildren[k].id) != -1){
									sumX = sumX + nodeChildren[k].filter_change_x;
									innerChildNum = innerChildNum + 1;
								}
							}
							if(innerChildNum != 0){
								var filterChangeX = sumX / innerChildNum;
								nodes_to_draw[j].filter_change_x = filterChangeX;
							}else{
								nodes_to_draw[j].filter_change_x = nodes_to_draw[j].x;
							}
						}else{
							//如果最后一层是vpi/vci层，下层不存在子节点
							nodes_to_draw[j].filter_change_x = nodes_to_draw[j].x;
						}
					}
				}
			}
			return nodes_to_draw;
		}
		//传入的参数是一个数组，每一个数组里面的元素是一个range数组
		function _change_array2_to_range(range_array){
			var rangeAllArray = new Array();
			for(var i = 0;i < range_array.length;i++){
				if(range_array[i] != undefined){
					for(var j = 0;j < range_array[i].length;j++){
						rangeAllArray.push(range_array[i][j]);
					}
				}
			}
			var range = d3.extent(rangeAllArray);
			return range;
		}
		function _node_click_shrink(d){
			if(dataCenter.global_variable.click_thisNode_shrink){
				if (d.values) {
					d._values = d.values;
					d.values = null;
				} else {
					d.values = d._values;
					d._values = null;
					_delete_polygon(d.id);
				}
			}else{
				var thisNodeID = d.id;
				var thisNodeParent = d.parent;
				if(thisNodeParent != undefined){
					var thisNodeSibling = thisNodeParent.children;
					for(var i = 0;i < thisNodeSibling.length;i++){
						if(thisNodeSibling[i].id != thisNodeID){
							if (thisNodeSibling[i].values) {
								thisNodeSibling[i]._values = thisNodeSibling[i].values;
								thisNodeSibling[i].values = null;
							}else{
								thisNodeSibling[i].values = thisNodeSibling[i]._values;
								thisNodeSibling[i]._values = null;
							}
						}
					}
				}
			}
			var tree = self.tree;
			var totalNodes = tree.nodes(totalRoot);
			self._render_view(totalNodes);
		}
		function _append_orange_triangle(cx, cy, childLength, node_id){
			var polygonPrefix = self.polygonPrefix;
			var treeSvg = d3.select('#' + treeViewGPrefix + treeName);
			var numScale = d3.scale.linear()
				.domain([0, 1000])
				.range([20, 100]);
			var height = numScale(childLength);
			var translateX = cx - height/2;
			var translateY = cy;
			poly = [{"x":height/2, "y":0},
		        {"x":0,"y":height},
		        {"x":height,"y":height},
		        {"x":height/2,"y":0}];
		    if($('#' + polygonPrefix + node_id).length > 0){
		    	treeSvg.select('#' + polygonPrefix + node_id)
		    		.transition()
		    		.duration(700)
			   		.attr('transform', 'translate(' + translateX + ',' + translateY + ')');
		    }else{
		    	treeSvg.append("polygon")
		    	.attr('transform', 'translate(' + translateX + ',' + translateY + ')')
		    	.transition()
   			 	.delay(750)
		    	.attr("points", function(d) {
			        return height/2 + ',' + 0 + ' ' + 0 + ',' + (-height) + ' ' + height + ',' + (-height) +' ';
			    })
			    .attr('id', function(d,i){
			    	return polygonPrefix + node_id;
			    })
			    .attr('class', function(d,i){
			    	return 'compare-orange-triangle';
			    });
		    }
		}
		function _delete_polygon(node_id){
			var polygonPrefix = self.polygonPrefix; 
			var treeSvg = d3.select('#' + treeViewGPrefix + treeName);
			treeSvg.select('#' + polygonPrefix + node_id).remove();
		}
	},
	add_mouseover_handler: function(){
		$('.comparison-signaltree-div').mouseover(function(d,i){
			var treeId = $(this).attr('id').replace('tree-div-','');
			ObserverManager.post('mouseover-signal-tree', treeId);
		});
	},
	add_mouseout_handler: function(){
		$('.comparison-signaltree-div').mouseout(function(d,i){
			ObserverManager.post('mouseout-signal-tree');
		});	
	},
	add_click_handler: function(){
		$('.comparison-signaltree-div').click(function(d,i){
			var treeId = $(this).attr('id').replace('tree-div-','');
			ObserverManager.post('compare-click-signal-tree', treeId);
		});	
	},
	//将需要的class组合在一起的到元素的class
	_group_class: function(class_name_array){
	 	var className = class_name_array[0];
	 	for(var i = 1;i < class_name_array.length;i++){
	 		className = className + ' ' + class_name_array[i];
	 	}
	 	return className;
	},
	_highlight_subtree_and_route_from_root: function(id, tree_index) {
		var self = this;
		var nodeIdPrefix = self.nodeIdPrefix;
		var linkIdPrefix = self.linkIdPrefix;
		var barIdPrefix = self.barIdPrefix;
		var treeIdPrefix = self.treeIdPrefix;
		var treeViewGPrefix = self.treeViewGPrefix;
		var histogramGPrefix = self.histogramGPrefix;
		var currentMouseoverSignalTree = dataCenter.global_variable.current_mouseover_signaltree;
		var svgTree = d3.select('#' + treeViewGPrefix + currentMouseoverSignalTree);
		var svgHistogram = d3.select('#' + histogramGPrefix + currentMouseoverSignalTree);
		var highlight_id_list = [];
		var treeNodeList = self.totalNodes;
		var node, node1;
		for(var i = 0; i < treeNodeList.length; i++){
			if(treeNodeList[i].id == id){
				node = treeNodeList[i];
				break;
			}
		}
		node1 = node;
		if(node == undefined) return;
		while(node.parent != undefined){
			var tmpid = node.parent.id.replace(';','');
				highlight_id_list.push(tmpid);
			node = node.parent;
		}
		node = node1;
		_put_subtree_node_id(node, highlight_id_list, tree_index);
		for(var i = 0; i < highlight_id_list.length; i++){
			if(highlight_id_list[i] == id) continue;
			svgTree.select("#" + nodeIdPrefix + highlight_id_list[i])
				.classed("compare-route-node-inner",true);
			svgTree.select("#" + linkIdPrefix + highlight_id_list[i])
				.classed("compare-route-link",true);
			svgHistogram.select('#' + barIdPrefix + highlight_id_list[i])
				.classed('compare-route-bar-inner', true);
		}
		svgTree.select("#" + linkIdPrefix + id).classed("compare-route-link",true);
		highlight_id_list.push(id);
		dataCenter.set_global_variable('radial_highlight_id_list', highlight_id_list);
		//仅在highlight_subtree_root中调用
		function _put_subtree_node_id(node,list,index){
			if(node.children == undefined) return;
			for(var i = 0; i < node.children.length; i++){
				if(node.children[i].has[index]){
					var tmpid = node.children[i].id.replace(';','');
					list.push(node.children[i].id);
				}
				_put_subtree_node_id(node.children[i],list,index);
			}
		}	
	},
	//取消highlight
	unhighlight_subtree_root: function(){
		d3.selectAll('.compare-nodes')
			.classed('compare-route-node-inner', false);
		d3.selectAll('.compare-route-link')
			.classed('compare-route-link', false);
		d3.selectAll('.compare-bar')
			.classed('compare-route-bar-inner', false);
	},
	_draw_current_hover: function(){
		var self = this;
		var treeName = dataCenter.global_variable.hover_tree_name;
		var treeIdPrefix = self.treeIdPrefix;
		var treeId = treeIdPrefix + treeName;
		$('.comparison-signaltree-div').removeClass('mouseover-border-highlight');
		$('#' + treeId).addClass('mouseover-border-highlight');
	},
	_draw_current_operation: function(){
		var self = this;
		var treeIdPrefix = self.treeIdPrefix;
		var treeViewIdPrefix = self.treeViewIdPrefix;
		var treeViewGPrefix = self.treeViewSvgPrefix;
		var histogramGPrefix = self.histogramSvgPrefix;
		var currentOperationTreeName = dataCenter.global_variable.current_operation_tree_name;
		var selectionObjectArray = dataCenter.global_variable.selection_object_array;
		var currentOperationRollingOver = false;
		for(var i = 0;i < selectionObjectArray.length;i++){
			if(selectionObjectArray[i].tree_name == currentOperationTreeName){
				currentOperationRollingOver = selectionObjectArray[i].is_rolling_over;
			}
		}
		var svg = null;
		var treeViewHeight = $(('#' + treeViewIdPrefix + currentOperationTreeName + ' #treeview')).height();
		if(treeViewHeight == 0){
			svg = d3.select('#' + histogramGPrefix + currentOperationTreeName);
		}else{
			if(currentOperationRollingOver){
				svg = d3.select('#' + histogramGPrefix + currentOperationTreeName);
			}else{
				svg = d3.select('#' + treeViewGPrefix + currentOperationTreeName);
			}
		}
		d3.selectAll('.compare-current-operation-circle').remove();
		svg.append('circle')
		.attr('class', 'compare-current-operation-circle')
		.attr('cx', 5)
		.attr('cy', 14);
	},
	_remove_current_hover: function(){
		$('.comparison-signaltree-div').removeClass('mouseover-border-highlight');
	},
	//OMListen监听信号，在comparison视图中作出响应
	OMListen: function(message, data){
		var self = this;
		var nodeIdPrefix = self.nodeIdPrefix; 
		var treeIdPrefix = self.treeIdPrefix;
		var currentOperationTreeName = dataCenter.global_variable.current_operation_tree_name;
		var currentMouseoverSignalTree = dataCenter.global_variable.current_mouseover_signaltree;
		var selectionObjectArray = dataCenter.global_variable.selection_object_array;
		var treeViewGPrefix = self.treeViewGPrefix;
		var svg = d3.select('#' + treeViewGPrefix + currentMouseoverSignalTree);
		var treeIndex = 0;
		if (message == "highlight") {
			_tree_node_highlight_handler(currentOperationTreeName, data);
			_histogram_highlight_handler(currentOperationTreeName, data);
		}
		if(message == "mouse-over"){
			_mouse_over_handler(currentMouseoverSignalTree, selectionObjectArray, data);
        }
        if(message == "mouse-out"){
        	_mouse_out_handler(currentMouseoverSignalTree);
        }
        if(message == "draw-current-selection"){
        	self._compute_all_nodes_and_render();
        }
        if(message == 'draw-current-hover'){
			self._draw_current_hover(data);
		}
		if(message == 'remove-current-hover'){
			self._remove_current_hover();
		}
		if(message == 'draw-current-operation'){
			if(dataCenter.global_variable.comparison_show_similiar){
				self._compute_all_nodes_and_render();
			}else{
				self._draw_current_operation();
			}
		}
		if(message == 'resize-brush'){
			self.focusRange = [0, 1];
			self._compute_all_nodes_and_render();
		}
		if(message == 'change-depth'){
			dataCenter.global_variable.comparison_view_current_depth = data;
			self._compute_all_nodes_and_render();
		}
		if(message == 'show-all'){
			dataCenter.global_variable.comparison_show_similiar = false;
			self._compute_all_nodes_and_render();
		}
		if(message == 'show-similiar'){
			dataCenter.global_variable.comparison_show_similiar = true;
			self._compute_all_nodes_and_render();
		}
		function _mouse_out_handler(mouseover_tree_name){
			var treeViewGPrefix = self.treeViewGPrefix;
			var svg = d3.select('#' + treeViewGPrefix + mouseover_tree_name);
			self.unhighlight_subtree_root();
			svg.selectAll('.compare-nodes').classed('focus-highlight', false);
		}
		function _mouse_over_handler(mouseover_tree_name, selection_object_array, data){
			var treeViewGPrefix = self.treeViewGPrefix;
			var nodeIdPrefix = self.nodeIdPrefix;
			var svg = d3.select('#' + treeViewGPrefix + mouseover_tree_name);
			svg.selectAll('compare-nodes').classed('focus-highlight', false);
        	for (var i = 0; i < data.length; i++) {
        		if(data[i] != null){
					data[i] = data[i].replace(';','');
				}
				for(var j = 0;j < selection_object_array.length;j++){
					if(selection_object_array[j].tree_name == mouseover_tree_name){
						treeIndex = selectionObjectArray[j].tree_index;
					}
				}
				self._highlight_subtree_and_route_from_root(data[i], treeIndex);
				svg.select('#' + nodeIdPrefix + data[i]).classed("focus-highlight", true);
				if (svg.select(nodeIdPrefix + data[i]).data().length > 0) {
					var nodeData = svg.select(nodeIdPrefix + data[i]).data()[0];
				}
			}
		}
		function _tree_node_highlight_handler(operation_tree_name, data){
			var treeViewGPrefix = self.treeViewGPrefix;
			var nodeIdPrefix = self.nodeIdPrefix; 
			var svg = d3.select('#' + treeViewGPrefix + operation_tree_name);
			svg.selectAll(".compare-nodes").classed("highlight", false)
			svg.selectAll(".compare-nodes").classed("half-highlight", false)
			for (var i = 0; i < data.length; i++) {
				if(data[i] != null){
					data[i] = data[i].replace(';','');
				}
				svg.select('#' + nodeIdPrefix + data[i]).classed("highlight", true);
				svg.select('#' + nodeIdPrefix + data[i]).each(function(d) {
					if (d == null) return;
					var node = d.parent;
					while (node != null) {
						svg.select('#' + nodeIdPrefix + node.id).classed("half-highlight", true);
						node = node.parent;
					}
				})				
			}
		}
		function _histogram_highlight_handler(operation_tree_name, data){
			var histogramGPrefix = self.histogramGPrefix;
			var barIdPrefix = self.barIdPrefix;
			var histogramSvg = d3.select('#' + histogramGPrefix + operation_tree_name);
			histogramSvg.selectAll(".highlight").classed("highlight", false);
			for(var i = 0;i < data.length;i++){
				if(data[i] != null){
					data[i] = data[i].replace(';','');
				}
				histogramSvg.select('#' + barIdPrefix + data[i]).classed("highlight", true);
			}			
		}
	}
}