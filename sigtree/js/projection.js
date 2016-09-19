var projection = {
	name:'projection-view',
	nodeIdPrefix: 'projection-tree-', 
	initialize: function(){
		var self = this;
		self._add_to_listener();
		self._bind_view();
		self._render_view();
	},
	_add_to_listener: function(){
		var self = this;
		ObserverManager.addListener(self);
	},
	_bind_view: function(){
	},
	_render_view: function(){
		var self = this;
		var padding  = 10;
		var svgWidth = $('#projectionWrapper').width(); 
		var svgHeight = $('#projectionWrapper').height();
		var margin = {top: 10, bottom: 10, right: 10, left: 10}
			width = svgWidth - margin.left - margin.right;
			height = svgHeight - margin.top - margin.bottom;
		var nodeIdPrefix = self.nodeIdPrefix;
		var tip = d3.tip()
		  .attr('class', 'd3-tip')
		  .offset([-10, 0])
		  .html(function(d) {
		  	console.log(d);
		    return "Date: <span style='color:#ff5858'>" + d[2] + "</span>";
		  });
		var svg = d3.select('svg.projection')
			.attr('width', svgWidth)
			.attr('height', svgWidth)
			.append('g')
			.attr('id', 'projection')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
		svg.call(tip);
		svg.selectAll('*').remove();
		svg.append('rect')
			.attr('id', 'projection-background')
			.attr('width', width)
			.attr('height', height)
			.attr('x', 0)
			.attr('y', 0)
			.style('opacity', 0)
			.on('mouseover', function(){
				svg.selectAll('.projection-nodes').classed('mouseover-highlight', false);
				ObserverManager.post('mouseout-signal-tree', null);
			});
		var selectionArray = dataCenter.global_variable.selection_array;
		var mdsByDistance = window["MDS"]["byDistance"];
		var coordinate = mdsByDistance(dataCenter.distanceMatrix);
		var nodeNum = coordinate.length;
		var nodeLocation = new Array(nodeNum);
		self.nodeLocation = nodeLocation;
		for(var i = 0;i < nodeNum;i++){
			nodeLocation[i] = new Array();
			nodeLocation[i][0] = coordinate[i][0] * width;
			nodeLocation[i][1] = coordinate[i][1] * height;
			nodeLocation[i][2] = dataCenter.distanceObject[i].fileName;
		}
		//self.draw_link(nodeLocation);	
		//对于绘制的节点数组进行排序，避免重叠的现象
		nodeLocation.sort(function(a, b){
			return selectionArray.indexOf(b[2]) - selectionArray.indexOf(a[2]);
		});
		var sigTreeNode = svg.selectAll(".projection-nodes")
	    .data(nodeLocation)

	  	sigTreeNode.enter()
	  	.append("circle")
	  	.attr('class', function(d,i){
	  		var classNameArray = ['projection-nodes'];
			return self._group_class(classNameArray);
	  	})
		.attr('id', function(d,i){
			return nodeIdPrefix + d[2];
		})
		.attr('cx', function(d,i){
			return d[0];
		})
		.attr('cy', function(d,i){
			return d[1];
		})
	    .on('mouseover', function(d,i){
			//send message, highlight the corresponding histogram
			ObserverManager.post('mouseover-signal-tree', d[2]);
		})
		.on('mouseout', function(d,i){
			ObserverManager.post('mouseout-signal-tree', d[2]);
		})
		.on('click', function(d,i){
			ObserverManager.post('click-signal-tree', d[2]);
		});

		sigTreeNode.attr('class', function(d,i){
	  		var classNameArray = ['projection-nodes']
			return self._group_class(classNameArray);
	  	})
		.attr('id', function(d,i){
			return nodeIdPrefix + d[2];
		})
		.attr('cx', function(d,i){
			return d[0];
		})
		.attr('cy', function(d,i){
			return d[1];
		})
	    .on('mouseover', function(d,i){
			//send message, highlight the corresponding histogram
			ObserverManager.post('mouseover-signal-tree', d[2]);
			tip.show(d);
		})
		.on('mouseout', function(d,i){
			ObserverManager.post('mouseout-signal-tree', d[2]);
			tip.hide(d);
		})
		.on('click', function(d,i){
			ObserverManager.post('click-signal-tree', d[2]);
		});
		sigTreeNode.exit().remove();
		self._draw_current_selection();
		self._draw_current_operation();

	},
	//绘制当前选择信号树
	_draw_current_selection: function(){
		var self = this;
		var svg = d3.select('#projection');
		var selectionObjectArray = dataCenter.global_variable.selection_object_array;
		var nodeIdPrefix = self.nodeIdPrefix;
		//清空前期选择的节点
		svg.selectAll('.projection-nodes').classed('selection-highlight-negative', false);
		svg.selectAll('.projection-nodes').classed('selection-highlight-positive', false);
		for(var i = 0;i < selectionObjectArray.length;i++){
			if(selectionObjectArray[i].is_rolling_over){
				svg.select('#' + nodeIdPrefix + selectionObjectArray[i].tree_name).classed('selection-highlight-negative', true);
				svg.select('#' + nodeIdPrefix + selectionObjectArray[i].tree_name).classed('selection-highlight-positive', false);
			}else{
				svg.select('#' + nodeIdPrefix + selectionObjectArray[i].tree_name).classed('selection-highlight-positive', true);
				svg.select('#' + nodeIdPrefix + selectionObjectArray[i].tree_name).classed('selection-highlight-negative', false);
			}
		}
		//self._put_selection_node_top();
	},
	//绘制当前鼠标悬停信号树
	_draw_current_hover: function(){
		var self = this;
		var svg = d3.select('#projection');
		var nodeIdPrefix = self.nodeIdPrefix;
		var signalTreeTime = dataCenter.global_variable.hover_tree_name;
		svg.selectAll('.projection-nodes').classed('thinner-draw-hover-link', true);
		svg.selectAll('.projection-nodes').classed('mouseover-highlight', false);
		//在将节点移动到另外一个节点之前需要将选择的信号树重新绘制一遍，从而保证当前选择的信号树不会被覆盖
		self._draw_current_selection();
		if(signalTreeTime != null){
			svg.select('#' + nodeIdPrefix + signalTreeTime).classed('mouseover-highlight', true);
			//self._re_draw_node(svg.select('#' + nodeIdPrefix + signalTreeTime));
		}
	},
	_remove_current_hover: function(){
		var self = this;
		var svg = d3.select('#projection');
		svg.selectAll('.projection-nodes')
			.classed('thinner-draw-hover-link', false);
		self._draw_current_selection();
	},
	_draw_current_operation: function(){
		var self = this;
		var svg = d3.select('#projection');
		var nodeIdPrefix = self.nodeIdPrefix;
		svg.selectAll('.current-operation-highlight').classed('current-operation-highlight', false);
		var operationSignalTreeName = dataCenter.global_variable.current_operation_tree_name;
		svg.select('#' + nodeIdPrefix + operationSignalTreeName)
			.classed('current-operation-highlight', true);
		self._put_selection_node_top();
	},
	//将需要的class组合在一起的到元素的class
	 _group_class: function(class_name_array){
	 	var className = '';
	 	for(var i = 0;i < class_name_array.length;i++){
	 		className = className + ' ' + class_name_array[i];
	 	}
	 	return className;
	 },
	 _put_selection_node_top: function(){
	 	var self = this;
	 	var svg = d3.select('#projection');
	 	svg.selectAll('.selection-highlight-positive')
	 	.each(function(d,i){
	 		var thisNode = d3.select(this);
	 		self._re_draw_node(thisNode);
	 	});
	 	svg.selectAll('.selection-highlight-negative')
	 	.each(function(d,i){
	 		var thisNode = d3.select(this);
	 		self._re_draw_node(thisNode);
	 	});
	 },
	_re_draw_node: function(this_node){
		console.log('re-draw-nodes');
		var self = this;
		var nodeIdPrefix = self.nodeIdPrefix;
		var svg = d3.select('#projection');
		var thisClass = this_node.attr('class');
		var thisId = this_node.attr('id');
		var thisCx = +this_node.attr('cx');
		var thisCy = +this_node.attr('cy');
		svg.append('circle')
			.attr('class', function(d,i){
				return thisClass;
			})
			.attr('id', function(d,i){
				return thisId;
			})
			.attr('cx', thisCx)
			.attr('cy', thisCy)
			.on('mouseover', function(d,i){
				console.log('mouseover signal-tree');
				var thisId = d3.select(this).attr('id');
				var thisName = thisId.replace(nodeIdPrefix,'');
				ObserverManager.post('mouseover-signal-tree', thisName);
			})
			.on('mouseout', function(d,i){
				console.log('mouseover signal-tree');
				var thisId = d3.select(this).attr('id');
				var thisName = thisId.replace(nodeIdPrefix,'');
				ObserverManager.post('mouseout-signal-tree', thisName);
			})
			.on('click', function(d,i){
				console.log('click signal-tree');
				var thisId = d3.select(this).attr('id');
				var thisName = thisId.replace(nodeIdPrefix,'');
				ObserverManager.post('click-signal-tree', thisName);
			});
		this_node.remove();
	},
	OMListen: function(message, data){
		var self = this;
		if(message == 'draw-current-selection'){
			self._draw_current_selection();
		}else if(message == 'draw-current-operation'){
			self._draw_current_operation();
		}else if(message == 'draw-current-hover'){
			self._draw_current_hover();
		}else if(message == 'remove-current-hover'){
			self._remove_current_hover();
		}
	}
}