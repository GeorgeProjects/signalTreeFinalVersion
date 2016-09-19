var radial = {
	name: 'radial',
	nodeIdPrefix: '#node-', 
	treeNodeList: null,
	initialize: function(){
		var self = this;
		self._add_to_listener();
		self._bind_view();
		self._render_view();
		return self;
	},
	_add_to_listener: function(){
		var self = this;
		ObserverManager.addListener(self);
	},
	_bind_view: function(){
	},
	_render_view: function(){
		var self = this;
		var selectionObjectArray = dataCenter.global_variable.selection_object_array;
		var currentOperationTreeName = dataCenter.global_variable.current_operation_tree_name;
		if(currentOperationTreeName == null){
			$('#leftTopWrapper #node-type').css('visibility', 'hidden');
			d3.select("svg.radial").selectAll('*').remove();
			return;
		}
		$('#leftTopWrapper #node-type').css('visibility', 'visible');
		var treeRoot = null, isRollingOver = false, treeNumber = 0;
		for(var i = 0;i < selectionObjectArray.length;i++){
			if(selectionObjectArray[i].tree_name == currentOperationTreeName){
				treeRoot = selectionObjectArray[i].tree_root;
				isRollingOver = selectionObjectArray[i].is_rolling_over;
				treeNumber = selectionObjectArray[i].tree_number;
				break;
			}
		}
		var padding = 10;
		var spanHeight = $('#leftTopWrapper #node-type').height();
		var width = +$("#leftTopLeftWrapper-radial").width();
		var height = +$("#leftTopLeftWrapper-radial").height();
		var diameter = d3.min([width,height]);
		var eachTypeIdArray = new Array();
		var eachTypeIndexArray = new Array();
		var duration = 750;
		var tree = self.tree = d3.layout.tree()
			.size([360, diameter / 2 - 10])
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
			});
		var treeNodeList = [];
		if(treeRoot != null){
			treeNodeList = tree.nodes(treeRoot).reverse();
		}
		self.treeNodeList = treeNodeList;
		var index = 0;
		var diagonal = d3.svg.diagonal.radial()
			.projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });
		var svg = d3.select("svg.radial")
			.attr('width', width)
			.attr('height', height)
			.append('g')
			.attr("id","radial")
			.attr('transform', 'translate('+ width / 2 + ',' +  height / 2 +')');
		self._change_label_color(isRollingOver, treeNumber);
		self._draw_depth(4, treeNodeList, tree, width, height, treeRoot, isRollingOver);
	},
	_change_label_color: function(is_rolling_over, tree_number){
		$('#leftTopWrapper #node-type').html(tree_number);
		if(is_rolling_over){
			$('#leftTopWrapper #node-type').removeClass('blue-label');
			$('#leftTopWrapper #node-type').addClass('orange-label');			
		}else{
			$('#leftTopWrapper #node-type').removeClass('orange-label');
			$('#leftTopWrapper #node-type').addClass('blue-label');	
		}
	},
	_draw_depth: function(hide_depth, tree_node_list, tree, width, height, tree_root, is_rolling_over){
		var self = this;
		var rootA = tree_root;
		var iterator = 1;
		activeA = hide_depth;
		for(var i = 0;i < tree_node_list.length;i++){
			if(tree_node_list[i].depth < hide_depth){
				if(tree_node_list[i]._values){
					tree_node_list[i].values = tree_node_list[i]._values;
					tree_node_list[i]._values = null;
				}
			}else{
				if(tree_node_list[i].values){
					tree_node_list[i]._values = tree_node_list[i].values;
					tree_node_list[i].values = null;
				}
			}
		}
		var initialClear = true;
		_update(tree_node_list, initialClear);
		function _update(tree_node_list, initial_clear){
			var tip = d3.tip()
			  .attr('class', 'd3-radial-tip')
			  .offset([-10, 0])
			  .html(function(d) {
			    return "Name: <span style='color:#ff5858'>" +  d.key + "</span>"  + " flow:<span style='color:#ff5858'>" +  d3.format(".3s")(d.flow) + "</span>";//d.time +
			  });
			var nodes = tree_node_list,
				links = tree.links(nodes);
			var treeNodeNum = 0;
			var duration = 750;
			for(var i = 0;i < tree_node_list.length;i++){
				if(tree_node_list[i].depth==4){
					treeNodeNum++;
				}
			}
			var svg = d3.select("#radial");
			svg.call(tip);
			if(initial_clear){
				svg.selectAll('*').remove();
			}
			svg.call(tip);
			var diagonal = d3.svg.diagonal.radial()
				.projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });	
			var node = svg.selectAll(".radial-node")
				.data(nodes, function(d) {return d.id});
			var max_depth = 0;
			var nodeUpdate = node.transition().duration(duration)
			.attr("transform",function(d){
				return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
			});
			nodeUpdate.attr('class', function(d,i){
				var nodeClassArray = ['radial-node'];
				if(!is_rolling_over){
					nodeClassArray.push('blue-node');
					if(d.values == null){
						nodeClassArray.push(['radial-blue-node-shrink'])
					}
				}else{
					nodeClassArray.push('orange-node');
					if(d.values == null){
						nodeClassArray.push(['radial-orange-node-shrink'])
					}
				}
				return self._group_class(nodeClassArray);
			});
			var nodeEnter = node.enter().append("g")
				.attr("class", function(d,i){
					var nodeClassArray = ['radial-node'];
					if(!is_rolling_over){
						nodeClassArray.push('blue-node');
						if(d.values == null){
							nodeClassArray.push(['radial-blue-node-shrink'])
						}
					}else{
						nodeClassArray.push('orange-node');
						if(d.values == null){
							nodeClassArray.push(['radial-orange-node-shrink'])
						}
					}
					return self._group_class(nodeClassArray);
				})
				.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y) + ")"; })
				.attr("id", function(d) {
					var id = d.id;
					if(d.id != null){
						id = id.replace(';','');
					}
					return "radial-node-" + id;
				})
				.on("click",function(d,i){
					_unhighlight();
					var this_node = d3.select(this);
					_click(d, i, this_node, tree_root);
				})
				.on("mouseover", function(d) {
					var this_node = d3.select(this);
					var clickNode = {
						tree_label: dataCenter.global_variable.current_id,
						node: d,
					};
					dataCenter.global_variable.current_mouseover_signaltree = dataCenter.global_variable.current_operation_tree_name;
					ObserverManager.post("mouse-over", [d.id]);
					ObserverManager.post('mouseover-signal-tree', dataCenter.global_variable.current_operation_tree_name);
					dataCenter.set_global_variable('mouse_over_signal_node', clickNode);
					if(dataCenter.global_variable.enable_tooltip){
						tip.show(d);
					}
				})
				.on("mouseout", function(d) {
					ObserverManager.post("mouse-out", [d.id]);
					dataCenter.set_global_variable('mouse_over_signal_node', null);
					ObserverManager.post('mouseover-signal-tree', null);
					if(dataCenter.global_variable.enable_tooltip){
						tip.hide(d);
					}
				});
			var nodecircle = nodeEnter.append("circle")
				.attr("r", function(d,i){
					if(d.depth == 4){
						return 1;
					}
					if(d.depth == 3){
						return 2.5;
					}
					return (4.5 - d.depth) * 2;
				});
			if($("#radialcheckbox").attr("mark") == 2)
				nodecircle.attr("class","nodecircle2");

			node.exit().remove();

			var link = svg.selectAll("path.link")
				.data(links,function(d) { return d.target.id; });
			link.enter().insert("path", "g")
			  .attr("id",function(l){
			  	return "radial-link-" + l.target.id;
			  })
			  .attr("class", "link")
			  .attr("d", diagonal);
			link.transition().duration(duration)
				.attr("class", "link")
				.attr("d", diagonal);
			link.exit().remove();
		}
		function _click(d, i, this_node, tree_root) {
			var width = $("#leftTopLeftWrapper-radial").width();
			var height = $("#leftTopLeftWrapper-radial").height();
			var diameter = d3.min([width,height]);
			var tree = d3.layout.tree()
				.size([360, diameter / 2 - 20])
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
				});
			var treeNodeList;
			if((+d.flow) == 0)	return null;	
			_click_node_shrink(d);
			treeNodeList = tree.nodes(tree_root).reverse();
			var initialClear = false;
			_update(treeNodeList, initialClear);
		}
		function _click_node_shrink(d){
			if(dataCenter.global_variable.click_thisNode_shrink){
				if (d.values) {
					d._values = d.values;
					d.values = null;
				} else {
					d.values = d._values;
					d._values = null;
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
		}
		function _unhighlight(){
			var highlight_id_list = dataCenter.global_variable.radial_highlight_id_list;
			for(var i = 0; i < highlight_id_list.length; i++){
				d3.select("#radial-node-" + highlight_id_list[i]).classed("radial-route-node-inner",false);
				d3.select("#radial-link-" + highlight_id_list[i]).classed("radial-route-link",false);
				d3.select("#radial-node-" + highlight_id_list[i]).classed("node",true);
				d3.select("#radial-link-" + highlight_id_list[i]).classed("link",true);
			}
			dataCenter.set_global_variable('radial_highlight_id_list', []);
		}
	},
	_putnodesdepth: function(radialexpandmark, nodesIddepth, hide_depth){
		radialexpandmark = [];
		for(var i = hide_depth; i < 4; i++){
			for(var j = 0; j < nodesIddepth[i].length; j++){
				radialexpandmark.push(nodesIddepth[i][j].id);
			}
		}
		return radialexpandmark;
	},
	_highlight_subtree_and_route_from_root: function(id) {
		var self = this;
		var highlight_id_list = [];
		var treeNodeList = self.treeNodeList;
		var node,node1;
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
		self._put_subtree_node_id(node,highlight_id_list);
		for(var i = 0; i < highlight_id_list.length; i++){
			if(highlight_id_list[i] == id) continue;
			d3.select("#radial-node-" + highlight_id_list[i])
				.classed("radial-route-node-inner",true);
			d3.select("#radial-link-" + highlight_id_list[i])
				.classed("link",false);
			d3.select("#radial-link-" + highlight_id_list[i])
				.classed("radial-route-link",true);
		}
		d3.select("#radial-link-" + id).classed("link",false);
		d3.select("#radial-link-" + id).classed("radial-route-link",true);
		highlight_id_list.push(id);
		dataCenter.set_global_variable('radial_highlight_id_list', highlight_id_list);
	},
	_unhighlight_subtree_root: function(){
		var highlight_id_list = dataCenter.global_variable.radial_highlight_id_list;
		for(var i = 0; i < highlight_id_list.length; i++){
			d3.select("#radial-node-" + highlight_id_list[i]).classed("radial-route-node-inner",false);
			d3.select("#radial-link-" + highlight_id_list[i]).classed("radial-route-link",false);
			d3.select("#radial-node-" + highlight_id_list[i]).classed("node",true);
			d3.select("#radial-link-" + highlight_id_list[i]).classed("link",true);
		}
		dataCenter.set_global_variable('radial_highlight_id_list', []);
	},
	 _put_subtree_node_id: function(node,list){
	 	var self = this;
		if(node.values == undefined) return;
		for(var i = 0; i < node.values.length; i++){
			var tmpid = node.values[i].id.replace(';','');
			list.push(tmpid);
			self._put_subtree_node_id(node.values[i],list);
		}
	},
	change_label_color_to_blue: function(){
		$('#leftTopWrapper #node-type').removeClass('orange-label');		
		$('#leftTopWrapper #node-type').addClass('blue-label');
	},
	change_label_color_to_orange: function(){
		$('#leftTopWrapper #node-type').removeClass('blue-label');		
		$('#leftTopWrapper #node-type').addClass('orange-label');
	},
	change_label_text: function(label){
		$('#leftTopWrapper #node-type').html(label);		
	},
	_group_class: function(class_name_array){
	 	var className = '';
	 	for(var i = 0;i < class_name_array.length;i++){
	 		className = className + ' ' + class_name_array[i];
	 	}
	 	return className;
	},
	OMListen: function(message, data){
		var idPrefix = "#radial-node-";
		var svg = d3.select('#radial');
		var self = this;
		if (message == "highlight") {
			svg.selectAll(".highlight").classed("highlight", false)
			svg.selectAll(".half-highlight").classed("half-highlight", false)
			for (var i = 0; i < data.length; i++) {
				if(data[i] != null){
					data[i] = data[i].replace(';','');
				}
				svg.select(idPrefix + data[i]).classed("highlight", true);
				svg.select(idPrefix + data[i]).each(function(d) {
					if (d == null) return;
					var node = d.parent;
					while (node != null) {
						svg.select(idPrefix + node.id).classed("half-highlight", true);
						node = node.parent;
					}
				})				
			}
		}
        if(message == "mouse-over"){
        	var self = this;
        	var currentOperationTreeName = dataCenter.global_variable.current_operation_tree_name;
        	var currentMouseoverSignalTree = dataCenter.global_variable.current_mouseover_signaltree;
        	if(currentOperationTreeName == currentMouseoverSignalTree){
	        	for (var i = 0; i < data.length; i++) {
	        		if(data[i] != null){
						data[i] = data[i].replace(';','');
					}
					self._highlight_subtree_and_route_from_root(data[i]);
					svg.select(idPrefix + data[i]).classed("focus-highlight", true);
					if (svg.select(idPrefix + data[i]).data().length > 0) {
						var nodeData = svg.select(idPrefix + data[i]).data()[0];
					}
				}
			}
        }
        if(message == "mouse-out"){
        	var self = this;
        	for(var i = 0; i < data.length; i++) {
        		if(data[i] != null){
					data[i] = data[i].replace(';','');
				}
				self._unhighlight_subtree_root();
				svg.select(idPrefix + data[i]).classed("focus-highlight", false);
			}
        }
        if(message == 'draw-current-operation'){
			self._render_view();
		}
        if(message == "update-view"){
        	var self = this;
        	var currentId = dataCenter.global_variable.current_id;
        	var selectionArrray = dataCenter.global_variable.selection_array;
        	var tree_label = selectionArrray.indexOf(currentId);
        	if(currentId != null){
        		for(var i = 0;i < dataCenter.datasets.length;i++){
	        		if(currentId == dataCenter.datasets[i].id){
	        			var tree_root = dataCenter.datasets[i].processor.result.treeRoot;
	        			self._render_view(tree_root);
	        			break;
	        		}
	        	}
        	}
        	self.change_label_text(tree_label);
        }
        if(message == 'clean-view'){
        	svg.selectAll('*').remove();
        }
        if(message == "set:similar_id_array"){
        	var similarIdArray = dataCenter.global_variable.similar_id_array;
        	svg.selectAll('.node')
        	.classed('node-remove', true);
        	//classed('opacity-non-similar', true);
        	for(var i = 0;i < similarIdArray.length;i++){
        		svg.select('#radial-node-' + similarIdArray[i]).classed('node-remove', false);//style('opacity', '1');
        	}
        }
        if(message == 'show-all'){
        	svg.selectAll('.node')
        	.classed('node-remove', false);
        }
	}
}