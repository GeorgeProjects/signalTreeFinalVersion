/**
 * sunburst guozhengli
 */
var sunburstView = {
	name: 'sunburst',
	nodeIdPrefix: 'sunburst-node-',
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
		var nodeIdPrefix = self.nodeIdPrefix;
		var selectionObjectArray = dataCenter.global_variable.selection_object_array;
		var currentOperationTreeName = dataCenter.global_variable.current_operation_tree_name;	
		if(currentOperationTreeName == null){
			d3.select("svg.sunburst").selectAll('*').remove();
			return;
		}
		var treeRoot = null, isRollingOver = false, treeNumber = 0;
		for(var i = 0;i < selectionObjectArray.length;i++){
			if(selectionObjectArray[i].tree_name == currentOperationTreeName){
				treeRoot = selectionObjectArray[i].tree_root;
				isRollingOver = selectionObjectArray[i].is_rolling_over;
				treeNumber = selectionObjectArray[i].tree_number;
				break;
			}
		}
		var tree = d3.layout.tree()
			.size([360, diameter / 2 - 10])
			.children(function(d){
				if(Array.isArray(d.values)) return d.values;
				return undefined;
			});
		if(treeRoot != null){
			self.treeNodeList = tree.nodes(treeRoot).reverse();
		}
		var margin = {
			top: 15,
			left: 15,
			right: 15, 
			bottom: 15
		}
		var spanHeight = $('#leftTopWrapper #node-type').height();
		var width = +$("#leftTopLeftWrapper-sunburst").width() - margin.left - margin.right;
		var height = +$("#leftTopLeftWrapper-sunburst").height() - margin.top - margin.bottom;
		var diameter = d3.min([width,height]);
		var radius = diameter / 2;
		var color = d3.scale.category20c();
		var svg = d3.select("svg.sunburst")
			.attr('width', (width + margin.left + margin.right))
			.attr('height', (height + margin.top + margin.bottom))
			.append('g')
			.attr("id","sunburstG")
			.attr('transform', 'translate('+ (width / 2 + margin.left / 2) + ',' +  (height / 2 + margin.top / 2) +')');
		var tip = d3.tip()
		  .attr('class', 'd3-radial-tip')
		  .offset([-10, 0])
		  .html(function(d) {
		    return "Name: <span style='color:#ff5858'>" + d.key + "</span>"  + " flow:<span style='color:#ff5858'>" + d3.format(".3s")(d.value)+ "</span>";
		  });
		svg.call(tip);
		var partition = d3.layout.partition()
		    .sort(null)
		    .size([2 * Math.PI, radius * radius])
		    .value(function(d) { return +d.flow; });	    
		var changSizeArc = d3.svg.arc()
		    .startAngle(function(d) {
		      return d.x; 
		    })
		    .endAngle(function(d) { return d.x + d.dx; })
		    .innerRadius(function(d) { 
		    	return Math.sqrt(d.y); 
		    })
		    .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });
		var notChangeSizeArc = d3.svg.arc()
		    .startAngle(function(d) {
		      return d.x; 
		    })
		    .endAngle(function(d) { return d.x + d.dx; });
		update();
		function update(){
			var maxDepth = dataCenter.GLOBAL_STATIC.MAX_DEPTH;
			d3.selectAll('.sunburst-node').remove();
			var svg = d3.select('#sunburstG');
			var path = svg.datum(treeRoot).selectAll(".sunburst-node")
	      		.data(partition.nodes);

	    		path.enter()
	    		.append("path")
	    		.attr('id', function(d,i){
	    			return nodeIdPrefix + d.id;
	    		})
	    		.attr('class', function(d,i){
	    			var classNameArray = ['sunburst-node'];
	    			if(!isRollingOver){
	    				if((d.children == null) && (d._children != null)){
	    					classNameArray.push('blue-sunburst-node-shrink');
	    				}else{
	    					classNameArray.push('blue-sunburst-node');
	    				}
	    			}else{
	    				if((d.children == null) && (d._children != null)){
	    					classNameArray.push('orange-sunburst-node-shrink');
	    				}else{
	    					classNameArray.push('orange-sunburst-node');
	    				}
	    			}
					return self._group_class(classNameArray);
	    		})
	      		.attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
	      		.attr("d", changSizeArc)
	      		//.style("fill-rule", "evenodd")
	      		.on('mouseover', function(d,i){
	      			dataCenter.global_variable.current_mouseover_signaltree = dataCenter.global_variable.current_operation_tree_name;
	      			ObserverManager.post("mouse-over", [d.id]);
	      			ObserverManager.post('mouseover-signal-tree', dataCenter.global_variable.current_operation_tree_name);
	      			if(dataCenter.global_variable.enable_tooltip){
	      				tip.show(d);
	      			}
	      		})
	      		.on('mouseout', function(d,i){
	      			dataCenter.set_global_variable('mouse_over_signal_node', null);
	      			ObserverManager.post("mouse-out", [d.id]);
	      			ObserverManager.post('mouseover-signal-tree', null);
	      			tip.hide(d);
	      		})
	      		.on('click', function(d,i){
	      			_click_handler(d);
	      		})
	      		.each(stash);

	      		path.attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
	      		.attr('class', function(d,i){
	    			var classNameArray = ['sunburst-node'];
	    			if(!isRollingOver){
	    				if((d.children == null) && (d._children != null)){
	    					classNameArray.push('blue-sunburst-node-shrink');
	    				}else{
	    					classNameArray.push('blue-sunburst-node');
	    				}
	    			}else{
	    				if((d.children == null) && (d._children != null)){
	    					classNameArray.push('orange-sunburst-node-shrink');
	    				}else{
	    					classNameArray.push('orange-sunburst-node');
	    				}
	    			}
					return self._group_class(classNameArray);
	    		})
	      		.attr("d", changSizeArc);

	      		path.exit().remove();	
		}	
		// Stash the old values for transition.
		function stash(d) {
		  d.x0 = d.x;
		  d.dx0 = d.dx;
		}
		// Interpolate the arcs in data space.
		function arcTween(a) {
		  var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
		  return function(t) {
		    var b = i(t);
		    a.x0 = b.x;
		    a.dx0 = b.dx;
		    return arc(b);
		  };
		}
		function _click_handler(d){
			if(dataCenter.global_variable.click_thisNode_shrink){
				if(d.children != null){
					d._children = d.children;
					d.children = null;
				}else{
					d.children = d._children;
					d._children = null;
				}
			}else{
				var thisNodeID = d.id;
				var thisNodeParent = d.parent;
				if(thisNodeParent != undefined){
					var thisNodeSibling = thisNodeParent.children;
					for(var i = 0;i < thisNodeSibling.length;i++){
						if(thisNodeSibling[i].id != thisNodeID){
							if (thisNodeSibling[i].children) {
								thisNodeSibling[i]._children = thisNodeSibling[i].children;
								thisNodeSibling[i].children = null;
							}else{
								thisNodeSibling[i].children = thisNodeSibling[i]._children;
								thisNodeSibling[i]._children = null;
							}
						}
					}
				}
			}
			update();
		}
	},
	//将需要的class组合在一起的到元素的class
	 _group_class: function(class_name_array){
	 	var className = '';
	 	for(var i = 0;i < class_name_array.length;i++){
	 		className = className + ' ' + class_name_array[i];
	 	}
	 	return className;
	 },
	_highlight_subtree_and_route_from_root: function(id) {
		var self = this;
		var nodeIdPrefix = self.nodeIdPrefix;
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
		var svg = d3.select('svg.sunburst');
		self._put_subtree_node_id(node,highlight_id_list);
		for(var i = 0; i < highlight_id_list.length; i++){
			if(highlight_id_list[i] == id) continue;
			svg.select("#" + nodeIdPrefix + highlight_id_list[i])
				.classed("mouseover-children-parent-highlight",true);
		}
		highlight_id_list.push(id);
		dataCenter.set_global_variable('radial_highlight_id_list', highlight_id_list);
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
	_unhighlight_subtree_root: function(){
		var nodeIdPrefix = self.nodeIdPrefix;
		var svg = d3.select('svg.sunburst');
		var highlight_id_list = dataCenter.global_variable.radial_highlight_id_list;
		for(var i = 0; i < highlight_id_list.length; i++){
			svg.select("#" + nodeIdPrefix + highlight_id_list[i]).classed("mouseover-children-parent-highlight",false);
		}
		svg.selectAll('.sunburst-node').classed('mouseover-children-parent-highlight', false);
		dataCenter.set_global_variable('radial_highlight_id_list', []);
	},
	OMListen: function(message, data){
		var self = this;
		var nodeIdPrefix = self.nodeIdPrefix;
		var svg = d3.select('svg.sunburst');
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
					svg.select('#' + nodeIdPrefix + data[i]).classed("focus-highlight", true);
					if (svg.select(nodeIdPrefix + data[i]).data().length > 0) {
						var nodeData = svg.select(nodeIdPrefix + data[i]).data()[0];
					}
				}
			}
        }
        if(message == 'draw-current-operation'){
			self._render_view();
		}
        if(message == "mouse-out"){
        	var self = this;
        	for(var i = 0; i < data.length; i++) {
        		if(data[i] != null){
					data[i] = data[i].replace(';','');
				}
				self._unhighlight_subtree_root();
				svg.select('#' + nodeIdPrefix + data[i]).classed("focus-highlight", false);
			}
        }
        if (message == "highlight") {
			svg.selectAll(".highlight").classed("highlight", false)
			svg.selectAll(".parset-highlight").classed("parset-highlight", false)
			for (var i = 0; i < data.length; i++) {
				if(data[i] != null){
					data[i] = data[i].replace(';','');
				}
				svg.select('#' + nodeIdPrefix + data[i]).classed("highlight", true);
				svg.select('#' + nodeIdPrefix + data[i]).each(function(d) {
					if (d == null) return;
					var node = d.parent;
					while (node != null) {
						svg.select('#' + nodeIdPrefix + node.id).classed("parset-highlight", true);
						node = node.parent;
					}
				})				
			}
		}
	}
}